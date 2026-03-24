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
    "border border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:outline-neutral-900",
  secondary:
    "border border-neutral-300 bg-white text-neutral-900 shadow-sm hover:bg-neutral-50 focus-visible:outline-neutral-400",
  danger:
    "border border-red-200 bg-white text-red-700 hover:bg-red-50 focus-visible:outline-red-400",
};

const sizeClass: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-base",
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
