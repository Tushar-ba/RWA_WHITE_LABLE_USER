import { Label } from "@/components/ui/label";
import { ReactNode } from "react";

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  label: string | ReactNode;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  disabled?: boolean;
  error?: string;
}

export function RadioGroup({ 
  label, 
  name, 
  value, 
  onChange, 
  options, 
  disabled = false,
  error 
}: RadioGroupProps) {
  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">{label}</Label>
      <div className="space-y-3">
        {options.map((option) => (
          <label
            key={option.value}
            className={`
              flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all
              ${value === option.value 
                ? 'border-brand-dark-gold dark:border-brand-gold bg-brand-gold/5 dark:bg-brand-gold/10' 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="mt-1 h-4 w-4 text-brand-dark-gold dark:text-brand-gold focus:ring-brand-dark-gold dark:focus:ring-brand-gold"
            />
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {option.label}
              </p>
              {option.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {option.description}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}

