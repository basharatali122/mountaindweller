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

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1, // Maximum file size in MB
      maxWidthOrHeight: 1920, // Maximum width or height
      useWebWorker: true, // Use web worker for better performance
      fileType: "image/jpeg", // Convert all images to JPEG (handles HEIC)
      initialQuality: 0.8, // Initial quality
    };

    try {
      setUploadProgress("Compressing image...");
      const compressedFile = await imageCompression(file, options);
      console.log("Original file size:", (file.size / 1024 / 1024).toFixed(2), "MB");
      console.log("Compressed file size:", (compressedFile.size / 1024 / 1024).toFixed(2), "MB");
      return compressedFile;
    } catch (error) {
      console.error("Compression error:", error);
      throw new Error("Failed to compress image");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setUploadProgress("Processing image...");

    try {
      // Compress image if it's larger than 1MB or if it's HEIC/HEIF
      let processedFile = file;
      if (file.size > 1 * 1024 * 1024 || file.type === "image/heic" || file.type === "image/heif") {
        processedFile = await compressImage(file);
      }

      // Check compressed file size (should be under 5MB after compression)
      if (processedFile.size > 5 * 1024 * 1024) {
        toast({ 
          title: "File too large", 
          description: "Image is still too large after compression. Please use a smaller image.", 
          variant: "destructive" 
        });
        setIsLoading(false);
        setUploadProgress("");
        return;
      }

      setSelectedFile(processedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
        setIsLoading(false);
        setUploadProgress("");
      };
      reader.onerror = () => {
        toast({ title: "Error", description: "Failed to read image", variant: "destructive" });
        setIsLoading(false);
        setUploadProgress("");
      };
      reader.readAsDataURL(processedFile);

    } catch (error: any) {
      console.error("File processing error:", error);
      toast({ 
        title: "Processing failed", 
        description: error.message || "Failed to process image", 
        variant: "destructive" 
      });
      setIsLoading(false);
      setUploadProgress("");
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadToSupabase = async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}/${timestamp}.${fileExt}`;

    setUploadProgress("Uploading to server...");

    try {
      // Upload to Supabase Storage with proper configuration
      const { data, error } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "image/jpeg",
        });

      if (error) {
        console.error("Supabase upload error:", {
          message: error.message,
          error: error,
          fileName: fileName,
          fileSize: file.size,
          fileType: file.type,
        });
        throw new Error("Upload failed: " + error.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(data.path);

      console.log("Upload successful:", urlData.publicUrl);
      return urlData.publicUrl;

    } catch (error: any) {
      console.error("Upload error details:", {
        message: error.message,
        error: error,
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
        },
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

    setIsLoading(true);
    setUploadProgress("Starting upload...");

    try {
      // Upload file to Supabase Storage
      const imageUrl = await uploadToSupabase(selectedFile);
      
      setUploadProgress("Saving request...");

      // Save deposit request
      const { error: insertError } = await supabase.from("deposit_requests").insert({
        user_id: userId,
        amount: depositAmount,
        bank_reference: bankReference || null,
        payment_proof_url: imageUrl,
      });

      if (insertError) {
        console.error("Database insert error:", insertError);
        throw new Error("Failed to save: " + insertError.message);
      }

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
      console.error("Submit error:", error);
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
            <Label>Payment Screenshot</Label>
            
            {!previewUrl ? (
              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => !isLoading && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isLoading}
                />
                {isLoading && uploadProgress.includes("Compressing") ? (
                  <>
                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">{uploadProgress}</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Tap to upload screenshot
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      All formats supported • Auto-compressed
                    </p>
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
                  <span className="text-xs">({(selectedFile?.size || 0 / 1024 / 1024).toFixed(2)} MB)</span>
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