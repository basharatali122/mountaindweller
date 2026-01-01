// import { useState, useRef, useEffect } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Progress } from "@/components/ui/progress";
// import { supabase } from "@/integrations/supabase/client";
// import { useToast } from "@/hooks/use-toast";
// import { Loader2, Upload, Wallet, Copy, CheckCircle, ImageIcon, RefreshCw, WifiOff } from "lucide-react";

// interface UserDepositRequestDialogProps {
//   userId: string;
//   onSuccess?: () => void;
// }

// const BANK_DETAILS = {
//   merchantName: "Mountain Dweller",
//   accountNumber: "03064121334",
//   iban: "PK35JSBL9999903064121334",
//   tillNumber: "946336009",
//   bank: "JS Bank",
// };

// const formatFileSize = (bytes: number): string => {
//   if (bytes < 1024) return `${bytes} B`;
//   if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
//   return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
// };

// // Simple image compression
// const compressImage = async (file: File, maxSizeKB: number = 800): Promise<File> => {
//   if (file.size <= maxSizeKB * 1024) {
//     return file;
//   }

//   return new Promise((resolve) => {
//     const img = new Image();
//     const canvas = document.createElement("canvas");
//     const ctx = canvas.getContext("2d");

//     if (!ctx) {
//       resolve(file);
//       return;
//     }

//     const timeout = setTimeout(() => {
//       URL.revokeObjectURL(img.src);
//       resolve(file);
//     }, 10000);

//     img.onload = () => {
//       clearTimeout(timeout);
//       try {
//         let { width, height } = img;
//         const maxDim = 1200;
//         if (width > maxDim || height > maxDim) {
//           if (width > height) {
//             height = Math.round((height * maxDim) / width);
//             width = maxDim;
//           } else {
//             width = Math.round((width * maxDim) / height);
//             height = maxDim;
//           }
//         }

//         canvas.width = width;
//         canvas.height = height;
//         ctx.drawImage(img, 0, 0, width, height);

//         canvas.toBlob(
//           (blob) => {
//             URL.revokeObjectURL(img.src);
//             if (blob) {
//               resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
//                 type: "image/jpeg",
//                 lastModified: Date.now(),
//               }));
//             } else {
//               resolve(file);
//             }
//           },
//           "image/jpeg",
//           0.7
//         );
//       } catch {
//         URL.revokeObjectURL(img.src);
//         resolve(file);
//       }
//     };

//     img.onerror = () => {
//       clearTimeout(timeout);
//       URL.revokeObjectURL(img.src);
//       resolve(file);
//     };

//     img.src = URL.createObjectURL(file);
//   });
// };

// export function UserDepositRequestDialog({ userId, onSuccess }: UserDepositRequestDialogProps) {
//   const { toast } = useToast();
//   const [open, setOpen] = useState(false);
//   const [amount, setAmount] = useState("");
//   const [bankReference, setBankReference] = useState("");
//   const [proofFile, setProofFile] = useState<File | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [uploadStatus, setUploadStatus] = useState("");
//   const [copiedField, setCopiedField] = useState<string | null>(null);
//   const [uploadFailed, setUploadFailed] = useState(false);
//   const [isOnline, setIsOnline] = useState(true);
//   const [errorMessage, setErrorMessage] = useState("");
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     setIsOnline(navigator.onLine);
//     const handleOnline = () => setIsOnline(true);
//     const handleOffline = () => setIsOnline(false);
//     window.addEventListener("online", handleOnline);
//     window.addEventListener("offline", handleOffline);
//     return () => {
//       window.removeEventListener("online", handleOnline);
//       window.removeEventListener("offline", handleOffline);
//     };
//   }, []);

//   const copyToClipboard = (text: string, field: string) => {
//     navigator.clipboard.writeText(text);
//     setCopiedField(field);
//     setTimeout(() => setCopiedField(null), 2000);
//   };

//   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     if (!file.type.startsWith("image/")) {
//       toast({ title: "Invalid file", description: "Please upload an image", variant: "destructive" });
//       return;
//     }

//     if (file.size > 10 * 1024 * 1024) {
//       toast({ title: "File too large", description: "Maximum 10MB", variant: "destructive" });
//       return;
//     }

//     setUploadStatus("Optimizing...");
//     try {
//       const compressed = await compressImage(file, 800);
//       setProofFile(compressed);
//       setUploadFailed(false);
//       setErrorMessage("");
//       setUploadStatus("");
//       toast({ title: "Image ready", description: formatFileSize(compressed.size) });
//     } catch {
//       setProofFile(file);
//       setUploadStatus("");
//     }
//   };

//   const handleSubmit = async () => {
//     if (!amount || !proofFile) {
//       toast({ title: "Missing info", description: "Enter amount and upload proof", variant: "destructive" });
//       return;
//     }

//     if (!isOnline) {
//       toast({ title: "Offline", description: "Check your internet connection", variant: "destructive" });
//       return;
//     }

//     const depositAmount = parseInt(amount);
//     if (isNaN(depositAmount) || depositAmount < 1000) {
//       toast({ title: "Invalid amount", description: "Minimum Rs. 1,000", variant: "destructive" });
//       return;
//     }

//     setIsLoading(true);
//     setUploadProgress(10);
//     setUploadStatus("Preparing...");
//     setUploadFailed(false);
//     setErrorMessage("");

//     try {
//       // Get session token
//       setUploadProgress(20);
//       setUploadStatus("Authenticating...");

//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session) {
//         throw new Error("Please log in again");
//       }

//       // Prepare form data
//       setUploadProgress(40);
//       setUploadStatus("Preparing upload...");

//       const formData = new FormData();
//       formData.append("file", proofFile);
//       formData.append("amount", amount);
//       if (bankReference) {
//         formData.append("bankReference", bankReference);
//       }

//       // Upload via edge function
//       setUploadProgress(60);
//       setUploadStatus("Uploading...");

//       const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
//       const response = await fetch(`${supabaseUrl}/functions/v1/upload-payment-proof`, {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${session.access_token}`,
//         },
//         body: formData,
//       });

//       setUploadProgress(85);
//       setUploadStatus("Processing...");

//       const result = await response.json();

//       if (!response.ok) {
//         throw new Error(result.error || "Upload failed");
//       }

//       setUploadProgress(100);
//       setUploadStatus("Done!");

//       toast({
//         title: "Success!",
//         description: "Deposit request submitted for review",
//       });

//       // Reset form
//       setTimeout(() => {
//         setAmount("");
//         setBankReference("");
//         setProofFile(null);
//         setUploadProgress(0);
//         setUploadStatus("");
//         if (fileInputRef.current) fileInputRef.current.value = "";
//         setOpen(false);
//         onSuccess?.();
//       }, 1000);

//     } catch (error: any) {
//       console.error("Upload error:", error);
//       setUploadFailed(true);
//       setUploadStatus("Failed");
//       setErrorMessage(error.message || "Upload failed");
//       toast({
//         title: "Upload failed",
//         description: error.message || "Please try again",
//         variant: "destructive",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleRetry = () => {
//     if (!isOnline) {
//       toast({ title: "Offline", description: "Check connection", variant: "destructive" });
//       return;
//     }
//     setUploadFailed(false);
//     setErrorMessage("");
//     handleSubmit();
//   };

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>
//         <Button variant="outline" className="w-full h-auto flex-col py-4 gap-2">
//           <Wallet className="w-5 h-5" />
//           <span className="text-xs">Add Funds</span>
//         </Button>
//       </DialogTrigger>
//       <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle>Deposit Funds</DialogTitle>
//           <DialogDescription>Transfer to our bank and upload payment proof</DialogDescription>
//         </DialogHeader>

//         {!isOnline && (
//           <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
//             <WifiOff className="w-4 h-4" />
//             <span>You're offline</span>
//           </div>
//         )}

//         <div className="space-y-6 py-4">
//           {/* Bank Details */}
//           <div className="bg-muted/50 rounded-xl p-4 space-y-3">
//             <h3 className="font-semibold text-foreground">Bank Transfer Details</h3>
//             <div className="space-y-2 text-sm">
//               <div className="flex justify-between items-center">
//                 <span className="text-muted-foreground">Bank:</span>
//                 <span className="font-medium">{BANK_DETAILS.bank}</span>
//               </div>
//               <div className="flex justify-between items-center">
//                 <span className="text-muted-foreground">Account Title:</span>
//                 <div className="flex items-center gap-2">
//                   <span className="font-medium">{BANK_DETAILS.merchantName}</span>
//                   <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(BANK_DETAILS.merchantName, "name")}>
//                     {copiedField === "name" ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
//                   </Button>
//                 </div>
//               </div>
//               <div className="flex justify-between items-center">
//                 <span className="text-muted-foreground">Account #:</span>
//                 <div className="flex items-center gap-2">
//                   <span className="font-mono font-medium">{BANK_DETAILS.accountNumber}</span>
//                   <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(BANK_DETAILS.accountNumber, "account")}>
//                     {copiedField === "account" ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
//                   </Button>
//                 </div>
//               </div>
//               <div className="flex justify-between items-center">
//                 <span className="text-muted-foreground">IBAN:</span>
//                 <div className="flex items-center gap-2">
//                   <span className="font-mono font-medium text-xs">{BANK_DETAILS.iban}</span>
//                   <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(BANK_DETAILS.iban, "iban")}>
//                     {copiedField === "iban" ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
//                   </Button>
//                 </div>
//               </div>
//               <div className="flex justify-between items-center">
//                 <span className="text-muted-foreground">Till #:</span>
//                 <div className="flex items-center gap-2">
//                   <span className="font-mono font-medium">{BANK_DETAILS.tillNumber}</span>
//                   <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(BANK_DETAILS.tillNumber, "till")}>
//                     {copiedField === "till" ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Amount Input */}
//           <div className="space-y-2">
//             <Label htmlFor="amount">Amount (Rs.)</Label>
//             <Input
//               id="amount"
//               type="number"
//               placeholder="Enter amount (min. 1,000)"
//               value={amount}
//               onChange={(e) => setAmount(e.target.value)}
//               min="1000"
//               disabled={isLoading}
//             />
//           </div>

//           {/* Bank Reference */}
//           <div className="space-y-2">
//             <Label htmlFor="reference">Transaction ID (optional)</Label>
//             <Input
//               id="reference"
//               placeholder="Bank transaction reference"
//               value={bankReference}
//               onChange={(e) => setBankReference(e.target.value)}
//               disabled={isLoading}
//             />
//           </div>

//           {/* File Upload */}
//           <div className="space-y-2">
//             <Label>Payment Proof</Label>
//             <div
//               className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
//                 proofFile ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
//               } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
//               onClick={() => !isLoading && fileInputRef.current?.click()}
//             >
//               <input
//                 ref={fileInputRef}
//                 type="file"
//                 accept="image/*"
//                 onChange={handleFileChange}
//                 className="hidden"
//                 disabled={isLoading}
//               />
//               {proofFile ? (
//                 <div className="flex flex-col items-center gap-2">
//                   <CheckCircle className="w-8 h-8 text-primary" />
//                   <p className="text-sm font-medium text-foreground">{proofFile.name}</p>
//                   <p className="text-xs text-muted-foreground">{formatFileSize(proofFile.size)}</p>
//                 </div>
//               ) : (
//                 <div className="flex flex-col items-center gap-2">
//                   <ImageIcon className="w-8 h-8 text-muted-foreground" />
//                   <p className="text-sm text-muted-foreground">Tap to select payment screenshot</p>
//                 </div>
//               )}
//             </div>
//             {uploadStatus && !uploadFailed && (
//               <p className="text-xs text-muted-foreground">{uploadStatus}</p>
//             )}
//           </div>

//           {/* Upload Progress */}
//           {isLoading && uploadProgress > 0 && (
//             <div className="space-y-2">
//               <Progress value={uploadProgress} className="h-2" />
//               <p className="text-xs text-center text-muted-foreground">{uploadStatus}</p>
//             </div>
//           )}

//           {/* Error and Retry */}
//           {uploadFailed && (
//             <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-3">
//               <p className="text-sm text-destructive font-medium">Upload failed</p>
//               {errorMessage && <p className="text-xs text-destructive/80">{errorMessage}</p>}
//               <Button variant="outline" size="sm" onClick={handleRetry} className="w-full">
//                 <RefreshCw className="w-4 h-4 mr-2" />
//                 Try Again
//               </Button>
//             </div>
//           )}
//         </div>

//         <DialogFooter>
//           <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
//             Cancel
//           </Button>
//           <Button onClick={handleSubmit} disabled={isLoading || !proofFile || !amount || !isOnline}>
//             {isLoading ? (
//               <>
//                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                 Uploading...
//               </>
//             ) : (
//               <>
//                 <Upload className="w-4 h-4 mr-2" />
//                 Submit Request
//               </>
//             )}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }


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

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Mobile-optimized image compression with better error handling
const compressImage = async (file: File, maxSizeKB: number = 800): Promise<File> => {
  // Skip compression if file is already small enough
  if (file.size <= maxSizeKB * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    
    // Set crossOrigin before setting src to avoid CORS issues
    img.crossOrigin = "anonymous";
    
    let objectUrl: string | null = null;
    
    // Increased timeout for slower mobile devices
    const timeout = setTimeout(() => {
      cleanup();
      console.warn("Image compression timeout - using original file");
      resolve(file); // Fallback to original file
    }, 20000); // Increased to 20 seconds for mobile

    const cleanup = () => {
      clearTimeout(timeout);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
      img.onload = null;
      img.onerror = null;
      img.src = "";
    };

    img.onload = () => {
      try {
        const ctx = canvas.getContext("2d", { 
          willReadFrequently: false,
          alpha: false // Better performance on mobile
        });

        if (!ctx) {
          cleanup();
          console.warn("Canvas context not available - using original file");
          resolve(file);
          return;
        }

        let { width, height } = img;
        
        // More aggressive size reduction for mobile to avoid memory issues
        const maxDim = 1024; // Reduced from 1200 for better mobile compatibility
        
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
        
        // Draw image with better quality settings
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Try to convert to blob with error handling
        canvas.toBlob(
          (blob) => {
            cleanup();
            
            if (!blob) {
              console.warn("Blob creation failed - using original file");
              resolve(file);
              return;
            }

            // If compressed file is larger than original, use original
            if (blob.size > file.size) {
              resolve(file);
              return;
            }

            try {
              const compressedFile = new File(
                [blob], 
                file.name.replace(/\.[^/.]+$/, ".jpg"), 
                {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                }
              );
              resolve(compressedFile);
            } catch (error) {
              console.error("File creation error:", error);
              resolve(file);
            }
          },
          "image/jpeg",
          0.75 // Slightly higher quality for better results
        );
        
      } catch (error) {
        cleanup();
        console.error("Image compression error:", error);
        resolve(file); // Fallback to original file
      }
    };

    img.onerror = (error) => {
      cleanup();
      console.error("Image load error:", error);
      resolve(file); // Fallback to original file
    };

    // Create object URL and load image
    try {
      objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
    } catch (error) {
      cleanup();
      console.error("Object URL creation error:", error);
      resolve(file);
    }
  });
};

export function UserDepositRequestDialog({ userId, onSuccess }: UserDepositRequestDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [uploadFailed, setUploadFailed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      toast({ title: "Back online", description: "You can now upload" });
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast({ title: "Offline", description: "Check your connection", variant: "destructive" });
    };
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      // Cleanup abort controller on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [toast]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }).catch(() => {
      toast({ title: "Copy failed", description: "Please copy manually", variant: "destructive" });
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ 
        title: "Invalid file", 
        description: "Please upload an image file", 
        variant: "destructive" 
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({ 
        title: "File too large", 
        description: "Maximum file size is 10MB", 
        variant: "destructive" 
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploadStatus("Preparing image...");
    setUploadFailed(false);
    setErrorMessage("");

    try {
      // Compress image with timeout protection
      const compressed = await Promise.race([
        compressImage(file, 800),
        new Promise<File>((resolve) => 
          setTimeout(() => resolve(file), 25000) // 25 second max wait
        )
      ]);

      setProofFile(compressed);
      setUploadStatus("");
      
      toast({ 
        title: "Image ready", 
        description: `Size: ${formatFileSize(compressed.size)}`,
        duration: 2000
      });
    } catch (error) {
      console.error("File processing error:", error);
      // Use original file as fallback
      setProofFile(file);
      setUploadStatus("");
      toast({ 
        title: "Using original image", 
        description: formatFileSize(file.size),
        duration: 2000
      });
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!amount || !proofFile) {
      toast({ 
        title: "Missing information", 
        description: "Please enter amount and upload payment proof", 
        variant: "destructive" 
      });
      return;
    }

    if (!isOnline) {
      toast({ 
        title: "No internet connection", 
        description: "Please check your connection and try again", 
        variant: "destructive" 
      });
      return;
    }

    const depositAmount = parseInt(amount);
    if (isNaN(depositAmount) || depositAmount < 1000) {
      toast({ 
        title: "Invalid amount", 
        description: "Minimum deposit is Rs. 1,000", 
        variant: "destructive" 
      });
      return;
    }

    setIsLoading(true);
    setUploadProgress(10);
    setUploadStatus("Starting upload...");
    setUploadFailed(false);
    setErrorMessage("");

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Get session with timeout
      setUploadProgress(20);
      setUploadStatus("Authenticating...");

      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Authentication timeout")), 10000)
      );

      const { data: { session }, error: sessionError } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]) as any;

      if (sessionError || !session) {
        throw new Error("Authentication failed. Please log in again.");
      }

      // Prepare upload
      setUploadProgress(35);
      setUploadStatus("Preparing upload...");

      const formData = new FormData();
      formData.append("file", proofFile);
      formData.append("amount", amount);
      if (bankReference) {
        formData.append("bankReference", bankReference);
      }

      // Upload with extended timeout for mobile networks
      setUploadProgress(50);
      setUploadStatus("Uploading payment proof...");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      // Extended timeout for mobile uploads (2 minutes)
      const uploadTimeout = 120000;
      const uploadPromise = fetch(`${supabaseUrl}/functions/v1/upload-payment-proof`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      const timeoutPromise2 = new Promise<Response>((_, reject) => 
        setTimeout(() => reject(new Error("Upload timeout - please check your connection")), uploadTimeout)
      );

      const response = await Promise.race([uploadPromise, timeoutPromise2]);

      setUploadProgress(80);
      setUploadStatus("Processing response...");

      // Parse response with error handling
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error("Server response error. Please try again.");
      }

      if (!response.ok) {
        throw new Error(result.error || `Upload failed (${response.status})`);
      }

      setUploadProgress(100);
      setUploadStatus("Success!");

      toast({
        title: "Success!",
        description: "Your deposit request has been submitted for review",
        duration: 3000
      });

      // Reset form after short delay
      setTimeout(() => {
        setAmount("");
        setBankReference("");
        setProofFile(null);
        setUploadProgress(0);
        setUploadStatus("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        setOpen(false);
        onSuccess?.();
      }, 1500);

    } catch (error: any) {
      console.error("Upload error:", error);
      
      // Handle specific error types
      let errorMsg = "Upload failed. Please try again.";
      
      if (error.name === "AbortError") {
        errorMsg = "Upload cancelled";
      } else if (error.message.includes("timeout")) {
        errorMsg = "Upload timeout - check your connection";
      } else if (error.message.includes("Authentication")) {
        errorMsg = error.message;
      } else if (error.message.includes("network") || error.message.includes("Failed to fetch")) {
        errorMsg = "Network error - check your connection";
      } else if (error.message) {
        errorMsg = error.message;
      }

      setUploadFailed(true);
      setUploadStatus("Failed");
      setErrorMessage(errorMsg);
      
      toast({
        title: "Upload failed",
        description: errorMsg,
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleRetry = () => {
    if (!isOnline) {
      toast({ 
        title: "Still offline", 
        description: "Please check your internet connection", 
        variant: "destructive" 
      });
      return;
    }
    setUploadFailed(false);
    setErrorMessage("");
    setUploadProgress(0);
    handleSubmit();
  };

  const handleCancel = () => {
    // Abort ongoing upload if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen && isLoading) {
        // Confirm before closing during upload
        if (!window.confirm("Upload in progress. Are you sure you want to cancel?")) {
          return;
        }
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }
      setOpen(newOpen);
    }}>
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
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            <span>You're offline - connect to internet to upload</span>
          </div>
        )}

        <div className="space-y-6 py-4">
          {/* Bank Details */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-foreground">Bank Transfer Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground">Bank:</span>
                <span className="font-medium">{BANK_DETAILS.bank}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground">Account Title:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{BANK_DETAILS.merchantName}</span>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6 flex-shrink-0" 
                    onClick={() => copyToClipboard(BANK_DETAILS.merchantName, "name")}
                  >
                    {copiedField === "name" ? 
                      <CheckCircle className="h-3 w-3 text-green-500" /> : 
                      <Copy className="h-3 w-3" />
                    }
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground">Account #:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{BANK_DETAILS.accountNumber}</span>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6 flex-shrink-0" 
                    onClick={() => copyToClipboard(BANK_DETAILS.accountNumber, "account")}
                  >
                    {copiedField === "account" ? 
                      <CheckCircle className="h-3 w-3 text-green-500" /> : 
                      <Copy className="h-3 w-3" />
                    }
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-muted-foreground">IBAN:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-xs break-all text-right">{BANK_DETAILS.iban}</span>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6 flex-shrink-0" 
                    onClick={() => copyToClipboard(BANK_DETAILS.iban, "iban")}
                  >
                    {copiedField === "iban" ? 
                      <CheckCircle className="h-3 w-3 text-green-500" /> : 
                      <Copy className="h-3 w-3" />
                    }
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground">Till #:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{BANK_DETAILS.tillNumber}</span>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6 flex-shrink-0" 
                    onClick={() => copyToClipboard(BANK_DETAILS.tillNumber, "till")}
                  >
                    {copiedField === "till" ? 
                      <CheckCircle className="h-3 w-3 text-green-500" /> : 
                      <Copy className="h-3 w-3" />
                    }
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
              inputMode="numeric"
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
            <Label>Payment Proof Screenshot</Label>
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                proofFile ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}`}
              onClick={() => !isLoading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                disabled={isLoading}
              />
              {proofFile ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle className="w-8 h-8 text-primary" />
                  <p className="text-sm font-medium text-foreground break-all px-2">{proofFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(proofFile.size)}</p>
                  {!isLoading && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProofFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      Change Image
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Tap to upload payment screenshot</p>
                  <p className="text-xs text-muted-foreground/70">JPG, PNG or WebP (max 10MB)</p>
                </div>
              )}
            </div>
            {uploadStatus && !uploadFailed && (
              <p className="text-xs text-center text-muted-foreground animate-pulse">{uploadStatus}</p>
            )}
          </div>

          {/* Upload Progress */}
          {isLoading && uploadProgress > 0 && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground font-medium">{uploadStatus}</p>
            </div>
          )}

          {/* Error and Retry */}
          {uploadFailed && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-3">
              <p className="text-sm text-destructive font-medium">Upload Failed</p>
              {errorMessage && <p className="text-xs text-destructive/80">{errorMessage}</p>}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry} 
                className="w-full"
                disabled={!isOnline}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleCancel} 
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !proofFile || !amount || !isOnline}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Submit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
