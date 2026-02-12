import React, { forwardRef } from 'react';

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  onDateSelect?: () => void;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ label, onDateSelect, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 group">
        <label className="text-sm font-semibold text-text-main dark:text-[#e0e6e0] ml-1">
          {label}
        </label>
        <div className="relative transition-transform duration-200 focus-within:scale-[1.01]">
          <input
            ref={ref}
            type="date"
            onChange={(e) => {
                props.onChange?.(e);
                // Tarih dolduğunda bir sonraki alana geçişi tetiklemek için kontrol
                if(e.target.value && onDateSelect) onDateSelect();
            }}
            className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark px-5 py-4 text-base text-text-main dark:text-white placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm appearance-none relative z-10 bg-transparent"
            {...props}
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-primary/70 z-0">
            <span className="material-symbols-outlined">calendar_today</span>
          </div>
        </div>
      </div>
    );
  }
);

DateInput.displayName = 'DateInput';