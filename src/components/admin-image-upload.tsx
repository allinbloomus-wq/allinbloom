"use client";

import { useId, useState } from "react";
import ImageWithFallback from "@/components/image-with-fallback";
import { clientFetch } from "@/lib/api-client";

type AdminImageUploadProps = {
  defaultValue: string;
  recommendedSize?: string;
  isInvalid?: boolean;
};

export default function AdminImageUpload({
  defaultValue,
  recommendedSize = "600x800",
  isInvalid = false,
}: AdminImageUploadProps) {
  const fileInputId = useId();
  const [imageUrl, setImageUrl] = useState(defaultValue);
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("No file chosen");

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFileName("No file chosen");
      return;
    }

    setSelectedFileName(file.name);

    if (!cloudName || !uploadPreset) {
      setStatus("Cloudinary is not configured.");
      return;
    }

    setUploading(true);
    setStatus("Uploading...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      const response = await clientFetch("/api/upload", {
        method: "POST",
        body: formData,
      }, true);
      const data = await response.json();

      if (!response.ok) {
        setStatus(data?.detail || data?.error?.message || "Upload failed.");
      } else {
        const url = data.url;
        if (url) {
          setImageUrl(url);
          setStatus("Upload complete.");
        } else {
          setStatus("Upload complete, but no URL returned.");
        }
      }
    } catch (error) {
      console.error(error);
      setStatus("Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="h-32 w-32 overflow-hidden rounded-[22px] border border-white/80 bg-white">
          <ImageWithFallback
            src={imageUrl}
            alt="Bouquet preview"
            width={160}
            height={160}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 space-y-2 text-xs text-stone-600">
          <p>Recommended size: {recommendedSize}.</p>
          <p>Uploads go to Cloudinary and save the URL.</p>
        </div>
      </div>
      <label className="flex flex-col gap-2 text-sm text-stone-700">
        Image URL
        <input
          name="image"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          required
          className={`h-11 w-full min-w-0 rounded-2xl bg-white/80 px-4 py-0 text-sm text-stone-800 outline-none ${
            isInvalid
              ? "border border-rose-300 focus:border-rose-500"
              : "border border-stone-200 focus:border-stone-400"
          }`}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-stone-700" htmlFor={fileInputId}>
        Upload image
        <span
          className={`flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white/80 px-4 text-sm text-stone-700 outline-none transition focus-within:border-stone-400 ${
            uploading ? "cursor-not-allowed opacity-70" : "cursor-pointer"
          }`}
        >
          <span className="min-w-0 truncate">{selectedFileName}</span>
          <span className="inline-flex h-7 shrink-0 items-center rounded-full border border-stone-300 bg-white px-3 text-[10px] uppercase tracking-[0.2em] text-stone-600">
            Browse
          </span>
        </span>
        <input
          id={fileInputId}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="sr-only"
        />
      </label>
      {status ? (
        <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
          {status}
        </p>
      ) : null}
    </div>
  );
}
