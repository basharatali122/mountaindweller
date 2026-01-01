import { useState, useRef, useEffect } from "react";
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
import { Loader2, Upload, Wallet, Copy, CheckCircle, FileImage, RefreshCw, WifiOff } from "lucide-react";

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

// Detect if mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  typeof navigator !== 'undefined' ? navigator.userAgent : ''
);

// Max file size: 3MB for mobile, 5MB for desktop
const MAX_FILE_SIZE = isMobile ? 3 * 1024 * 1024 : 5 * 1024 * 1024;

// Compress image on client side
const compressImage = (file: File, maxWidth = 1200, quality = 0.7): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // If not an image, return as-is
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down if needed
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
};

// Convert file to ArrayBuffer for reliable mobile upload
const fileToArrayBuffer = (file: File | Blob): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsArrayBuffer(file);
  });
};

export function UserDepositRequestDialog({ userId, onSuccess }: UserDepositRequestDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen for network status
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    // Accept ALL file types - no type restriction
    if (file.size > MAX_FILE_SIZE) {
      const maxMB = MAX_FILE_SIZE / (1024 * 1024);
      toast({ 
        title: "File too large", 
        description: `Maximum ${maxMB}MB. Try a smaller file.`, 
        variant: "destructive" 
      });
      return;
    }

    setProofFile(file);
    toast({ title: "File selected", description: file.name });
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return data.session;
    } catch (e) {
      console.error("Session refresh failed:", e);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!amount || !proofFile) {
      toast({ title: "Missing info", description: "Enter amount and upload proof", variant: "destructive" });
      return;
    }

    if (!isOnline) {
      toast({ title: "No internet", description: "Please check your connection", variant: "destructive" });
      return;
    }

    const depositAmount = parseInt(amount);
    if (isNaN(depositAmount) || depositAmount < 1000) {
      toast({ title: "Invalid amount", description: "Minimum Rs. 1,000", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setUploadError(null);
    setUploadProgress("Preparing...");

    try {
      // Refresh session first (helps with mobile auth issues)
      setUploadProgress("Checking session...");
      const session = await refreshSession();
      if (!session) {
        throw new Error("Session expired. Please login again.");
      }

      // Compress image if it's an image file
      setUploadProgress("Processing file...");
      let fileToUpload: Blob = proofFile;
      let contentType = proofFile.type || 'application/octet-stream';
      
      if (proofFile.type.startsWith('image/') && isMobile) {
        try {
          fileToUpload = await compressImage(proofFile, 1200, 0.7);
          contentType = 'image/jpeg';
          console.log(`Compressed from ${proofFile.size} to ${fileToUpload.size} bytes`);
        } catch (compressError) {
          console.warn("Compression failed, using original:", compressError);
          fileToUpload = proofFile;
        }
      }

      // Convert to ArrayBuffer for reliable mobile upload
      setUploadProgress("Converting file...");
      const arrayBuffer = await fileToArrayBuffer(fileToUpload);
      console.log("ArrayBuffer size:", arrayBuffer.byteLength);

      // Generate unique file path
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const extension = proofFile.type.startsWith('image/') && isMobile ? 'jpg' : (proofFile.name.split(".").pop()?.toLowerCase() || "bin");
      const filePath = `${userId}/${timestamp}_${randomStr}.${extension}`;

      console.log("Starting upload:", { filePath, fileSize: arrayBuffer.byteLength, contentType });
      setUploadProgress("Uploading...");

      // Upload with ArrayBuffer (more reliable on mobile)
      const uploadPromise = supabase.storage
        .from("payment-proofs")
        .upload(filePath, arrayBuffer, {
          contentType: contentType,
          cacheControl: "3600",
          upsert: true,
        });

      // Race against timeout (45 seconds for mobile)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Upload timed out. Please try with a smaller file or better connection.")), 45000)
      );

      const result = await Promise.race([uploadPromise, timeoutPromise]) as any;
      
      if (result.error) {
        console.error("Storage upload error:", result.error);
        throw new Error("Upload failed: " + result.error.message);
      }

      console.log("Upload successful, creating deposit request");
      setUploadProgress("Saving request...");

      // Create deposit request
      const { error: insertError } = await supabase.from("deposit_requests").insert({
        user_id: userId,
        amount: depositAmount,
        bank_reference: bankReference || null,
        payment_proof_url: filePath,
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        // Try to clean up the uploaded file
        await supabase.storage.from("payment-proofs").remove([filePath]);
        throw new Error("Failed to submit request: " + insertError.message);
      }

      toast({
        title: "Success!",
        description: "Deposit request submitted for review",
      });

      // Reset and close
      setAmount("");
      setBankReference("");
      setProofFile(null);
      setUploadProgress("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setOpen(false);
      onSuccess?.();

    } catch (error: any) {
      console.error("Submit error:", error);
      setUploadError(error.message || "Upload failed");
      setUploadProgress("");
      toast({
        title: "Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setUploadError(null);
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
          <DialogDescription>Transfer to our bank and upload payment proof</DialogDescription>
        </DialogHeader>

        {!isOnline && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm">No internet connection</span>
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
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(BANK_DETAILS.merchantName, "name")}>
                    {copiedField === "name" ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Account #:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{BANK_DETAILS.accountNumber}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(BANK_DETAILS.accountNumber, "account")}>
                    {copiedField === "account" ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">IBAN:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-xs">{BANK_DETAILS.iban}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(BANK_DETAILS.iban, "iban")}>
                    {copiedField === "iban" ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Till #:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{BANK_DETAILS.tillNumber}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(BANK_DETAILS.tillNumber, "till")}>
                    {copiedField === "till" ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
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
            <Label>Payment Proof (Any file type)</Label>
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                proofFile ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() => !isLoading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="*/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                disabled={isLoading}
              />
              {proofFile ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle className="w-8 h-8 text-primary" />
                  <p className="text-sm font-medium text-foreground truncate max-w-full">{proofFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(proofFile.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FileImage className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Tap to select or take photo</p>
                  <p className="text-xs text-muted-foreground">Max {isMobile ? "3" : "5"}MB • Images auto-compressed</p>
                </div>
              )}
            </div>
          </div>

          {/* Upload Progress */}
          {uploadProgress && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-primary">{uploadProgress}</span>
            </div>
          )}

          {/* Error with Retry */}
          {uploadError && (
            <div className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <span className="text-sm text-destructive">{uploadError}</span>
              <Button size="sm" variant="outline" onClick={handleRetry} disabled={isLoading}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !proofFile || !amount || !isOnline}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
