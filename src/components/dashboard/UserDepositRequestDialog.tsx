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
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Aggressive compression - target very small files for mobile
const compressImage = async (file: File, maxSizeKB: number = 300): Promise<File> => {
  if (file.size < maxSizeKB * 1024) {
    console.log('[Compress] Already small:', formatFileSize(file.size));
    return file;
  }

  console.log('[Compress] Starting:', file.name, formatFileSize(file.size));

  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve(file);
      return;
    }

    img.onload = () => {
      try {
        let { width, height } = img;
        // Very aggressive resize for mobile - max 800px
        const maxDim = isMobileDevice() ? 800 : 1024;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Start with low quality for mobile
        const qualities = isMobileDevice() ? [0.4, 0.3, 0.2, 0.1] : [0.6, 0.4, 0.3, 0.2];
        
        const tryCompress = (idx: number) => {
          const quality = qualities[idx];
          canvas.toBlob(
            (blob) => {
              if (blob) {
                console.log('[Compress] Q:', quality, 'Size:', formatFileSize(blob.size));
                
                if (blob.size <= maxSizeKB * 1024 || idx === qualities.length - 1) {
                  const compressedFile = new File([blob], 'payment-proof.jpg', {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  URL.revokeObjectURL(img.src);
                  resolve(compressedFile);
                } else {
                  tryCompress(idx + 1);
                }
              } else {
                URL.revokeObjectURL(img.src);
                resolve(file);
              }
            },
            'image/jpeg',
            quality
          );
        };

        tryCompress(0);
      } catch (err) {
        console.error('[Compress] Error:', err);
        URL.revokeObjectURL(img.src);
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve(file);
    };

    img.src = URL.createObjectURL(file);
  });
};

// Simple upload using Supabase SDK with timeout
const uploadWithSupabase = async (
  file: File,
  path: string,
  onProgress: (status: string) => void,
  timeoutMs: number = 30000
): Promise<{ success: boolean; error?: string }> => {
  console.log('[SDK Upload] Starting:', path, formatFileSize(file.size));
  onProgress('Uploading...');

  return new Promise(async (resolve) => {
    const timer = setTimeout(() => {
      console.log('[SDK Upload] Timeout');
      resolve({ success: false, error: 'Upload timed out. Image may be too large.' });
    }, timeoutMs);

    try {
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });

      clearTimeout(timer);

      if (error) {
        console.error('[SDK Upload] Error:', error);
        
        // Check for specific errors
        if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
          resolve({ success: false, error: 'Permission denied. Please log out and log in again.' });
        } else if (error.message?.includes('Payload too large')) {
          resolve({ success: false, error: 'Image too large. Please select a smaller image.' });
        } else {
          resolve({ success: false, error: error.message || 'Upload failed' });
        }
        return;
      }

      console.log('[SDK Upload] Success:', data);
      resolve({ success: true });
    } catch (err: any) {
      clearTimeout(timer);
      console.error('[SDK Upload] Exception:', err);
      resolve({ success: false, error: err.message || 'Upload failed' });
    }
  });
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
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [uploadFailed, setUploadFailed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    setIsMobile(isMobileDevice());

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('[File] Selected:', file.name, formatFileSize(file.size), file.type);

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image", variant: "destructive" });
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 15MB", variant: "destructive" });
      return;
    }

    setUploadStatus("Optimizing...");
    
    try {
      // Target 200KB for mobile, 400KB for desktop
      const targetKB = isMobileDevice() ? 200 : 400;
      const processedFile = await compressImage(file, targetKB);
      
      console.log('[File] Processed:', formatFileSize(processedFile.size));
      
      setProofFile(processedFile);
      setUploadFailed(false);
      setErrorDetails("");
      setUploadStatus("");
      
      toast({ 
        title: "Ready", 
        description: `Image optimized to ${formatFileSize(processedFile.size)}` 
      });
    } catch (error) {
      console.error('[File] Error:', error);
      setUploadStatus("");
      toast({ title: "Error", description: "Could not process image", variant: "destructive" });
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!amount || !proofFile) {
      toast({ title: "Missing info", description: "Enter amount and upload proof", variant: "destructive" });
      return;
    }

    if (!navigator.onLine) {
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
    setUploadStatus("Checking session...");
    setUploadFailed(false);
    setErrorDetails("");

    try {
      console.log("=== UPLOAD START ===");
      console.log("[File]", formatFileSize(proofFile.size));
      
      // Check session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('[Session] Error:', sessionError);
        // Try refresh
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          throw new Error("Please log out and log in again.");
        }
      }

      const currentUserId = session?.user?.id || (await supabase.auth.getUser()).data.user?.id;
      console.log('[Session] User ID:', currentUserId);
      
      if (!currentUserId) {
        throw new Error("Not logged in. Please refresh and try again.");
      }

      // IMPORTANT: Use user's auth ID as folder name (RLS requires this)
      setUploadProgress(20);
      setUploadStatus("Uploading...");
      
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      // Path format: {user_id}/{filename} - RLS policy checks foldername matches auth.uid()
      const filePath = `${currentUserId}/${timestamp}_${randomStr}.jpg`;
      
      console.log('[Upload] Path:', filePath);

      // Try upload with retries
      let uploadSuccess = false;
      let lastError = '';
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`[Upload] Attempt ${attempt}/3`);
        setUploadStatus(`Uploading (attempt ${attempt})...`);
        setUploadProgress(20 + (attempt - 1) * 20);

        const result = await uploadWithSupabase(
          proofFile,
          filePath,
          (status) => setUploadStatus(status),
          isMobile ? 25000 : 45000 // Shorter timeout for mobile
        );

        if (result.success) {
          uploadSuccess = true;
          break;
        }

        lastError = result.error || 'Unknown error';
        console.log('[Upload] Failed:', lastError);

        // Don't retry on permission errors
        if (lastError.includes('Permission') || lastError.includes('policy') || lastError.includes('log out')) {
          break;
        }

        // Wait before retry
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      if (!uploadSuccess) {
        setErrorDetails(lastError);
        throw new Error(lastError);
      }

      // Save to database
      setUploadProgress(85);
      setUploadStatus("Saving...");

      const { error: insertError } = await supabase
        .from("deposit_requests")
        .insert({
          user_id: userId,
          amount: depositAmount,
          bank_reference: bankReference || null,
          payment_proof_url: filePath,
        });

      if (insertError) {
        console.error("[DB] Error:", insertError);
        throw new Error("Failed to save. Please try again.");
      }

      console.log("=== SUCCESS ===");
      setUploadProgress(100);
      setUploadStatus("Done!");

      toast({ title: "Submitted!", description: "Your deposit is being reviewed" });

      // Reset
      setAmount("");
      setBankReference("");
      setProofFile(null);
      setUploadProgress(0);
      setUploadStatus("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setOpen(false);
      onSuccess?.();

    } catch (error: any) {
      console.error("=== FAILED ===", error);
      setUploadFailed(true);
      setUploadStatus("Failed");
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [amount, proofFile, bankReference, userId, toast, onSuccess, isMobile]);

  const handleRetry = () => {
    if (!navigator.onLine) {
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
          <DialogDescription>
            Transfer funds to our bank account and upload the payment proof
          </DialogDescription>
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
                className={`flex flex-col items-center gap-2 ${isOnline ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
              >
                {proofFile ? (
                  <>
                    <ImageIcon className="w-8 h-8 text-primary" />
                    <span className="text-sm font-medium">{proofFile.name}</span>
                    <span className="text-xs text-muted-foreground">{formatFileSize(proofFile.size)}</span>
                    <span className="text-xs text-primary">Tap to change</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Tap to upload</span>
                    <span className="text-xs text-muted-foreground">Auto-compressed for fast upload</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Progress */}
          {isLoading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{uploadStatus}</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Error */}
          {uploadFailed && !isLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                <WifiOff className="w-4 h-4 flex-shrink-0" />
                <span>Upload failed</span>
              </div>
              {errorDetails && (
                <p className="text-xs text-muted-foreground px-1">
                  Error: {errorDetails}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {uploadFailed && proofFile && !isLoading && (
            <Button variant="outline" onClick={handleRetry} className="w-full sm:w-auto" disabled={!isOnline}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !amount || !proofFile || !isOnline}
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
            ) : (
              "Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
