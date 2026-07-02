import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Modal = DialogPrimitive.Root;
export const ModalTrigger = DialogPrimitive.Trigger;

export const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-ink-900/55 backdrop-blur-[4px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'grain relative fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-[26rem] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-parchment-200 p-6 shadow-card animate-card-in focus:outline-none',
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className="absolute right-4 top-4 rounded-md p-1.5 text-ink-500 transition-colors hover:bg-parchment-300 hover:text-clay-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500"
        aria-label="Close"
      >
        <X size={16} />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
ModalContent.displayName = 'ModalContent';

export const ModalHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('relative mb-4', className)} {...props} />
);

export const ModalTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title asChild>
    <h2
      ref={ref}
      className={cn('font-display text-xl font-black leading-none text-ink-900', className)}
      {...props}
    />
  </DialogPrimitive.Title>
));
ModalTitle.displayName = 'ModalTitle';

export const ModalKicker = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs uppercase tracking-kicker text-ink-500">{children}</p>
);
