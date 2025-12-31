import { useState } from "react";
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
import { Loader2, Upload, Wallet, Copy, CheckCircle, ImageIcon } from "lucide-react";

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

// Compress image to reduce file size for faster mobile uploads
// Uses createObjectURL instead of FileReader for better mobile compatibility
const compressImage = async (
  file: File,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      // Clean up object URL after image loads
      URL.revokeObjectURL(objectUrl);
      
      try {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Scale down if needed while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        
        // Draw image with white background (for transparent images)
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create new file with .jpg extension
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, ".jpg"),
                { type: "image/jpeg" }
              );
              resolve(compressedFile);
            } else {
              reject(new Error("Compression failed"));
            }
          },
          "image/jpeg",
          quality
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };
    
    img.src = objectUrl;
  });
};

// Format file size for display
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function UserDepositRequestDialog({
  userId,
  onSuccess,
}: UserDepositRequestDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Warn if file is very large (over 15MB - might be too large even for compression)
    if (file.size > 15 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 15MB",
        variant: "destructive",
      });
      return;
    }

    setOriginalSize(file.size);
    
    // Compress if file is larger than 500KB
    if (file.size > 500 * 1024) {
      setIsCompressing(true);
      try {
        // Adjust quality based on original size
        let quality = 0.8;
        if (file.size > 5 * 1024 * 1024) quality = 0.6;
        else if (file.size > 2 * 1024 * 1024) quality = 0.7;

        const compressedFile = await compressImage(file, 1920, 1920, quality);
        setProofFile(compressedFile);
        
        const savedPercent = Math.round((1 - compressedFile.size / file.size) * 100);
        if (savedPercent > 10) {
          toast({
            title: "Image optimized",
            description: `Compressed from ${formatFileSize(file.size)} to ${formatFileSize(compressedFile.size)} (${savedPercent}% smaller)`,
          });
        }
      } catch (error) {
        console.error("Compression error:", error);
        // Fall back to original file if compression fails
        if (file.size <= 2 * 1024 * 1024) {
          setProofFile(file);
          toast({
            title: "Using original image",
            description: "Could not compress, using original file",
          });
        } else {
          toast({
            title: "Compression failed",
            description: "Please try a smaller image or different format",
            variant: "destructive",
          });
        }
      } finally {
        setIsCompressing(false);
      }
    } else {
      // File is already small enough
      setProofFile(file);
    }
  };

  // Upload file using Supabase SDK - more reliable on mobile
  const uploadFile = async (file: File, fileName: string): Promise<void> => {
    // First, ensure we have a fresh session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      // Try to refresh the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData.session) {
        throw new Error("Session expired. Please log out and log in again.");
      }
    }
    
    setUploadProgress(10);
    
    // Use Supabase SDK upload - handles auth automatically and is more reliable on mobile
    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "image/jpeg",
      });

    if (uploadError) {
      console.error("Upload error details:", uploadError);
      
      // Check for specific error types
      if (uploadError.message?.includes("JWT") || uploadError.message?.includes("token")) {
        throw new Error("Authentication expired. Please log out and log in again.");
      }
      if (uploadError.message?.includes("policy") || uploadError.message?.includes("permission")) {
        throw new Error("Permission denied. Please try again.");
      }
      if (uploadError.message?.includes("size") || uploadError.message?.includes("large")) {
        throw new Error("File too large. Please use a smaller image.");
      }
      
      throw new Error(uploadError.message || "Upload failed. Please try again.");
    }
    
    setUploadProgress(100);
  };

  const handleSubmit = async () => {
    if (!amount || !proofFile) {
      toast({
        title: "Missing information",
        description: "Please enter amount and upload payment proof",
        variant: "destructive",
      });
      return;
    }

    const depositAmount = parseInt(amount);
    if (isNaN(depositAmount) || depositAmount < 1000) {
      toast({
        title: "Invalid amount",
        description: "Minimum deposit amount is Rs. 1,000",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);
    setUploadStatus("Uploading...");

    try {
      // Generate file name
      const fileName = `${userId}/${Date.now()}.jpg`;
      
      // Upload using Supabase SDK for better mobile reliability
      await uploadFile(proofFile, fileName);

      setUploadProgress(100);
      setUploadStatus("Creating request...");

      // Store just the file path
      const paymentProofPath = fileName;

      // Create deposit request
      const { error: insertError } = await supabase
        .from("deposit_requests")
        .insert({
          user_id: userId,
          amount: depositAmount,
          bank_reference: bankReference || null,
          payment_proof_url: paymentProofPath,
        });

      if (insertError) throw insertError;

      toast({
        title: "Deposit request submitted",
        description: "Your deposit request is being reviewed. You'll be notified once approved.",
      });

      // Reset form
      setAmount("");
      setBankReference("");
      setProofFile(null);
      setOriginalSize(0);
      setUploadProgress(0);
      setUploadStatus("");
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Deposit request error:", error);
      
      let errorMessage = "Could not submit deposit request. Please try again.";
      if (error.message?.includes("timeout")) {
        errorMessage = "Upload timed out. Please check your internet connection and try again.";
      } else if (error.message?.includes("network") || error.message?.includes("Network")) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message?.includes("status")) {
        errorMessage = "Upload failed. Please try again.";
      }
      
      toast({
        title: "Submission failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
      setUploadStatus("");
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
          <DialogDescription>
            Transfer funds to our bank account and upload the payment proof
          </DialogDescription>
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

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Deposit Amount (PKR)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount (min. 1,000)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1000"
            />
          </div>

          {/* Bank Reference */}
          <div className="space-y-2">
            <Label htmlFor="reference">Transaction Reference (Optional)</Label>
            <Input
              id="reference"
              placeholder="Bank transaction ID or reference number"
              value={bankReference}
              onChange={(e) => setBankReference(e.target.value)}
            />
          </div>

          {/* Payment Proof Upload */}
          <div className="space-y-2">
            <Label htmlFor="proof">Payment Screenshot *</Label>
            <div className="border-2 border-dashed border-border rounded-xl p-4 text-center">
              <input
                id="proof"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={isCompressing}
              />
              <label
                htmlFor="proof"
                className={`cursor-pointer flex flex-col items-center gap-2 ${isCompressing ? "pointer-events-none opacity-50" : ""}`}
              >
                {isCompressing ? (
                  <>
                    <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Optimizing image...
                    </span>
                  </>
                ) : proofFile ? (
                  <>
                    <ImageIcon className="w-8 h-8 text-primary" />
                    <span className="text-sm text-foreground font-medium">
                      {proofFile.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(proofFile.size)}
                      {originalSize > proofFile.size && (
                        <span className="text-green-600 ml-1">
                          (optimized from {formatFileSize(originalSize)})
                        </span>
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Tap to upload or take photo
                    </span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Upload Progress */}
          {isLoading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{uploadStatus}</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || isCompressing || !amount || !proofFile}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {uploadStatus || "Submitting..."}
              </>
            ) : isCompressing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Optimizing...
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
