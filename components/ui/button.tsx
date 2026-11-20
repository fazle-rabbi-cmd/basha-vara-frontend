import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] select-none touch-manipulation",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-sm hover:from-teal-700 hover:to-teal-600 hover:shadow-md",
        secondary: "bg-muted/80 text-foreground hover:bg-muted border border-border/50",
        outline: "border border-border/80 bg-background/60 hover:bg-muted/60 text-foreground backdrop-blur-sm",
        ghost: "hover:bg-muted/60 text-foreground",
        accent: "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm hover:from-amber-600 hover:to-orange-600 hover:shadow-md",
        destructive: "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm hover:from-red-700 hover:to-rose-700 hover:shadow-md",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-3.5 text-xs rounded-lg",
        lg: "h-12 px-7 text-base rounded-2xl",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };