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
const compressImage = async (
  file: File,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.5
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      
      try {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

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
        
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
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

// Read file as Base64 using FileReader (most reliable across all mobile browsers)
const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to read file as base64"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onabort = () => reject(new Error("File reading aborted"));
    reader.readAsDataURL(file);
  });
};

// Decode base64 to ArrayBuffer (for Supabase upload)
const decode = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
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

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 15MB",
        variant: "destructive",
      });
      return;
    }

    setOriginalSize(file.size);
    
    // Always compress images for mobile reliability
    if (file.size > 300 * 1024) {
      setIsCompressing(true);
      try {
        let quality = 0.5;
        let maxDim = 1000;
        if (file.size > 5 * 1024 * 1024) {
          quality = 0.4;
          maxDim = 800;
        } else if (file.size > 2 * 1024 * 1024) {
          quality = 0.45;
          maxDim = 900;
        }

        const compressedFile = await compressImage(file, maxDim, maxDim, quality);
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
      setProofFile(file);
    }
  };

  // Upload using base64 + Supabase SDK (proven to work on mobile)
  const uploadFile = async (file: File, fileName: string): Promise<void> => {
    console.log("Starting mobile-optimized upload for:", fileName, "Size:", file.size);
    
    // Ensure we have a fresh session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    let activeSession = session;
    
    if (sessionError || !session) {
      console.log("No session, refreshing...");
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData.session) {
        throw new Error("Session expired. Please log out and log in again.");
      }
      activeSession = refreshData.session;
    }

    if (!activeSession?.access_token) {
      throw new Error("Not authenticated. Please log in again.");
    }
    
    console.log("Session valid, reading file as base64...");
    setUploadProgress(10);
    
    // Read file as base64 (most reliable on mobile)
    const base64 = await readFileAsBase64(file);
    console.log("Base64 length:", base64.length);
    setUploadProgress(30);
    
    // Decode to ArrayBuffer
    const arrayBuffer = decode(base64);
    console.log("ArrayBuffer size:", arrayBuffer.byteLength);
    setUploadProgress(50);
    
    // Upload using Supabase SDK with ArrayBuffer
    console.log("Uploading to Supabase storage...");
    const { data, error } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });
    
    setUploadProgress(90);
    
    if (error) {
      console.error("Supabase upload error:", error);
      if (error.message?.includes('Payload too large')) {
        throw new Error("File too large. Please use a smaller image.");
      }
      throw new Error(error.message || "Upload failed. Please try again.");
    }
    
    console.log("Upload successful:", data);
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
      const fileName = `${userId}/${Date.now()}.jpg`;
      
      await uploadFile(proofFile, fileName);

      setUploadProgress(100);
      setUploadStatus("Creating request...");

      const paymentProofPath = fileName;

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
      if (error.message?.includes("Session") || error.message?.includes("authenticated")) {
        errorMessage = "Session expired. Please log out and log in again.";
      } else if (error.message?.includes("large")) {
        errorMessage = "Image too large. Please try a smaller image.";
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
              disabled={isLoading}
            />
          </div>

          {/* Bank Reference */}
          <div className="space-y-2">
            <Label htmlFor="reference">Bank Reference (Optional)</Label>
            <Input
              id="reference"
              placeholder="Transaction ID or reference number"
              value={bankReference}
              onChange={(e) => setBankReference(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Payment Proof Upload */}
          <div className="space-y-2">
            <Label>Payment Proof</Label>
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
              {proofFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <ImageIcon className="w-5 h-5" />
                    <span className="font-medium">{proofFile.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Size: {formatFileSize(proofFile.size)}
                    {originalSize > proofFile.size && (
                      <span className="text-green-500 ml-1">
                        (saved {Math.round((1 - proofFile.size / originalSize) * 100)}%)
                      </span>
                    )}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setProofFile(null);
                      setOriginalSize(0);
                    }}
                    disabled={isLoading}
                  >
                    Change Image
                  </Button>
                </div>
              ) : isCompressing ? (
                <div className="space-y-2">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Optimizing image...</p>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Tap to upload payment screenshot
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports JPG, PNG (max 15MB)
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Upload Progress */}
          {isLoading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{uploadStatus}</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || isCompressing || !proofFile}
            className="w-full"
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
