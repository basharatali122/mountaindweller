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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("[FILE] Selected:", file.name, file.type, (file.size / 1024 / 1024).toFixed(2), "MB");

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image", variant: "destructive" });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB allowed", variant: "destructive" });
      return;
    }

    setSelectedFile(file);

    // Create preview using URL.createObjectURL (faster than FileReader)
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const clearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  // Convert file to base64 - works reliably on ALL mobile devices
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const fileName = `payment_${userId}_${timestamp}`;

    console.log("[UPLOAD] Converting to base64...");
    setUploadProgress("Processing image...");

    // Convert file to base64 first (this works on ALL mobile browsers)
    const base64Data = await fileToBase64(file);
    console.log("[UPLOAD] Base64 ready, size:", Math.round(base64Data.length / 1024), "KB");

    console.log("[UPLOAD] Getting Cloudinary config...");
    setUploadProgress("Preparing upload...");

    // Get Cloudinary config from edge function
    const configResponse = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-cloudinary-config`
    );
    
    if (!configResponse.ok) {
      const errorText = await configResponse.text();
      console.error("[UPLOAD] Config error:", errorText);
      throw new Error("Could not get upload config");
    }
    
    const { cloudName, uploadPreset } = await configResponse.json();
    console.log("[UPLOAD] Config received:", cloudName);
    
    console.log("[UPLOAD] Starting Cloudinary upload:", fileName);
    setUploadProgress("Uploading image...");

    // Use base64 data URL for upload - most reliable for mobile
    const formData = new FormData();
    formData.append("file", base64Data);
    formData.append("upload_preset", uploadPreset);
    formData.append("public_id", fileName);
    formData.append("folder", "payment-proofs");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[UPLOAD] Cloudinary error:", errorText);
      throw new Error("Upload failed - please try again");
    }

    const result = await response.json();
    console.log("[UPLOAD] Success:", result.secure_url);
    return result.secure_url;
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
      const imageUrl = await uploadToCloudinary(selectedFile);

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
                {/* Camera Input (hidden) */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isLoading}
                />

                {/* Gallery Input (hidden) */}
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
                    {/* Take Photo Button */}
                    <Button
                      type="button"
                      variant="outline"
                      className="h-24 flex-col gap-2"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera className="w-6 h-6" />
                      <span className="text-xs">Take Photo</span>
                    </Button>

                    {/* Choose from Gallery Button */}
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

                <p className="text-xs text-center text-muted-foreground">JPG, PNG • Auto-compressed to 0.5MB</p>
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
