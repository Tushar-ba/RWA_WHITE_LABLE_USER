import { Label } from "@/components/ui/label";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import './phone-input.css';

interface PhoneInputFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export function PhoneInputField({ 
  id, 
  label, 
  value, 
  onChange, 
  error, 
  disabled = false,
  required = false 
}: PhoneInputFieldProps) {
  return (
    <div>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="mt-1 phone-input-container">
        <PhoneInput
          country={'us'}
          value={value || ''}
          onChange={onChange}
          disabled={disabled}
          inputProps={{
            name: id,
            required,
            autoFocus: false
          }}
        />
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}

