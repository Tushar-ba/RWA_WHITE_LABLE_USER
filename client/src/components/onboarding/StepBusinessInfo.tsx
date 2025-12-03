import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Country, State, City } from 'country-state-city';
import { OnboardingData } from "@shared/schema";
import { PhoneInputField } from "./PhoneInputField";
import { FormRow } from "./FormRow";
import { useEffect, useMemo } from "react";

interface StepBusinessInfoProps {
  disabled?: boolean;
}

export function StepBusinessInfo({ disabled = false }: StepBusinessInfoProps) {
  const { register, formState: { errors }, setValue, watch } = useFormContext<OnboardingData>();
  const businessCountry = watch("business_country");
  const businessState = watch("business_state");
  
  const countries = Country.getAllCountries();
  
  const selectedBusinessCountry = useMemo(() => 
    countries.find(c => c.name === businessCountry), [businessCountry, countries]
  );
  
  const businessStates = useMemo(() => 
    selectedBusinessCountry ? State.getStatesOfCountry(selectedBusinessCountry.isoCode) : [], 
    [selectedBusinessCountry]
  );
  
  const selectedBusinessState = useMemo(() => 
    businessStates.find(s => s.name === businessState), [businessState, businessStates]
  );
  
  const businessCities = useMemo(() => 
    selectedBusinessState ? City.getCitiesOfState(selectedBusinessCountry?.isoCode || '', selectedBusinessState.isoCode) : [], 
    [selectedBusinessState, selectedBusinessCountry]
  );

  useEffect(() => {
    if (businessCountry && !selectedBusinessCountry) {
      setValue("business_state", "");
      setValue("business_city", "");
    }
  }, [businessCountry, selectedBusinessCountry, setValue]);

  useEffect(() => {
    if (businessState && !selectedBusinessState) {
      setValue("business_city", "");
    }
  }, [businessState, selectedBusinessState, setValue]);

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <FormRow>
        <div>
          <Label htmlFor="company_name">
            Company Name<span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="company_name"
            type="text"
            {...register("company_name")}
            className="mt-1"
            placeholder="Enter company name"
            disabled={disabled}
          />
          {errors.company_name && (
            <p className="text-red-500 text-sm mt-1">{errors.company_name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="registration_id">
            Business Registration ID<span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="registration_id"
            type="text"
            {...register("registration_id")}
            className="mt-1"
            placeholder="Enter business registration ID"
            disabled={disabled}
          />
          {errors.registration_id && (
            <p className="text-red-500 text-sm mt-1">{errors.registration_id.message}</p>
          )}
        </div>
      </FormRow>

      <FormRow>
        <div>
          <Label htmlFor="company_website">Company Website (Optional)</Label>
          <Input
            id="company_website"
            type="url"
            {...register("company_website")}
            className="mt-1"
            placeholder="https://example.com"
            disabled={disabled}
          />
          {errors.company_website && (
            <p className="text-red-500 text-sm mt-1">{errors.company_website.message}</p>
          )}
        </div>

        <PhoneInputField
          id="company_phone"
          label="Company Phone"
          value={watch("company_phone") || ''}
          onChange={(value) => setValue("company_phone", value, { shouldValidate: true })}
          error={errors.company_phone?.message}
          disabled={disabled}
        />
      </FormRow>

      {/* Business Address Section */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Business Address</h3>
        
        <div className="space-y-4">
          <FormRow>
            <div>
              <Label htmlFor="business_address1">
                Business Address Line 1<span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="business_address1"
                type="text"
                {...register("business_address1")}
                className="mt-1"
                placeholder="Enter business address line 1"
                disabled={disabled}
              />
              {errors.business_address1 && (
                <p className="text-red-500 text-sm mt-1">{errors.business_address1.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="business_address2">Business Address Line 2 (Optional)</Label>
              <Input
                id="business_address2"
                type="text"
                {...register("business_address2")}
                className="mt-1"
                placeholder="Enter business address line 2"
                disabled={disabled}
              />
            </div>
          </FormRow>

          <FormRow>
            <div>
              <Label htmlFor="business_country">
                Country<span className="text-red-500 ml-1">*</span>
              </Label>
              <Select 
                value={businessCountry || ""}
                onValueChange={(value) => {
                  setValue("business_country", value);
                  setValue("business_state", "");
                  setValue("business_city", "");
                }}
                disabled={disabled}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.isoCode} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.business_country && (
                <p className="text-red-500 text-sm mt-1">{errors.business_country.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="business_state">
                State/Province<span className="text-red-500 ml-1">*</span>
              </Label>
              <Select 
                value={businessState || ""}
                onValueChange={(value) => {
                  setValue("business_state", value);
                  setValue("business_city", "");
                }}
                disabled={disabled || !businessCountry}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={businessCountry ? "Select state" : "Select country first"} />
                </SelectTrigger>
                <SelectContent>
                  {businessStates.map((s) => (
                    <SelectItem key={s.isoCode} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.business_state && (
                <p className="text-red-500 text-sm mt-1">{errors.business_state.message}</p>
              )}
            </div>
          </FormRow>

          <FormRow>
            <div>
              <Label htmlFor="business_city">
                City<span className="text-red-500 ml-1">*</span>
              </Label>
              <Select 
                value={watch("business_city") || ""}
                onValueChange={(value) => setValue("business_city", value)}
                disabled={disabled || !businessState}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={businessState ? "Select city" : "Select state first"} />
                </SelectTrigger>
                <SelectContent>
                  {businessCities.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.business_city && (
                <p className="text-red-500 text-sm mt-1">{errors.business_city.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="business_zipcode">Zip Code (Optional)</Label>
              <Input
                id="business_zipcode"
                type="text"
                {...register("business_zipcode")}
                className="mt-1"
                placeholder="Enter zip code"
                disabled={disabled}
              />
            </div>
          </FormRow>
        </div>
      </div>

      {/* Authorized Signatory Section */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Authorized Signatory</h3>
        
        <div className="space-y-4">
          <FormRow>
            <div>
              <Label htmlFor="authorized_signatory_name">
                Name of Authorized Signatory<span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="authorized_signatory_name"
                type="text"
                {...register("authorized_signatory_name")}
                className="mt-1"
                placeholder="Enter authorized signatory name"
                disabled={disabled}
              />
              {errors.authorized_signatory_name && (
                <p className="text-red-500 text-sm mt-1">{errors.authorized_signatory_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="authorized_signatory_email">
                Authorized Signatory Email<span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="authorized_signatory_email"
                type="email"
                {...register("authorized_signatory_email")}
                className="mt-1"
                placeholder="Enter authorized signatory email"
                disabled={disabled}
              />
              {errors.authorized_signatory_email && (
                <p className="text-red-500 text-sm mt-1">{errors.authorized_signatory_email.message}</p>
              )}
            </div>
          </FormRow>

          <PhoneInputField
            id="authorized_signatory_phone"
            label="Authorized Signatory Phone"
            value={watch("authorized_signatory_phone") || ''}
            onChange={(value) => setValue("authorized_signatory_phone", value, { shouldValidate: true })}
            error={errors.authorized_signatory_phone?.message}
            disabled={disabled}
            required
          />
        </div>
      </div>
    </div>
  );
}
