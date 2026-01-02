import { useState, useRef } from "react";
import imageCompression from "browser-image-compression";
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
import { Loader2, Wallet, Copy, CheckCircle, Upload, X, Image } from "lucide-react";

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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const resetLoadingState = () => {
    setIsLoading(false);
    setUploadProgress("");
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 0.8, // Reduced to 0.8MB for better mobile performance
      maxWidthOrHeight: 1600, // Reduced resolution
      useWebWorker: false, // Disable web worker for better mobile compatibility
      fileType: "image/jpeg",
      initialQuality: 0.75,
    };

    try {
      console.log("[COMPRESS] Starting compression...");
      console.log("[COMPRESS] Original:", file.name, (file.size / 1024 / 1024).toFixed(2), "MB", file.type);

      const compressedFile = await imageCompression(file, options);

      console.log("[COMPRESS] Compressed:", (compressedFile.size / 1024 / 1024).toFixed(2), "MB");
      return compressedFile;
    } catch (error: any) {
      console.error("[COMPRESS] Error:", error);
      throw new Error("Compression failed: " + (error.message || "Unknown error"));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("[FILE] No file selected");
      return;
    }

    console.log("[FILE] Selected:", file.name, file.type, (file.size / 1024 / 1024).toFixed(2), "MB");

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      console.error("[FILE] Invalid type:", file.type);
      toast({ title: "Invalid file", description: "Please select an image", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setUploadProgress("Processing image...");

    // Set timeout to prevent infinite loading (30 seconds)
    timeoutRef.current = setTimeout(() => {
      console.error("[TIMEOUT] File processing timeout");
      toast({
        title: "Processing timeout",
        description: "Image processing took too long. Please try a smaller image.",
        variant: "destructive",
      });
      resetLoadingState();
    }, 30000);

    try {
      // Always compress images for mobile
      console.log("[PROCESS] Starting compression...");
      setUploadProgress("Compressing image...");
      const processedFile = await compressImage(file);

      // Check compressed file size
      if (processedFile.size > 5 * 1024 * 1024) {
        console.error("[PROCESS] File still too large:", (processedFile.size / 1024 / 1024).toFixed(2), "MB");
        toast({
          title: "File too large",
          description: "Please use a smaller image.",
          variant: "destructive",
        });
        resetLoadingState();
        return;
      }

      console.log("[PROCESS] Creating preview...");
      setUploadProgress("Creating preview...");
      setSelectedFile(processedFile);

      // Create preview with timeout
      const reader = new FileReader();
      const readerTimeout = setTimeout(() => {
        console.error("[READER] Preview timeout");
        reader.abort();
        toast({ title: "Error", description: "Failed to create preview", variant: "destructive" });
        resetLoadingState();
      }, 10000);

      reader.onload = (event) => {
        clearTimeout(readerTimeout);
        console.log("[READER] Preview created successfully");
        setPreviewUrl(event.target?.result as string);
        resetLoadingState();
      };

      reader.onerror = (error) => {
        clearTimeout(readerTimeout);
        console.error("[READER] Error:", error);
        toast({ title: "Error", description: "Failed to read image", variant: "destructive" });
        resetLoadingState();
      };

      reader.readAsDataURL(processedFile);
    } catch (error: any) {
      console.error("[PROCESS] Error:", error);
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process image",
        variant: "destructive",
      });
      resetLoadingState();
    }
  };

  const clearFile = () => {
    console.log("[CLEAR] Clearing file");
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadToSupabase = async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const fileName = `${userId}/${timestamp}.jpg`; // Always use .jpg extension

    console.log("[UPLOAD] Starting upload:", fileName, (file.size / 1024 / 1024).toFixed(2), "MB");
    setUploadProgress("Uploading to server...");

    try {
      // Upload with timeout
      const uploadPromise = supabase.storage.from("payment-proofs").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: "image/jpeg",
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Upload timeout after 60 seconds")), 60000);
      });

      const { data, error } = (await Promise.race([uploadPromise, timeoutPromise])) as any;

      if (error) {
        console.error("[UPLOAD] Supabase error:", {
          message: error.message,
          status: error.status,
          statusCode: error.statusCode,
          fileName: fileName,
          fileSize: file.size,
          fileType: file.type,
        });
        throw new Error("Upload failed: " + error.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(data.path);

      console.log("[UPLOAD] Success:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error: any) {
      console.error("[UPLOAD] Error:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
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

    console.log("[SUBMIT] Starting submission...");
    setIsLoading(true);
    setUploadProgress("Starting upload...");

    // Set timeout for entire submission (90 seconds)
    timeoutRef.current = setTimeout(() => {
      console.error("[SUBMIT] Submission timeout");
      toast({
        title: "Upload timeout",
        description: "Upload took too long. Please check your connection and try again.",
        variant: "destructive",
      });
      resetLoadingState();
    }, 90000);

    try {
      // Upload file to Supabase Storage
      const imageUrl = await uploadToSupabase(selectedFile);

      console.log("[SUBMIT] Saving to database...");
      setUploadProgress("Saving request...");

      // Save deposit request
      const { error: insertError } = await supabase.from("deposit_requests").insert({
        user_id: userId,
        amount: depositAmount,
        bank_reference: bankReference || null,
        payment_proof_url: imageUrl,
      });

      if (insertError) {
        console.error("[SUBMIT] Database error:", insertError);
        throw new Error("Failed to save: " + insertError.message);
      }

      console.log("[SUBMIT] Success!");
      toast({
        title: "Success!",
        description: "Deposit request submitted for review",
      });

      // Reset form
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
      resetLoadingState();
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

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Payment Screenshot</Label>

            {!previewUrl ? (
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => !isLoading && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isLoading}
                />
                {isLoading ? (
                  <>
                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">{uploadProgress}</p>
                    <p className="text-xs text-muted-foreground mt-1">Please wait...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Tap to upload screenshot</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP • Auto-compressed</p>
                  </>
                )}
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
                  <Image className="w-4 h-4" />
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
