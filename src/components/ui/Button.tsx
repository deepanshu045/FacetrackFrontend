import React, { ButtonHTMLAttributes, ReactElement } from "react";
import { cn } from "../../utils/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
}

const variants = {
  primary:
    "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20",

  secondary:
    "bg-white/10 hover:bg-white/15 text-white border border-white/10",

  danger:
    "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/20",

  ghost:
    "hover:bg-white/10 text-[#94A3B8] hover:text-white",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  asChild = false,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
    variants[variant],
    sizes[size],
    className
  );

  // If asChild is true and children is a valid React element, clone it and apply props/styles
  if (asChild && React.isValidElement(children)) {
    const child = children as ReactElement;
    const childProps = {
      ...props,
      className: cn((child.props && (child.props as any).className) || "", classes),
    } as any;

    return React.cloneElement(child, childProps);
  }

  // Otherwise render a normal button and do not pass asChild to DOM
  return (
    <button
      {...props}
      className={classes}
    >
      {children}
    </button>
  );
}