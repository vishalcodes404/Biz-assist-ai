import React from "react";

interface BrandLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<BrandLogoProps["size"]>, string> = {
  xs: "h-6 w-auto",
  sm: "h-8 w-auto",
  md: "h-10 w-auto",
  lg: "h-14 sm:h-16 w-auto",
  xl: "h-20 sm:h-24 w-auto",
};

export function BrandLogo({ size = "md", className = "" }: BrandLogoProps) {
  return (
    <img
      src="/bizassist-logo.png?v=2"
      alt="BizAssist Ai"
      className={`select-none bg-transparent object-contain ${SIZE_CLASSES[size]} ${className}`}
    />
  );
}
