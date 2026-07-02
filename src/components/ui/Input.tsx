import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, mono, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full bg-transparent border-0 border-b-[1.5px] border-parchment-500 pb-2 pt-1.5 text-base text-ink-900 outline-none transition-colors duration-quick placeholder:text-ink-300 placeholder:italic placeholder:font-display focus:border-clay-500',
        mono && 'font-mono text-sm',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export const FieldLabel = ({
  children,
  optional,
  className,
}: {
  children: React.ReactNode;
  optional?: boolean | string;
  className?: string;
}) => (
  <label className={cn('block font-display italic text-xs text-ink-700 mb-1', className)}>
    {children}
    {optional && (
      <span className="ml-1.5 font-body not-italic text-[10.5px] text-ink-500">
        {typeof optional === 'string' ? optional : 'optional'}
      </span>
    )}
  </label>
);
