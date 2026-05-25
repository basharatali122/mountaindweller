import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wallet, Copy, CheckCircle, X, Image as ImageIcon, Upload } from "lucide-react";
import imageCompression from "browser-image-compression";
import paymentQrCode from "@/assets/payment-qr.jpeg";

// Detect mobile/legacy browsers where multipart uploads can hang
const isAndroid = () => /android/i.test(navigator.userAgent);
const isLegacyMobile = () => {
  const ua = navigator.userAgent;
  const androidVersion = ua.match(/Android\s([0-9.]+)/i)?.[1];
  const iosVersion = ua.match(/OS\s([0-9_]+)/i)?.[1]?.replace(/_/g, ".");
  const oldAndroid = androidVersion ? parseFloat(androidVersion) < 10 : false;
  const oldIos = iosVersion ? parseFloat(iosVersion) < 14 : false;
  return oldAndroid || oldIos || (isAndroid() && !window.AbortController);
};

const getImageType = (file: File) => file.type || (file.name.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg");

interface UserDepositRequestDialogProps {
  userId: string;
  onSuccess?: () => void;
}

const BANK_DETAILS = {
  merchantName: "Mountain Dweller Traders",
  accountNumber: "03006573733",
  iban: "PK82JCMA0201923006573733",
  tillNumber: "982222095",
  bank: "JazzCash / Raast",
};

export function UserDepositRequestDialog({ userId, onSuccess }: UserDepositRequestDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("[FILE] Selected:", file.name, file.type, (file.size / 1024 / 1024).toFixed(2), "MB");

    if (file.type && !file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image", variant: "destructive" });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed", variant: "destructive" });
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const clearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Hard timeout wrapper
  const withTimeout = <T,>(p: Promise<T>, ms: number, label: string): Promise<T> => {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
      p.then((v) => { clearTimeout(t); resolve(v); }).catch((e) => { clearTimeout(t); reject(e); });
    });
  };

  // Compress image - skip if already small, hard 15s timeout
  const compressImage = async (file: File): Promise<File> => {
    console.log("[COMPRESS] Original:", (file.size / 1024).toFixed(2), "KB");

    // Skip compression for small files - critical on Android where library can hang
    if (file.size < 800 * 1024) {
      console.log("[COMPRESS] Skipped - file already small");
      return file;
    }

    const legacyMobile = isLegacyMobile();
    const options = {
      maxSizeMB: legacyMobile ? 0.3 : isAndroid() ? 0.5 : 0.8,
      maxWidthOrHeight: legacyMobile ? 1000 : 1400,
      useWebWorker: false,
      fileType: "image/jpeg" as const,
      initialQuality: legacyMobile ? 0.62 : 0.75,
    };

    try {
      const compressed = await withTimeout(imageCompression(file, options), 15000, "Compression");
      console.log("[COMPRESS] Compressed:", (compressed.size / 1024).toFixed(2), "KB");
      return compressed;
    } catch (err) {
      console.warn("[COMPRESS] Failed, using original:", err);
      return file;
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return withTimeout(
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || "");
          resolve(result.includes(",") ? result.split(",")[1] : result);
        };
        reader.onerror = () => reject(new Error("Could not read image. Please try another screenshot."));
        reader.readAsDataURL(file);
      }),
      20000,
      "Image reading"
    );
  };

  const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number) => {
    const controller = window.AbortController ? new AbortController() : null;
    const timeout = new Promise<Response>((_, reject) => {
      const timeoutId = setTimeout(() => {
        controller?.abort();
        reject(new Error("Upload timed out"));
      }, timeoutMs);

      fetch(url, { ...options, signal: controller?.signal })
        .then((response) => {
          clearTimeout(timeoutId);
          resolve(response);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });

    return timeout;
  };

  const uploadViaBase64 = async (file: File, token: string): Promise<string> => {
    console.log("[UPLOAD] Using base64 mobile-safe upload");
    setUploadProgress("Preparing mobile upload...");
    const base64File = await fileToBase64(file);
    setUploadProgress("Uploading image...");

    const response = await fetchWithTimeout(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-payment-proof`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file: base64File,
          fileName: file.name || "proof.jpg",
          fileType: getImageType(file),
          amount,
          bankReference: bankReference || "",
        }),
      },
      120000
    );

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || "Upload failed");
    }

    return result.url;
  };

  // Upload via Edge Function. Older mobiles use base64 JSON to avoid multipart hangs.
  const uploadViaEdgeFunction = async (file: File, retryCount = 0): Promise<string> => {
    console.log("[UPLOAD] Attempt:", retryCount + 1, "size:", (file.size / 1024).toFixed(2), "KB", "Android:", isAndroid());

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      throw new Error("Session expired. Please login again.");
    }

    const token = sessionData.session.access_token;

    if (isLegacyMobile()) {
      return uploadViaBase64(file, token);
    }

    try {
      const formData = new FormData();
      formData.append("file", file, file.name || "proof.jpg");
      formData.append("amount", amount);
      formData.append("bankReference", bankReference || "");

      const response = await fetchWithTimeout(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-payment-proof`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
        isAndroid() ? 120000 : 60000
      );

      console.log("[UPLOAD] Status:", response.status);

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Upload failed");
      }
      console.log("[UPLOAD] Success");
      return result.url;
    } catch (err: any) {
      console.warn("[UPLOAD] FormData failed, trying mobile-safe fallback:", err);

      try {
        return await uploadViaBase64(file, token);
      } catch (fallbackError: any) {
        console.error("[UPLOAD] Base64 fallback failed:", fallbackError);
        err = fallbackError;
      }

      if (retryCount < 2 && (err.name === "AbortError" || err.message?.includes("network") || err.message?.includes("fetch"))) {
        console.log("[UPLOAD] Retry after:", err.message);
        await new Promise((r) => setTimeout(r, 2000));
        return uploadViaEdgeFunction(file, retryCount + 1);
      }

      if (err.name === "AbortError") {
        throw new Error("Upload timed out. Try a smaller image or better network.");
      }
      throw err;
    }
  };

  // Upload directly to Supabase Storage (for PC/iOS)
  const uploadDirectToStorage = async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split(".").pop() || "jpg";
    const filePath = `${userId}/${timestamp}_${randomStr}.${extension}`;

    console.log("[DIRECT-UPLOAD] Starting upload:", filePath);

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      throw new Error("Session expired. Please login again.");
    }

    const { data, error } = await supabase.storage
      .from("payment-proofs")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("[DIRECT-UPLOAD] Storage error:", error);
      throw new Error("Failed to upload file: " + error.message);
    }

    console.log("[DIRECT-UPLOAD] Upload successful:", data.path);

    const { data: urlData } = supabase.storage
      .from("payment-proofs")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!amount || !selectedFile) {
      toast({ title: "Missing info", description: "Enter amount and upload screenshot", variant: "destructive" });
      return;
    }

    const depositAmount = parseInt(amount);
    if (isNaN(depositAmount) || depositAmount < 1000) {
      toast({ title: "Invalid amount", description: "Minimum Rs. 1,000", variant: "destructive" });
      return;
    }

    console.log("[SUBMIT] Starting deposit request...");
    console.log("[SUBMIT] Device:", isAndroid() ? "Android" : "Other");
    setIsLoading(true);
    setUploadProgress("Compressing image...");

    try {
      // Step 1: Compress image
      const compressedFile = await compressImage(selectedFile);
      console.log("[SUBMIT] Compressed file ready:", (compressedFile.size / 1024).toFixed(2), "KB");
      
      setUploadProgress("Uploading image...");

      // Step 2: Use Edge Function for ALL devices (more reliable)
      // Edge Function handles both upload AND database insert
      await uploadViaEdgeFunction(compressedFile);
      console.log("[SUBMIT] Upload via Edge Function complete");

      console.log("[SUBMIT] Success!");
      toast({
        title: "Success!",
        description: "Deposit request submitted for review",
      });

      setAmount("");
      setBankReference("");
      clearFile();
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("[SUBMIT] Error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setUploadProgress("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full h-auto flex-col py-4 gap-2">
          <Wallet className="w-5 h-5" />
          <span className="text-xs">Add Funds</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Deposit Funds</DialogTitle>
          <DialogDescription>Transfer to our bank and upload payment screenshot</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* QR Code */}
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-foreground text-center">Scan QR to Pay</h3>
            <div className="flex justify-center">
              <img 
                src={paymentQrCode} 
                alt="JazzCash/Raast QR Code" 
                className="w-48 h-auto rounded-lg border-2 border-amber-200"
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Dial <strong>*786*10#</strong> and enter <strong>TILL ID: {BANK_DETAILS.tillNumber}</strong> to pay via JazzCash
            </p>
          </div>

          {/* Bank Details */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-foreground">Payment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-medium">{BANK_DETAILS.bank}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Account Name:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs">{BANK_DETAILS.merchantName}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(BANK_DETAILS.merchantName, "name")}
                  >
                    {copiedField === "name" ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Number:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{BANK_DETAILS.accountNumber}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(BANK_DETAILS.accountNumber, "account")}
                  >
                    {copiedField === "account" ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">IBAN:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-xs">{BANK_DETAILS.iban}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(BANK_DETAILS.iban, "iban")}
                  >
                    {copiedField === "iban" ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Till ID:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{BANK_DETAILS.tillNumber}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(BANK_DETAILS.tillNumber, "till")}
                  >
                    {copiedField === "till" ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (Rs.)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount (min. 1,000)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1000"
              disabled={isLoading}
            />
          </div>

          {/* Bank Reference */}
          <div className="space-y-2">
            <Label htmlFor="reference">Transaction ID (optional)</Label>
            <Input
              id="reference"
              placeholder="Bank transaction reference"
              value={bankReference}
              onChange={(e) => setBankReference(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* File Upload - Single Gallery Option */}
          <div className="space-y-2">
            <Label>Payment Screenshot</Label>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isLoading}
            />

            {!previewUrl ? (
              <div className="space-y-3">
                {isLoading ? (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">{uploadProgress}</p>
                    <p className="text-xs text-muted-foreground mt-1">Please wait...</p>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-24 flex-col gap-2 border-dashed border-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-6 h-6" />
                    <span className="text-sm">Choose Image from Gallery</span>
                  </Button>
                )}

                <p className="text-xs text-center text-muted-foreground">JPG, PNG • Max 5MB</p>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Payment proof preview"
                  className="w-full h-48 object-contain rounded-lg border bg-muted"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={clearFile}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <ImageIcon className="w-4 h-4" />
                  <span className="truncate">{selectedFile?.name}</span>
                  <span className="text-xs">({((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !selectedFile || !amount}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {uploadProgress || "Processing..."}
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
