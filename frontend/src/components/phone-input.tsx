'use client';

import { IMaskInput } from 'react-imask';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * Input de telefone com máscara brasileira.
 * Aceita: (11) 99999-9999 (celular) ou (11) 9999-9999 (fixo).
 * Só aceita números — qualquer letra é descartada.
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  function PhoneInput(
    {
      value = '',
      onChange,
      placeholder = '(11) 99999-9999',
      className,
      id,
      required,
      disabled,
      autoFocus,
    },
    ref
  ) {
    return (
      <IMaskInput
        id={id}
        inputRef={ref}
        mask={[
          { mask: '(00) 0000-0000' }, // fixo
          { mask: '(00) 00000-0000' }, // celular
        ]}
        value={value}
        unmask={false}
        onAccept={(val) => onChange?.(String(val))}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        inputMode="numeric"
        className={cn(
          'flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
      />
    );
  }
);
