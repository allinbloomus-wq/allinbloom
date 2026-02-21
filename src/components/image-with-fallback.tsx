"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

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
  const isFallback = !src || hasError;
  const resolvedSrc = isFallback ? "/images/mock.webp" : src;
  const resolvedClassName =
    `${className || ""} ${isFallback ? fallbackClassName || "" : ""}`.trim() ||
    undefined;

  return (
    <Image
      {...props}
      src={resolvedSrc}
      alt={alt}
      className={resolvedClassName}
      onError={isFallback ? undefined : () => setHasError(true)}
    />
  );
}
