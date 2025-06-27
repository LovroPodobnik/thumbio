import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-background-brand text-text-on-brand hover:bg-background-brand-hover",
        secondary:
          "border-transparent bg-background-secondary text-text-primary hover:bg-neutral-20",
        destructive:
          "border-transparent bg-red-50 text-neutral-0 hover:bg-red-60",
        outline: "text-text-primary border border-border-primary",
        success:
          "border-transparent bg-green-60 text-neutral-0 hover:bg-green-70",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Badge = React.forwardRef(({ className, variant, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
});

Badge.displayName = "Badge";

export { Badge, badgeVariants };