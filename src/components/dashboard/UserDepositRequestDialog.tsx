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

// Mobile detection
const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Compress image with multiple quality attempts
const compressImage = async (file: File, maxSizeKB: number = 500): Promise<File> => {
  // Skip for small files
  if (file.size < maxSizeKB * 1024) {
    console.log('[Compress] Skipping - already small:', formatFileSize(file.size));
    return file;
  }

  console.log('[Compress] Starting for:', file.name, formatFileSize(file.size));

  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.warn('[Compress] Canvas not supported');
      resolve(file);
      return;
    }

    img.onload = () => {
      try {
        let { width, height } = img;
        const maxDim = 1024; // Max dimension

        // Scale down if needed
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

        // Try different quality levels
        const qualities = [0.6, 0.4, 0.3, 0.2];
        
        const tryCompress = (qualityIndex: number) => {
          const quality = qualities[qualityIndex];
          canvas.toBlob(
            (blob) => {
              if (blob) {
                console.log('[Compress] Quality', quality, '-> Size:', formatFileSize(blob.size));
                
                if (blob.size <= maxSizeKB * 1024 || qualityIndex === qualities.length - 1) {
                  const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  URL.revokeObjectURL(img.src);
                  resolve(compressedFile);
                } else {
                  tryCompress(qualityIndex + 1);
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
      console.error('[Compress] Failed to load image');
      URL.revokeObjectURL(img.src);
      resolve(file);
    };

    img.src = URL.createObjectURL(file);
  });
};

// Robust upload with retries using fetch with AbortController
const uploadWithRetry = async (
  file: File,
  path: string,
  accessToken: string,
  onProgress: (percent: number, status: string) => void,
  maxRetries: number = 3
): Promise<{ success: boolean; error?: string }> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/payment-proofs/${path}`;
  
  console.log('[Upload] URL:', uploadUrl);
  console.log('[Upload] File size:', formatFileSize(file.size));

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[Upload] Attempt ${attempt}/${maxRetries}`);
    onProgress(10, `Uploading (attempt ${attempt})...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[Upload] Aborting due to timeout');
      controller.abort();
    }, 45000); // 45 second timeout

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': file.type || 'image/jpeg',
          'x-upsert': 'true',
          'Cache-Control': 'max-age=3600',
        },
        body: file,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('[Upload] Response status:', response.status);

      if (response.ok) {
        onProgress(85, 'Upload complete');
        return { success: true };
      }

      // Handle specific error codes
      if (response.status === 401 || response.status === 403) {
        return { success: false, error: 'Session expired. Please log out and log in again.' };
      }

      if (response.status >= 500) {
        console.error('[Upload] Server error:', response.status);
        if (attempt === maxRetries) {
          return { success: false, error: 'Server error. Please try again later.' };
        }
        await new Promise(r => setTimeout(r, 2000 * attempt)); // Wait before retry
        continue;
      }

      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('[Upload] Error response:', errorText);
      return { success: false, error: `Upload failed: ${response.status}` };

    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error(`[Upload] Attempt ${attempt} error:`, error.name, error.message);

      if (error.name === 'AbortError') {
        onProgress(10, 'Timed out, retrying...');
        if (attempt === maxRetries) {
          return { success: false, error: 'Upload timed out. Try with a smaller image or better connection.' };
        }
        continue;
      }

      if (attempt === maxRetries) {
        return { success: false, error: 'Connection failed. Check your internet and try again.' };
      }

      // Wait before retry
      await new Promise(r => setTimeout(r, 1500 * attempt));
    }
  }

  return { success: false, error: 'Upload failed after multiple attempts.' };
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

  useEffect(() => {
    setIsOnline(navigator.onLine);
    setIsMobile(isMobileDevice());

    const handleOnline = () => {
      console.log('[Network] Back online');
      setIsOnline(true);
      toast({ title: "Back online", description: "You can now upload" });
    };

    const handleOffline = () => {
      console.log('[Network] Went offline');
      setIsOnline(false);
      toast({ title: "No internet", description: "Check your connection", variant: "destructive" });
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

    console.log('[FileSelect] Original:', file.name, formatFileSize(file.size), file.type);

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image", variant: "destructive" });
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 15MB allowed", variant: "destructive" });
      return;
    }

    setUploadStatus("Optimizing image...");
    
    try {
      // Aggressively compress for mobile - target 500KB max
      const targetSize = isMobileDevice() ? 400 : 600;
      const processedFile = await compressImage(file, targetSize);
      
      console.log('[FileSelect] Processed:', formatFileSize(processedFile.size));
      
      setProofFile(processedFile);
      setUploadFailed(false);
      setUploadStatus("");
      
      const saved = file.size !== processedFile.size 
        ? ` (optimized from ${formatFileSize(file.size)})` 
        : '';
      
      toast({ 
        title: "Image ready", 
        description: `${formatFileSize(processedFile.size)}${saved}` 
      });
    } catch (error) {
      console.error('[FileSelect] Error:', error);
      setProofFile(file);
      setUploadFailed(false);
      setUploadStatus("");
      toast({ title: "Image selected", description: formatFileSize(file.size) });
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
    setUploadProgress(0);
    setUploadStatus("Starting...");
    setUploadFailed(false);

    try {
      console.log("=== DEPOSIT UPLOAD START ===");
      console.log("[File]", proofFile.name, formatFileSize(proofFile.size));
      
      // Get session
      setUploadProgress(5);
      setUploadStatus("Checking login...");
      
      let accessToken: string | null = null;

      // Quick session check with short timeout
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
      
      const sessionResult = await Promise.race([sessionPromise, timeoutPromise]);
      
      if (sessionResult && 'data' in sessionResult && sessionResult.data.session?.access_token) {
        accessToken = sessionResult.data.session.access_token;
        console.log("[Session] Got token");
      } else {
        // Try refresh
        setUploadStatus("Refreshing session...");
        try {
          const refreshResult = await Promise.race([
            supabase.auth.refreshSession(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
          ]);
          
          if (refreshResult && 'data' in refreshResult && refreshResult.data.session?.access_token) {
            accessToken = refreshResult.data.session.access_token;
            console.log("[Session] Got token after refresh");
          }
        } catch (e) {
          console.error("[Session] Refresh failed:", e);
        }
      }

      if (!accessToken) {
        throw new Error("Session expired. Please log out and log in again.");
      }

      // Upload file with retries
      const ext = proofFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      
      const uploadResult = await uploadWithRetry(
        proofFile,
        fileName,
        accessToken,
        (percent, status) => {
          setUploadProgress(percent);
          setUploadStatus(status);
        },
        3 // 3 retries
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Save to database
      setUploadProgress(90);
      setUploadStatus("Saving request...");

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

      console.log("=== DEPOSIT SUCCESS ===");
      setUploadProgress(100);
      setUploadStatus("Done!");

      toast({ title: "Request submitted", description: "Your deposit is being reviewed" });

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
      console.error("=== DEPOSIT FAILED ===", error);
      setUploadFailed(true);
      setUploadStatus("Failed");
      toast({ title: "Failed", description: error.message || "Please try again", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [amount, proofFile, bankReference, userId, toast, onSuccess]);

  const handleRetry = () => {
    if (!navigator.onLine) {
      toast({ title: "Still offline", description: "Wait for connection", variant: "destructive" });
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
                      Max {maxSizeText} • Auto-optimized
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
              {isMobile && uploadProgress > 10 && uploadProgress < 85 && (
                <p className="text-xs text-muted-foreground text-center">
                  Keep the screen on...
                </p>
              )}
            </div>
          )}

          {/* Upload Failed */}
          {uploadFailed && !isLoading && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <WifiOff className="w-4 h-4 flex-shrink-0" />
              <span>Upload failed. Tap retry to try again.</span>
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
