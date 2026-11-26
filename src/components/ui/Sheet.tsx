import type { ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function Sheet({ open, onOpenChange, title, subtitle, children }: Props) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-ink-900/55 backdrop-blur-[4px]" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-parchment-100 px-5 pb-8 pt-2.5 shadow-card focus:outline-none md:inset-auto md:left-1/2 md:top-1/2 md:w-[26rem] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:p-6"
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-parchment-500 md:hidden" />
          <div className="border-b-[1.5px] border-parchment-400 pb-3">
            <DialogPrimitive.Title className="font-display text-lg font-black leading-tight text-ink-900">
              {title}
            </DialogPrimitive.Title>
            {subtitle && (
              <p className="mt-1 font-mono text-xs text-ink-700">{subtitle}</p>
            )}
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}