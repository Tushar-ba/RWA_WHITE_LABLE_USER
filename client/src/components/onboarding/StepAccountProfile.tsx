import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingData } from "@shared/schema";
import { RadioGroup } from "./RadioGroup";

interface StepAccountProfileProps {
  disabled?: boolean;
}

export function StepAccountProfile({ disabled = false }: StepAccountProfileProps) {
  const { formState: { errors }, setValue, watch, register } = useFormContext<OnboardingData>();
  const purposeOfAccount = watch("purpose_of_account");
  const expectedTransactionActivity = watch("expected_transaction_activity");
  const accountType = watch("account_type");
  const isPoliticallyExposed = watch("is_politically_exposed") || false;

  const purposeOptions = [
    { value: "investment", label: "Investment" },
    { value: "savings", label: "Savings" },
    { value: "trading", label: "Trading" },
    { value: "business", label: "Business Operations" },
    { value: "wealth_preservation", label: "Wealth Preservation" },
    { value: "other", label: "Other" }
  ];

  const activityOptions = [
    { value: "low", label: "Low (1-5 transactions per month)" },
    { value: "medium", label: "Medium (6-20 transactions per month)" },
    { value: "high", label: "High (21+ transactions per month)" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="purpose_of_account" className="text-base font-medium">
          Purpose of Account<span className="text-red-500 ml-1">*</span>
        </Label>
        <Select 
          value={purposeOfAccount || ""}
          onValueChange={(value) => setValue("purpose_of_account", value, { shouldValidate: true })}
          disabled={disabled}
        >
          <SelectTrigger className="mt-2 h-11">
            <SelectValue placeholder="Select purpose of account" />
          </SelectTrigger>
          <SelectContent>
            {purposeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.purpose_of_account && (
          <p className="text-red-500 text-sm mt-1">{errors.purpose_of_account.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="expected_transaction_activity" className="text-base font-medium">
          Expected Transaction Activity<span className="text-red-500 ml-1">*</span>
        </Label>
        <Select 
          value={expectedTransactionActivity || ""}
          onValueChange={(value) => setValue("expected_transaction_activity", value, { shouldValidate: true })}
          disabled={disabled}
        >
          <SelectTrigger className="mt-2 h-11">
            <SelectValue placeholder="Select expected transaction activity" />
          </SelectTrigger>
          <SelectContent>
            {activityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.expected_transaction_activity && (
          <p className="text-red-500 text-sm mt-1">{errors.expected_transaction_activity.message}</p>
        )}
      </div>

        <div>
          <RadioGroup
            label={
              <>
                Are you a Politically Exposed Person?<span className="text-red-500 ml-1">*</span>
              </>
            }
            name="is_politically_exposed"
            value={isPoliticallyExposed === true ? "yes" : isPoliticallyExposed === false ? "no" : ""}
            onChange={(value) => setValue("is_politically_exposed", value === "yes", { shouldValidate: true })}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" }
            ]}
            disabled={disabled}
            error={errors.is_politically_exposed?.message}
          />
        </div>

      {accountType === "individual" && (
        <div>
          <Label htmlFor="tin" className="text-base font-medium">
            FATCA/CRS + TIN (if applicable)
          </Label>
          <Input
            id="tin"
            type="text"
            placeholder="Enter your TIN"
            className="mt-2 h-11"
            disabled={disabled}
            {...register("tin")}
          />
          {errors.tin && (
            <p className="text-red-500 text-sm mt-1">{errors.tin.message}</p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Enter your Tax Identification Number if applicable in your jurisdiction
          </p>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-100 flex items-start">
          <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>This information helps us provide you with better service and ensure compliance with regulatory requirements.</span>
        </p>
      </div>
    </div>
  );
}

