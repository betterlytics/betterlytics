"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "nextra-theme-docs";
import { getAssetPath } from "@/lib/constants";

interface LogoProps {
  variant?: "simple" | "full" | "icon";
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  showText?: boolean;
  textSize?: "sm" | "md" | "lg" | "xl";
  textPlacement?: "right" | "left" | "bottom" | "top";
  spacing?: "tight" | "normal" | "loose";
}

export default function Logo({
  variant = "simple",
  className,
  width,
  height,
  priority = false,
  showText = false,
  textSize = "md",
  textPlacement = "right",
  spacing = "normal",
}: LogoProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSources = {
    simple: {
      dark: getAssetPath("/betterlytics-logo-light-simple.svg"),
      light: getAssetPath("/betterlytics-logo-dark-simple.svg"),
    },
    full: {
      dark: getAssetPath("/logo-light-svg-full.svg"),
      light: getAssetPath("/logo-dark-svg-full.svg"),
    },
    icon: {
      dark: getAssetPath("/images/favicon-light.svg"),
      light: getAssetPath("/images/favicon-dark.svg"),
    },
  };

  const textSizeClasses = {
    sm: "text-lg font-bold",
    md: "text-xl font-bold",
    lg: "text-2xl font-bold",
    xl: "text-3xl font-bold",
  };

  const spacingClasses = {
    tight: "gap-1",
    normal: "gap-2",
    loose: "gap-4",
  };

  const placementClasses = {
    right: "flex-row items-center",
    left: "flex-row-reverse items-center",
    bottom: "flex-col items-center",
    top: "flex-col-reverse items-center",
  };

  const isDark = mounted && resolvedTheme === "dark";
  const logoSrc = isDark
    ? logoSources[variant].dark
    : logoSources[variant].light;

  const logoImage = (
    <Image
      src={logoSrc}
      alt="Betterlytics"
      width={width || 32}
      height={height || 32}
      priority={priority}
      className="object-contain"
    />
  );

  if (!showText) {
    return <div className={cn("inline-block", className)}>{logoImage}</div>;
  }

  const logoText = showText && (
    <span className={cn(textSizeClasses[textSize], "text-foreground")}>
      Betterlytics
    </span>
  );

  return (
    <div
      className={cn(
        "flex",
        placementClasses[textPlacement],
        spacingClasses[spacing],
        className
      )}
    >
      {logoImage}
      {logoText}
    </div>
  );
}
