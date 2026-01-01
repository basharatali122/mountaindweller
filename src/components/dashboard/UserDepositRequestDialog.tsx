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
import { Loader2, Upload, Wallet, Copy, CheckCircle, ImageIcon, RefreshCw, WifiOff, Wifi } from "lucide-react";

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

// Mobile detection
const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Get network info if available
const getNetworkInfo = (): { effectiveType?: string; downlink?: number } => {
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const conn = (navigator as any).connection;
    return {
      effectiveType: conn?.effectiveType,
      downlink: conn?.downlink,
    };
  }
  return {};
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Compress image for mobile devices
const compressImageForMobile = (file: File, maxWidth: number = 1200, quality: number = 0.7): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Skip compression for small files (< 1MB)
    if (file.size < 1024 * 1024) {
      console.log('[Compress] Skipping - file already small:', formatFileSize(file.size));
      resolve(file);
      return;
    }

    console.log('[Compress] Starting compression for:', file.name, formatFileSize(file.size));

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.warn('[Compress] Canvas not supported, using original');
      resolve(file);
      return;
    }

    img.onload = () => {
      try {
        let { width, height } = img;
        console.log('[Compress] Original dimensions:', width, 'x', height);

        // Calculate new dimensions
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        console.log('[Compress] New dimensions:', width, 'x', height);

        canvas.width = width;
        canvas.height = height;
        
        // Draw with white background for transparency handling
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              console.log('[Compress] Compressed size:', formatFileSize(compressedFile.size));
              resolve(compressedFile);
            } else {
              console.warn('[Compress] Blob creation failed, using original');
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      } catch (err) {
        console.error('[Compress] Error during compression:', err);
        resolve(file); // Fallback to original on error
      } finally {
        URL.revokeObjectURL(img.src);
      }
    };

    img.onerror = () => {
      console.error('[Compress] Failed to load image');
      URL.revokeObjectURL(img.src);
      resolve(file); // Fallback to original
    };

    img.src = URL.createObjectURL(file);
  });
};

// Simple direct upload without AbortController (Supabase SDK handles internally)
const uploadFile = async (
  bucket: string,
  path: string,
  file: File
): Promise<{ data: any; error: any }> => {
  console.log('[Upload] Starting direct upload for:', path, formatFileSize(file.size));
  
  try {
    // Convert file to ArrayBuffer for more reliable mobile uploads
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    console.log('[Upload] File converted to ArrayBuffer, uploading...');
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, uint8Array, {
        contentType: file.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('[Upload] Supabase error:', error);
      return { data: null, error };
    }
    
    console.log('[Upload] Success:', data);
    return { data, error: null };
  } catch (err: any) {
    console.error('[Upload] Exception:', err);
    return { data: null, error: { message: err.message || 'Upload failed' } };
  }
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track online status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    setIsMobile(isMobileDevice());

    const handleOnline = () => {
      console.log('[Network] Back online');
      setIsOnline(true);
      toast({
        title: "Back online",
        description: "You can now upload your payment proof",
      });
    };

    const handleOffline = () => {
      console.log('[Network] Went offline');
      setIsOnline(false);
      toast({
        title: "No internet connection",
        description: "Please check your network and try again",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mobile = isMobileDevice();
    const maxSize = mobile ? 3 * 1024 * 1024 : 5 * 1024 * 1024; // 3MB for mobile, 5MB for desktop
    const networkInfo = getNetworkInfo();

    console.log('[FileSelect] Device:', mobile ? 'Mobile' : 'Desktop');
    console.log('[FileSelect] File:', file.name, 'Size:', formatFileSize(file.size), 'Type:', file.type);
    console.log('[FileSelect] Network:', networkInfo);

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Check raw file size first (before compression)
    if (file.size > 12 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 12MB",
        variant: "destructive",
      });
      return;
    }

    // Show compression toast for large mobile files
    if (mobile && file.size > 1024 * 1024) {
      toast({
        title: "Optimizing image...",
        description: "Compressing for faster upload",
      });
    }

    try {
      // Compress on mobile or for large files
      let processedFile = file;
      if (mobile || file.size > 2 * 1024 * 1024) {
        processedFile = await compressImageForMobile(file, 1200, 0.7);
      }

      // Check final size
      if (processedFile.size > maxSize) {
        toast({
          title: "File still too large",
          description: `Please upload a smaller image (max ${mobile ? '3' : '5'}MB after compression)`,
          variant: "destructive",
        });
        return;
      }

      setProofFile(processedFile);
      setUploadFailed(false);
      
      const sizeChange = file.size !== processedFile.size 
        ? ` (compressed from ${formatFileSize(file.size)})` 
        : '';
      
      toast({
        title: "Image ready",
        description: `${formatFileSize(processedFile.size)}${sizeChange}`,
      });
    } catch (error) {
      console.error('[FileSelect] Processing error:', error);
      // Use original file if compression fails
      if (file.size <= maxSize) {
        setProofFile(file);
        setUploadFailed(false);
        toast({
          title: "Image selected",
          description: `${file.name} (${formatFileSize(file.size)})`,
        });
      } else {
        toast({
          title: "File too large",
          description: "Could not compress image. Please use a smaller file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!amount || !proofFile) {
      toast({
        title: "Missing information",
        description: "Please enter amount and upload payment proof",
        variant: "destructive",
      });
      return;
    }

    // Check network before starting
    if (!navigator.onLine) {
      toast({
        title: "No internet connection",
        description: "Please check your network and try again",
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
    setUploadStatus("Starting...");
    setUploadFailed(false);

    const mobile = isMobileDevice();
    const networkInfo = getNetworkInfo();
    const timeout = mobile ? 30000 : 60000; // 30s for mobile, 60s for desktop

    try {
      console.log("=== UPLOAD START ===");
      console.log("[Device]", mobile ? 'Mobile' : 'Desktop');
      console.log("[Network]", networkInfo);
      console.log("[File]", proofFile.name, formatFileSize(proofFile.size));
      console.log("[Timeout]", timeout, 'ms');
      
      // Step 1: Check session
      setUploadProgress(10);
      setUploadStatus("Checking login...");
      console.log("[Step 1] Checking session");
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("[Session] Error:", sessionError);
        throw new Error("Session error. Please log in again.");
      }
      
      if (!session) {
        console.log("[Session] No session, trying refresh");
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          console.error("[Session] Refresh failed:", refreshError);
          throw new Error("Session expired. Please log out and log in again.");
        }
        console.log("[Session] Refreshed successfully");
      }
      
      console.log("[Session] OK");
      setUploadProgress(20);
      setUploadStatus(mobile ? "Uploading (may take a moment)..." : "Uploading image...");
      
      // Step 2: Upload file with timeout
      const ext = proofFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      console.log("[Step 2] Uploading to:", fileName);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 75) return prev + 5;
          return prev;
        });
      }, 800);
      
      const { data: uploadData, error: uploadError } = await uploadFile(
        'payment-proofs',
        fileName,
        proofFile
      );
      
      clearInterval(progressInterval);
      
      if (uploadError) {
        console.error("[Upload] Error:", uploadError);
        
        // Mobile-specific error messages
        if (uploadError.message?.includes('timeout') || uploadError.message?.includes('timed out')) {
          throw new Error(mobile 
            ? "Upload timed out. Try on WiFi or a stronger signal." 
            : "Upload timed out. Please try again.");
        }
        
        if (uploadError.message?.includes('network') || uploadError.message?.includes('fetch')) {
          throw new Error("Network error. Please check your connection and try again.");
        }
        
        throw new Error(uploadError.message || "Upload failed. Please try again.");
      }
      
      console.log("[Upload] Success:", uploadData);
      setUploadProgress(85);
      setUploadStatus("Saving request...");
      
      // Step 3: Create deposit request
      console.log("[Step 3] Creating deposit request");
      
      const { error: insertError } = await supabase
        .from("deposit_requests")
        .insert({
          user_id: userId,
          amount: depositAmount,
          bank_reference: bankReference || null,
          payment_proof_url: fileName,
        });

      if (insertError) {
        console.error("[Insert] Error:", insertError);
        throw new Error("Failed to save request. Please try again.");
      }

      console.log("=== UPLOAD COMPLETE ===");
      setUploadProgress(100);
      setUploadStatus("Done!");

      toast({
        title: "Deposit request submitted",
        description: "Your request is being reviewed.",
      });

      // Reset form
      setAmount("");
      setBankReference("");
      setProofFile(null);
      setUploadProgress(0);
      setUploadStatus("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setOpen(false);
      onSuccess?.();
      
    } catch (error: any) {
      console.error("=== UPLOAD FAILED ===", error);
      setUploadFailed(true);
      setUploadStatus("Failed");
      
      toast({
        title: "Upload failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [amount, proofFile, bankReference, userId, toast, onSuccess]);

  const handleRetry = () => {
    if (!navigator.onLine) {
      toast({
        title: "Still offline",
        description: "Please wait for your connection to restore",
        variant: "destructive",
      });
      return;
    }
    setUploadFailed(false);
    handleSubmit();
  };

  const maxSizeText = isMobile ? "3MB" : "5MB";

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

        {/* Network Status Banner */}
        {!isOnline && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            <WifiOff className="w-4 h-4" />
            <span>You're offline. Please check your connection.</span>
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
            <Label htmlFor="bankReference">Bank Reference (Optional)</Label>
            <Input
              id="bankReference"
              placeholder="Transaction ID or reference number"
              value={bankReference}
              onChange={(e) => setBankReference(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Payment Proof Screenshot</Label>
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
                    <span className="text-sm font-medium text-foreground">
                      {proofFile.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(proofFile.size)}
                    </span>
                    <span className="text-xs text-primary">Tap to change</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Tap to upload screenshot
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Max {maxSizeText} • Auto-compressed on mobile
                    </span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Upload Progress */}
          {isLoading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{uploadStatus}</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              {isMobile && uploadProgress > 20 && uploadProgress < 85 && (
                <p className="text-xs text-muted-foreground text-center">
                  Please keep the app open...
                </p>
              )}
            </div>
          )}

          {/* Upload Failed State */}
          {uploadFailed && !isLoading && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <WifiOff className="w-4 h-4 flex-shrink-0" />
              <span>Upload failed. Check your connection and try again.</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {uploadFailed && proofFile && !isLoading && (
            <Button
              variant="outline"
              onClick={handleRetry}
              className="w-full sm:w-auto"
              disabled={!isOnline}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Upload
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
                {uploadStatus || "Uploading..."}
              </>
            ) : !isOnline ? (
              <>
                <WifiOff className="w-4 h-4 mr-2" />
                Offline
              </>
            ) : (
              "Submit Deposit Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
