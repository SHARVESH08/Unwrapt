import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "../../lib/utils";

/* A soft, tactile button styled from the active chapter's palette. */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-body font-semibold tracking-wide transition-colors duration-300 focus:outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none",
  {
    variants: {
      variant: {
        solid:
          "bg-accent text-surface shadow-[0_8px_30px_-8px_var(--c-glow)] hover:bg-accent-2",
        outline:
          "border border-border bg-surface/60 text-text hover:bg-surface backdrop-blur-sm",
        ghost: "text-text-soft hover:text-text hover:bg-surface/60",
      },
      size: {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-9 py-4 text-lg",
      },
    },
    defaultVariants: { variant: "solid", size: "md" },
  },
);

type ButtonProps = HTMLMotionProps<"button"> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
