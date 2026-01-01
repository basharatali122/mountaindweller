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
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Desktop-only compression (SAFE)
const compressImageDesktop = async (file: File, maxSizeKB = 400): Promise<File> => {
  if (file.size <= maxSizeKB * 1024) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return resolve(file);

    img.onload = () => {
      const maxDim = 1024;
      let { width, height } = img;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = (height * maxDim) / width;
          width = maxDim;
        } else {
          width = (width * maxDim) / height;
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          resolve(
            new File([blob], "payment-proof.jpg", {
              type: "image/jpeg",
              lastModified: Date.now(),
            }),
          );
        },
        "image/jpeg",
        0.6,
      );
    };

    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
};

const uploadWithSupabase = async (file: File, path: string, timeoutMs = 30000): Promise<void> => {
  const timer = setTimeout(() => {
    throw new Error("Upload timed out");
  }, timeoutMs);

  const { error } = await supabase.storage.from("payment-proofs").upload(path, file, {
    upsert: true,
    cacheControl: "3600",
    contentType: file.type || "image/jpeg",
  });

  clearTimeout(timer);

  if (error) throw error;
};

export function UserDepositRequestDialog({ userId, onSuccess }: UserDepositRequestDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    window.addEventListener("online", () => setIsOnline(true));
    window.addEventListener("offline", () => setIsOnline(false));
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Only image files allowed",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast({
        title: "Too large",
        description: "Max 15MB allowed",
        variant: "destructive",
      });
      return;
    }

    // 🚨 MOBILE: NO COMPRESSION
    if (isMobileDevice()) {
      setProofFile(file);
      toast({
        title: "Ready",
        description: `Selected (${formatFileSize(file.size)})`,
      });
      return;
    }

    // 🖥️ DESKTOP ONLY
    setUploadStatus("Optimizing...");
    const optimized = await compressImageDesktop(file);
    setProofFile(optimized);
    setUploadStatus("");

    toast({
      title: "Ready",
      description: `Optimized to ${formatFileSize(optimized.size)}`,
    });
  };

  const handleSubmit = useCallback(async () => {
    if (!amount || !proofFile) return;

    try {
      setIsLoading(true);
      setUploadProgress(20);
      setUploadStatus("Uploading...");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) throw new Error("Not authenticated");

      const filePath = `${session.user.id}/${Date.now()}.jpg`;

      await uploadWithSupabase(proofFile, filePath, isMobileDevice() ? 25000 : 45000);

      setUploadProgress(80);
      setUploadStatus("Saving...");

      await supabase.from("deposit_requests").insert({
        user_id: userId,
        amount: parseInt(amount),
        bank_reference: bankReference || null,
        payment_proof_url: filePath,
      });

      setUploadProgress(100);
      toast({ title: "Submitted successfully" });

      setOpen(false);
      setAmount("");
      setBankReference("");
      setProofFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setUploadStatus("");
      setUploadProgress(0);
    }
  }, [amount, proofFile, bankReference, userId, onSuccess, toast]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full py-4">
          <Wallet className="mr-2 h-4 w-4" />
          Add Funds
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Deposit Funds</DialogTitle>
          <DialogDescription>Upload payment screenshot</DialogDescription>
        </DialogHeader>

        {!isOnline && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <WifiOff className="w-4 h-4" /> Offline
          </div>
        )}

        <div className="space-y-4">
          <Input type="number" placeholder="Amount (PKR)" value={amount} onChange={(e) => setAmount(e.target.value)} />

          <Input
            placeholder="Bank Reference (optional)"
            value={bankReference}
            onChange={(e) => setBankReference(e.target.value)}
          />

          <Input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} />

          {isLoading && (
            <>
              <Progress value={uploadProgress} />
              <p className="text-xs">{uploadStatus}</p>
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isLoading || !proofFile || !amount}>
            {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
