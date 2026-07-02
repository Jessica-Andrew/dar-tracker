import * as React from 'react';
import { cn } from '@/lib/utils';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * A parchment surface with the app's grain texture. The `grain` class
 * (see globals.css) supplies the ::before pseudo-element. Everything
 * inside should have `relative` positioning to sit above the grain.
 */
export function GrainSurface({ className, children, ...props }: Props) {
  return (
    <div
      className={cn('grain relative overflow-hidden bg-parchment-200', className)}
      {...props}
    >
      {children}
    </div>
  );
}
