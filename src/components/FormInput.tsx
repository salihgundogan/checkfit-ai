import React, { forwardRef } from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  suffix?: string; // cm veya kg için
  onEnterPress?: () => void; // Enter'a basınca tetiklenecek
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, suffix, onEnterPress, className, ...props }, ref) => {
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onEnterPress) {
        e.preventDefault();
        onEnterPress();
      }
    };

    return (
      <div className={`flex flex-col gap-2 group ${className}`}>
        <label className="text-sm font-semibold text-text-main dark:text-[#e0e6e0] ml-1">
          {label}
        </label>
        <div className="relative transition-transform duration-200 focus-within:scale-[1.01] flex items-center w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <input
            ref={ref}
            className="w-full bg-transparent px-5 py-4 text-base text-text-main dark:text-white placeholder:text-gray-400 outline-none rounded-2xl"
            onKeyDown={handleKeyDown}
            {...props}
          />
          {suffix && (
            <span className="pr-5 text-text-muted dark:text-gray-400 font-medium select-none">
              {suffix}
            </span>
          )}
        </div>
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';