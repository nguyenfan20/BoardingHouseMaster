// Style: .claude/skills/ui-design/references/components.md § Input
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-neutral-900">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          className={cn(
            "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900",
            "placeholder:text-neutral-400",
            "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
            "disabled:bg-neutral-50 disabled:text-neutral-400",
            error && "border-error-600 focus:ring-error-600",
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-error-600">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
