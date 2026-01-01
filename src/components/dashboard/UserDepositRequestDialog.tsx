import { useState, useRef, useEffect, useCallback } from "react";
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
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Wallet, Copy, CheckCircle, ImageIcon, RefreshCw, WifiOff } from "lucide-react";

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

const isMobileDevice = (): boolean => {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// SIMPLIFIED compression - Better handling for mobile
const compressImage = async (file: File, maxSizeKB: number = 500): Promise<File> => {
  console.log("[Compress] Starting compression:", file.name, formatFileSize(file.size));

  // If file is already small enough, return as is
  if (file.size <= maxSizeKB * 1024) {
    console.log("[Compress] Already small enough:", formatFileSize(file.size));
    return file;
  }

  // Skip compression for certain mobile browsers if they have issues
  const userAgent = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.log("[Compress] Canvas context not available, returning original");
      resolve(file);
      return;
    }

    // Set a timeout for mobile devices
    const compressionTimeout = setTimeout(() => {
      console.log("[Compress] Compression timeout, returning original");
      URL.revokeObjectURL(img.src);
      resolve(file);
    }, 8000); // 8 second timeout

    img.onload = () => {
      clearTimeout(compressionTimeout);

      try {
        // Calculate new dimensions
        let { width, height } = img;
        const maxDimension = 1024; // Maximum dimension

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Try different quality levels
        const tryCompression = (quality: number, attempt: number): void => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                console.log("[Compress] Failed to create blob");
                resolve(file);
                return;
              }

              console.log(`[Compress] Attempt ${attempt}: quality=${quality}, size=${formatFileSize(blob.size)}`);

              if (blob.size <= maxSizeKB * 1024 || quality <= 0.3) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                console.log("[Compress] Success:", formatFileSize(compressedFile.size));
                URL.revokeObjectURL(img.src);
                resolve(compressedFile);
              } else {
                // Try lower quality
                tryCompression(Math.max(quality - 0.2, 0.1), attempt + 1);
              }
            },
            "image/jpeg",
            quality,
          );
        };

        // Start with 0.7 quality for first attempt
        tryCompression(0.7, 1);
      } catch (error) {
        console.error("[Compress] Error during compression:", error);
        URL.revokeObjectURL(img.src);
        resolve(file); // Fallback to original
      }
    };

    img.onerror = (error) => {
      clearTimeout(compressionTimeout);
      console.error("[Compress] Image load error:", error);
      URL.revokeObjectURL(img.src);
      resolve(file); // Fallback to original
    };

    // For iOS/mobile, add additional error handling
    if (isIOS) {
      img.crossOrigin = "anonymous";
    }

    img.src = URL.createObjectURL(file);
  });
};

// Simple upload using Supabase SDK
const uploadWithSupabase = async (
  file: File,
  path: string,
  onProgress: (status: string) => void,
  timeoutMs: number = 45000,
): Promise<{ success: boolean; error?: string }> => {
  console.log("[SDK Upload] Starting:", path, formatFileSize(file.size));
  onProgress("Uploading...");

  const timer = setTimeout(() => {
    console.log("[SDK Upload] Timeout");
    return { success: false, error: "Upload timed out" };
  }, timeoutMs);

  try {
    const { data, error } = await supabase.storage.from("payment-proofs").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

    clearTimeout(timer);

    if (error) {
      console.error("[SDK Upload] Error:", error);
      return { success: false, error: error.message || "Upload failed" };
    }

    console.log("[SDK Upload] Success:", data);
    return { success: true };
  } catch (err: any) {
    clearTimeout(timer);
    console.error("[SDK Upload] Exception:", err);
    return { success: false, error: err.message || "Upload failed" };
  }
};

export function UserDepositRequestDialog({ userId, onSuccess }: UserDepositRequestDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [uploadFailed, setUploadFailed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>("");
  const [compressionStatus, setCompressionStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    setIsMobile(isMobileDevice());

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("[File] Selected:", file.name, formatFileSize(file.size), file.type);

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum size is 10MB", variant: "destructive" });
      return;
    }

    // Show compression status
    setCompressionStatus("Optimizing image...");

    try {
      // For mobile, use higher max size to avoid compression issues
      const targetKB = isMobileDevice() ? 800 : 500;
      setCompressionStatus(`Compressing to ${targetKB}KB...`);

      const processedFile = await compressImage(file, targetKB);

      console.log("[File] Processed:", processedFile.name, formatFileSize(processedFile.size));

      setProofFile(processedFile);
      setUploadFailed(false);
      setErrorDetails("");
      setUploadStatus("");
      setCompressionStatus("");

      toast({
        title: "Image ready",
        description: `Optimized to ${formatFileSize(processedFile.size)}`,
      });
    } catch (error) {
      console.error("[File] Error:", error);
      setCompressionStatus("");

      // Fallback: use original file if compression fails
      setProofFile(file);
      toast({
        title: "Using original image",
        description: "Compression skipped",
      });
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!amount || !proofFile) {
      toast({ title: "Missing info", description: "Enter amount and upload proof", variant: "destructive" });
      return;
    }

    if (!isOnline) {
      toast({ title: "Offline", description: "Check your connection", variant: "destructive" });
      return;
    }

    const depositAmount = parseInt(amount);
    if (isNaN(depositAmount) || depositAmount < 1000) {
      toast({ title: "Invalid amount", description: "Minimum Rs. 1,000", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setUploadProgress(10);
    setUploadStatus("Preparing upload...");
    setUploadFailed(false);
    setErrorDetails("");

    try {
      console.log("=== UPLOAD START ===");
      console.log("[File]", proofFile.name, formatFileSize(proofFile.size));

      // Get current session
      setUploadProgress(20);
      setUploadStatus("Checking authentication...");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("[Session] Error:", sessionError);
        throw new Error("Authentication error. Please refresh the page.");
      }

      if (!session) {
        throw new Error("Please log in to continue.");
      }

      const currentUserId = session.user.id;
      console.log("[Session] User ID:", currentUserId);

      if (!currentUserId) {
        throw new Error("Not logged in. Please refresh and try again.");
      }

      // Create file path
      setUploadProgress(40);
      setUploadStatus("Preparing file...");

      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileExtension = proofFile.name.split(".").pop() || "jpg";
      const filePath = `${currentUserId}/${timestamp}_${randomStr}.${fileExtension}`;

      console.log("[Upload] Path:", filePath);

      // Upload file
      setUploadProgress(60);
      setUploadStatus("Uploading image...");

      const uploadResult = await uploadWithSupabase(
        proofFile,
        filePath,
        (status) => setUploadStatus(status),
        isMobile ? 60000 : 45000, // Longer timeout for mobile
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Upload failed");
      }

      // Save to database
      setUploadProgress(85);
      setUploadStatus("Saving record...");

      const { error: insertError } = await supabase.from("deposit_requests").insert({
        user_id: userId,
        amount: depositAmount,
        bank_reference: bankReference || null,
        payment_proof_url: filePath,
      });

      if (insertError) {
        console.error("[DB] Error:", insertError);
        throw new Error("Failed to save record. Please try again.");
      }

      console.log("=== SUCCESS ===");
      setUploadProgress(100);
      setUploadStatus("Done!");

      toast({
        title: "Success!",
        description: "Your deposit request has been submitted for review",
      });

      // Reset form
      setTimeout(() => {
        setAmount("");
        setBankReference("");
        setProofFile(null);
        setUploadProgress(0);
        setUploadStatus("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        setOpen(false);
        onSuccess?.();
      }, 1000);
    } catch (error: any) {
      console.error("=== UPLOAD FAILED ===", error);
      setUploadFailed(true);
      setUploadStatus("Failed");
      setErrorDetails(error.message);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [amount, proofFile, bankReference, userId, toast, onSuccess, isMobile, isOnline]);

  const handleRetry = () => {
    if (!isOnline) {
      toast({ title: "Offline", description: "Check connection", variant: "destructive" });
      return;
    }
    setUploadFailed(false);
    setErrorDetails("");
    handleSubmit();
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
          <DialogDescription>Transfer funds to our bank account and upload the payment proof</DialogDescription>
        </DialogHeader>

        {!isOnline && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            <WifiOff className="w-4 h-4" />
            <span>You're offline</span>
          </div>
        )}

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
                <span className="text-muted-foreground">Till Number:</span>
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

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Deposit Amount (PKR)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Min. 1,000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <Label htmlFor="bankReference">Bank Reference (Optional)</Label>
            <Input
              id="bankReference"
              placeholder="Transaction ID"
              value={bankReference}
              onChange={(e) => setBankReference(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Payment Screenshot</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isLoading || !isOnline}
                className="hidden"
                id="proof-upload"
              />
              <label
                htmlFor="proof-upload"
                className={`flex flex-col items-center gap-2 ${isOnline ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
              >
                {proofFile ? (
                  <>
                    <ImageIcon className="w-8 h-8 text-primary" />
                    <span className="text-sm font-medium truncate max-w-full">{proofFile.name}</span>
                    <span className="text-xs text-muted-foreground">{formatFileSize(proofFile.size)}</span>
                    <span className="text-xs text-primary mt-1">Tap to change</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Tap to upload</span>
                    <span className="text-xs text-muted-foreground">Supports JPG, PNG (Max 10MB)</span>
                  </>
                )}
              </label>
            </div>

            {/* Compression Status */}
            {compressionStatus && <div className="text-xs text-muted-foreground mt-1">{compressionStatus}</div>}
          </div>

          {/* Progress */}
          {(isLoading || compressionStatus) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{compressionStatus || uploadStatus}</span>
                {uploadProgress > 0 && <span className="font-medium">{uploadProgress}%</span>}
              </div>
              {uploadProgress > 0 && <Progress value={uploadProgress} className="h-2" />}
            </div>
          )}

          {/* Error */}
          {uploadFailed && !isLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                <WifiOff className="w-4 h-4 flex-shrink-0" />
                <span>Upload failed</span>
              </div>
              {errorDetails && <p className="text-xs text-muted-foreground px-1">Error: {errorDetails}</p>}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {uploadFailed && proofFile && !isLoading && (
            <Button variant="outline" onClick={handleRetry} className="w-full sm:w-auto" disabled={!isOnline}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Upload
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !amount || !proofFile || !isOnline || !!compressionStatus}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {uploadStatus}
              </>
            ) : !isOnline ? (
              <>
                <WifiOff className="w-4 h-4 mr-2" />
                Offline
              </>
            ) : compressionStatus ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
