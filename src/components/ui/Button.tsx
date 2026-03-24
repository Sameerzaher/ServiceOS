import {
  type ButtonHTMLAttributes,
  forwardRef,
} from "react";

import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "border border-emerald-700 bg-emerald-700 text-white shadow-emerald-900/20 hover:bg-emerald-800 focus-visible:outline-emerald-700",
  secondary:
    "border border-neutral-200/90 bg-white text-neutral-900 shadow-sm hover:border-emerald-200/80 hover:bg-emerald-50/50 focus-visible:outline-emerald-500/40",
  danger:
    "border border-red-200 bg-white text-red-700 hover:bg-red-50 focus-visible:outline-red-400",
};

const sizeClass: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "min-h-[2.75rem] px-3.5 py-2 text-sm sm:min-h-0 sm:px-3 sm:py-1.5",
  md: "min-h-[2.75rem] px-4 py-2.5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "primary",
      size = "md",
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]",
          variantClass[variant],
          sizeClass[size],
          className,
        )}
        {...props}
      />
    );
  },
);
