import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CLOUDINARY_CLOUD_NAME = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    const CLOUDINARY_UPLOAD_PRESET = Deno.env.get("CLOUDINARY_UPLOAD_PRESET");

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      console.error("Missing Cloudinary config:", { 
        hasCloudName: !!CLOUDINARY_CLOUD_NAME, 
        hasPreset: !!CLOUDINARY_UPLOAD_PRESET 
      });
      throw new Error("Cloudinary configuration missing");
    }

    const contentType = req.headers.get("content-type") || "";
    console.log("Request content-type:", contentType);

    let fileBlob: Blob;
    let fileName: string;

    // Handle both FormData and JSON requests
    if (contentType.includes("multipart/form-data")) {
      // FormData upload (preferred for mobile)
      const formData = await req.formData();
      const file = formData.get("file");
      fileName = (formData.get("fileName") as string) || `upload_${Date.now()}`;

      if (!file || !(file instanceof File)) {
        throw new Error("No file provided in FormData");
      }

      fileBlob = file;
      console.log("FormData upload:", { fileName, size: file.size, type: file.type });
    } else {
      // JSON with base64 (fallback)
      const { file, fileName: jsonFileName, contentType: fileContentType } = await req.json();

      if (!file || !jsonFileName) {
        throw new Error("Missing file or fileName in JSON");
      }

      fileName = jsonFileName;

      // Decode base64 file
      const binaryStr = atob(file);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      fileBlob = new Blob([bytes], { type: fileContentType || "image/jpeg" });
      console.log("Base64 upload:", { fileName, size: fileBlob.size });
    }

    // Create form data for Cloudinary
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", fileBlob);
    cloudinaryFormData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    cloudinaryFormData.append("public_id", fileName);

    console.log("Uploading to Cloudinary...");

    // Upload to Cloudinary
    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: "POST",
        body: cloudinaryFormData,
      }
    );

    if (!cloudinaryResponse.ok) {
      const errorData = await cloudinaryResponse.json().catch(() => ({}));
      console.error("Cloudinary error:", cloudinaryResponse.status, errorData);
      throw new Error(errorData.error?.message || "Cloudinary upload failed");
    }

    const result = await cloudinaryResponse.json();
    console.log("Cloudinary success:", result.secure_url);

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: result.secure_url,
        publicId: result.public_id 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Upload failed";
    console.error("Upload error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});
