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
import { Loader2, Wallet, Copy, CheckCircle, X, Image as ImageIcon, Camera, FolderOpen } from "lucide-react";

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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Simple canvas-based compression without external libraries
  const compressImageNative = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      console.log("[COMPRESS] Starting native compression:", file.name, (file.size / 1024 / 1024).toFixed(2), "MB");

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            // Calculate new dimensions (max 1280px)
            let width = img.width;
            let height = img.height;
            const maxSize = 1280;

            if (width > height && width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            } else if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }

            // Create canvas and compress
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");

            if (!ctx) {
              reject(new Error("Failed to get canvas context"));
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Convert to blob with quality 0.7
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Failed to compress image"));
                  return;
                }

                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });

                console.log("[COMPRESS] Done:", (compressedFile.size / 1024 / 1024).toFixed(2), "MB");
                resolve(compressedFile);
              },
              "image/jpeg",
              0.7,
            );
          } catch (error) {
            console.error("[COMPRESS] Canvas error:", error);
            reject(error);
          }
        };

        img.onerror = () => {
          console.error("[COMPRESS] Image load error");
          reject(new Error("Failed to load image"));
        };

        img.src = e.target?.result as string;
      };

      reader.onerror = () => {
        console.error("[COMPRESS] FileReader error");
        reject(new Error("Failed to read file"));
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("[FILE] No file selected");
      return;
    }

    console.log("[FILE] Selected:", file.name, file.type, (file.size / 1024 / 1024).toFixed(2), "MB");

    if (!file.type.startsWith("image/")) {
      console.error("[FILE] Invalid type:", file.type);
      toast({ title: "Invalid file", description: "Please select an image", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setUploadProgress("Processing image...");

    try {
      // Compress image
      console.log("[PROCESS] Compressing...");
      setUploadProgress("Compressing image...");
      const processedFile = await compressImageNative(file);

      // Check file size
      if (processedFile.size > 5 * 1024 * 1024) {
        console.error("[PROCESS] Still too large:", (processedFile.size / 1024 / 1024).toFixed(2), "MB");
        toast({
          title: "File too large",
          description: "Please use a smaller image.",
          variant: "destructive",
        });
        setIsLoading(false);
        setUploadProgress("");
        return;
      }

      console.log("[PROCESS] Creating preview...");
      setUploadProgress("Creating preview...");
      setSelectedFile(processedFile);

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        console.log("[PREVIEW] Success");
        setPreviewUrl(event.target?.result as string);
        setIsLoading(false);
        setUploadProgress("");
      };
      reader.onerror = (error) => {
        console.error("[PREVIEW] Error:", error);
        toast({ title: "Error", description: "Failed to read image", variant: "destructive" });
        setIsLoading(false);
        setUploadProgress("");
      };
      reader.readAsDataURL(processedFile);
    } catch (error: any) {
      console.error("[PROCESS] Error:", error);
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process image",
        variant: "destructive",
      });
      setIsLoading(false);
      setUploadProgress("");
    }
  };

  const clearFile = () => {
    console.log("[CLEAR] Clearing file");
    setSelectedFile(null);
    setPreviewUrl(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const uploadToSupabase = async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const fileName = `${userId}/${timestamp}.jpg`;

    console.log("[UPLOAD] Starting:", fileName, (file.size / 1024 / 1024).toFixed(2), "MB");
    setUploadProgress("Uploading to server...");

    try {
      const { data, error } = await supabase.storage.from("payment-proofs").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: "image/jpeg",
      });

      if (error) {
        console.error("[UPLOAD] Supabase error:", error);
        throw new Error("Upload failed: " + error.message);
      }

      const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(data.path);

      console.log("[UPLOAD] Success:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error: any) {
      console.error("[UPLOAD] Error:", error);
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
      const imageUrl = await uploadToSupabase(selectedFile);

      console.log("[SUBMIT] Saving to database...");
      setUploadProgress("Saving request...");

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

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Payment Screenshot</Label>

            {!previewUrl ? (
              <div className="space-y-3">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isLoading}
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isLoading}
                />

                {isLoading ? (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">{uploadProgress}</p>
                    <p className="text-xs text-muted-foreground mt-1">Please wait...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-24 flex-col gap-2"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera className="w-6 h-6" />
                      <span className="text-xs">Take Photo</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-24 flex-col gap-2"
                      onClick={() => galleryInputRef.current?.click()}
                    >
                      <FolderOpen className="w-6 h-6" />
                      <span className="text-xs">Choose from Gallery</span>
                    </Button>
                  </div>
                )}
                <p className="text-xs text-center text-muted-foreground">
                  All image formats supported • Auto-compressed
                </p>
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
