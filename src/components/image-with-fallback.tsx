"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import BouquetPlaceholder from "@/components/bouquet-placeholder";

type ImageWithFallbackProps = Omit<ImageProps, "src" | "alt"> & {
  src: string;
  alt: string;
  fallbackClassName?: string;
};

export default function ImageWithFallback({
  src,
  alt,
  className,
  fallbackClassName,
  ...props
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const isFill = Boolean("fill" in props && props.fill);
  const fallbackStyle =
    !isFill &&
    typeof props.width === "number" &&
    typeof props.height === "number"
      ? { width: props.width, height: props.height }
      : undefined;

  if (!src || hasError) {
    return (
      <div
        className={`${isFill ? "absolute inset-0" : ""} flex items-center justify-center bg-white/70 text-[color:var(--brand)] opacity-40 ${className || ""} ${fallbackClassName || ""}`}
        role="img"
        aria-label={alt}
        style={fallbackStyle}
      >
        <BouquetPlaceholder className="h-12 w-12" />
      </div>
    );
  }

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
