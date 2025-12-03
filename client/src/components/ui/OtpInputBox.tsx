import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

interface OtpInputBoxProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  autoFocus?: boolean;
}

export function OtpInputBox({
  value,
  onChange,
  error,
  autoFocus,
}: OtpInputBoxProps) {
  return (
    <div className="flex flex-col items-center space-y-3 sm:space-y-4">
      <InputOTP
        maxLength={6}
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        className="gap-1 sm:gap-2 lg:gap-3"
      >
        <InputOTPGroup className="gap-1 sm:gap-2 lg:gap-3">
          {[...Array(6)].map((_, i) => (
            <InputOTPSlot 
              key={i} 
              index={i} 
              className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-base sm:text-lg lg:text-xl font-semibold border-2 border-gray-300 dark:border-gray-600 rounded-md sm:rounded-lg focus:border-brand-gold dark:focus:border-brand-gold transition-colors"
              data-testid={`otp-input-${i}`}
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
      {error && (
        <p className="text-red-500 text-xs sm:text-sm text-center px-2">{error}</p>
      )}
    </div>
  );
}
