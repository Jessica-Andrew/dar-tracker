import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Three variants mapped to the design token roles:
 *  - primary: terracotta with hard shadow, the app's dominant CTA
 *  - ghost:   quiet action, underlined italic serif
 *  - danger:  destructive, muted red — for "uproot" etc.
 *  - outline: parchment ground, terracotta border (secondary form action)
 */
const buttonVariants = cva(
  'inline-flex items-center gap-2 font-display italic transition-transform ease-spring duration-quick focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-200 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary:
          'bg-clay-500 text-[color:var(--text-on-clay)] shadow-button hover:-translate-y-px hover:shadow-button-hover active:translate-y-0.5 active:shadow-button-active',
        outline:
          'border-2 border-clay-500 text-clay-500 bg-transparent hover:bg-clay-100',
        ghost:
          'text-ink-700 hover:text-clay-500 underline decoration-ochre-500 underline-offset-4',
        danger: 'text-ink-500 hover:text-danger-500',
      },
      size: {
        md: 'px-5 py-2.5 text-base rounded-lg',
        sm: 'px-3 py-1.5 text-sm rounded-md',
        lg: 'px-6 py-3.5 text-md rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
    compoundVariants: [
      { variant: 'ghost', className: 'shadow-none' },
      { variant: 'danger', className: 'shadow-none' },
    ],
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
