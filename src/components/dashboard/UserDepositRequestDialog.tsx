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

interface UserDepositRequestDialogProps {
  userId: string;
  onSuccess?: () => void;
}

const BANK_DETAILS = {
  merchantName: "Mountain Dweller",
  accountNumber: "03064121334",
  iban: "PK35JSBL9999903064121334",
  tillNumber: "946336009",
  bank: "JS Bank",
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

    if (!file.type.startsWith("image/")) {
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

  const compressImage = async (file: File): Promise<File> => {
    const fileSizeMB = file.size / 1024 / 1024;
    console.log("[COMPRESS] Original size:", fileSizeMB.toFixed(2), "MB");
    
    // Skip compression if file is already small (under 500KB)
    if (file.size <= 500 * 1024) {
      console.log("[COMPRESS] File already small, skipping compression");
      return file;
    }
    
    setUploadProgress("Compressing image...");
    
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: false,
      fileType: "image/jpeg" as const,
      initialQuality: 0.7,
    };
    
    try {
      // Set a timeout for compression to prevent hanging
      const compressionPromise = imageCompression(file, options);
      const timeoutPromise = new Promise<File>((_, reject) => 
        setTimeout(() => reject(new Error("Compression timeout")), 10000)
      );
      
      const compressedFile = await Promise.race([compressionPromise, timeoutPromise]);
      console.log("[COMPRESS] Compressed size:", (compressedFile.size / 1024 / 1024).toFixed(2), "MB");
      return compressedFile;
    } catch (error) {
      console.error("[COMPRESS] Compression failed/timeout, using original:", error);
      return file;
    }
  };

  const uploadViaFormData = async (file: File, depositAmount: number, reference: string): Promise<void> => {
    console.log("[UPLOAD] Starting upload process, file size:", (file.size / 1024).toFixed(0), "KB");
    
    // Get session token first
    setUploadProgress("Checking session...");
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("[UPLOAD] Session error:", sessionError);
      throw new Error("Session error - please log in again");
    }
    if (!session) {
      throw new Error("Please log in again");
    }

    console.log("[UPLOAD] Session valid, user:", session.user.id);

    // Compress image to reduce upload time
    let uploadFile = file;
    try {
      uploadFile = await compressImage(file);
    } catch (compressError) {
      console.warn("[UPLOAD] Compression failed, using original file:", compressError);
    }
    
    console.log("[UPLOAD] Final file size:", (uploadFile.size / 1024).toFixed(0), "KB");
    setUploadProgress("Uploading...");

    const formData = new FormData();
    formData.append("file", uploadFile, uploadFile.name || "payment-proof.jpg");
    formData.append("amount", depositAmount.toString());
    formData.append("bankReference", reference || "");

    const supabaseUrl = "https://xqyiqzqgshjibxdujzvv.supabase.co";
    const uploadUrl = `${supabaseUrl}/functions/v1/upload-payment-proof`;
    
    console.log("[UPLOAD] Sending to:", uploadUrl);

    // 60 second timeout for slow connections
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error("[UPLOAD] Request timed out after 60s");
      controller.abort();
    }, 60000);

    try {
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("[UPLOAD] Response received, status:", response.status);

      const responseText = await response.text();
      console.log("[UPLOAD] Response body:", responseText.substring(0, 200));
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        console.error("[UPLOAD] Failed to parse response as JSON");
        throw new Error("Server returned invalid response");
      }

      if (!response.ok || !result.success) {
        console.error("[UPLOAD] Server error:", result.error);
        throw new Error(result.error || `Upload failed (${response.status})`);
      }

      console.log("[UPLOAD] Success! URL:", result.url);
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("[UPLOAD] Fetch error:", error.name, error.message);
      if (error.name === "AbortError") {
        throw new Error("Upload timed out - please try with a smaller image or better connection");
      }
      throw error;
    }
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

    console.log("[SUBMIT] Starting...");
    setIsLoading(true);
    setUploadProgress("Starting upload...");

    try {
      // Upload via FormData - most reliable for mobile
      await uploadViaFormData(selectedFile, depositAmount, bankReference);

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
          {/* Bank Details */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-foreground">Bank Transfer Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Bank:</span>
                <span className="font-medium">{BANK_DETAILS.bank}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Account Title:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{BANK_DETAILS.merchantName}</span>
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
                <span className="text-muted-foreground">Account #:</span>
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
                <span className="text-muted-foreground">Till #:</span>
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
