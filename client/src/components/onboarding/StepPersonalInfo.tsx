import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Country, State, City } from 'country-state-city';
import { OnboardingData } from "@shared/schema";
import { PhoneInputField } from "./PhoneInputField";
import { FormRow } from "./FormRow";
import { useEffect, useMemo } from "react";

interface StepPersonalInfoProps {
  disabled?: boolean;
}

export function StepPersonalInfo({ disabled = false }: StepPersonalInfoProps) {
  const { register, formState: { errors }, setValue, watch } = useFormContext<OnboardingData>();
  const accountType = watch("account_type");
  const phoneNumber = watch("phone_number");
  const country = watch("country");
  const state = watch("state");
  
  const countries = Country.getAllCountries();
  
  const selectedCountry = useMemo(() => 
    countries.find(c => c.name === country), [country, countries]
  );
  
  const states = useMemo(() => 
    selectedCountry ? State.getStatesOfCountry(selectedCountry.isoCode) : [], 
    [selectedCountry]
  );
  
  const selectedState = useMemo(() => 
    states.find(s => s.name === state), [state, states]
  );
  
  const cities = useMemo(() => 
    selectedState ? City.getCitiesOfState(selectedCountry?.isoCode || '', selectedState.isoCode) : [], 
    [selectedState, selectedCountry]
  );

  useEffect(() => {
    if (country && !selectedCountry) {
      setValue("state", "");
      setValue("city", "");
    }
  }, [country, selectedCountry, setValue]);

  useEffect(() => {
    if (state && !selectedState) {
      setValue("city", "");
    }
  }, [state, selectedState, setValue]);

  return (
    <div className="space-y-6">
      {/* Name Fields - Row 1: First Name + Middle Name */}
      <FormRow>
        <div>
          <Label htmlFor="first_name">
            First Name<span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="first_name"
            type="text"
            {...register("first_name")}
            className="mt-1"
            placeholder="Enter first name"
            disabled={disabled}
          />
          {errors.first_name && (
            <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="middle_name">Middle Name (Optional)</Label>
          <Input
            id="middle_name"
            type="text"
            {...register("middle_name")}
            className="mt-1"
            placeholder="Enter middle name"
            disabled={disabled}
          />
        </div>
      </FormRow>

      {/* Name Fields - Row 2: Last Name + Phone Number */}
      <FormRow>
        <div>
          <Label htmlFor="last_name">
            Last Name<span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="last_name"
            type="text"
            {...register("last_name")}
            className="mt-1"
            placeholder="Enter last name"
            disabled={disabled}
          />
          {errors.last_name && (
            <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>
          )}
        </div>

        <PhoneInputField
          id="phone_number"
          label="Phone Number"
          value={phoneNumber || ''}
          onChange={(value) => setValue("phone_number", value, { shouldValidate: true })}
          error={errors.phone_number?.message}
          disabled={disabled}
          required
        />
      </FormRow>

      {/* Address Fields */}
      <FormRow>
        <div>
          <Label htmlFor="address1">
            Address Line 1<span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="address1"
            type="text"
            {...register("address1")}
            className="mt-1"
            placeholder="Enter address line 1"
            disabled={disabled}
        />
        {errors.address1 && (
          <p className="text-red-500 text-sm mt-1">{errors.address1.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="address2">Address Line 2 (Optional)</Label>
        <Input
          id="address2"
          type="text"
          {...register("address2")}
          className="mt-1"
          placeholder="Enter address line 2"
            disabled={disabled}
        />
      </div>
      </FormRow>

      <FormRow>
        <div>
          <Label htmlFor="country">
            Country<span className="text-red-500 ml-1">*</span>
          </Label>
          <Select 
            value={country || ""}
            onValueChange={(value) => {
              setValue("country", value);
              setValue("state", "");
              setValue("city", "");
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
          {errors.country && (
            <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="state">
            State/Province<span className="text-red-500 ml-1">*</span>
          </Label>
          <Select 
            value={state || ""}
            onValueChange={(value) => {
              setValue("state", value);
              setValue("city", "");
            }}
            disabled={disabled || !country}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={country ? "Select state" : "Select country first"} />
            </SelectTrigger>
            <SelectContent>
              {states.map((s) => (
                <SelectItem key={s.isoCode} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && (
            <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
          )}
        </div>
      </FormRow>

      <FormRow>
        <div>
          <Label htmlFor="city">
            City<span className="text-red-500 ml-1">*</span>
          </Label>
          <Select 
            value={watch("city") || ""}
            onValueChange={(value) => setValue("city", value)}
            disabled={disabled || !state}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={state ? "Select city" : "Select state first"} />
            </SelectTrigger>
            <SelectContent>
              {cities.map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.city && (
            <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="zipcode">Zip Code (Optional)</Label>
          <Input
            id="zipcode"
            type="text"
            {...register("zipcode")}
            className="mt-1"
            placeholder="Enter zip code"
            disabled={disabled}
          />
        </div>
      </FormRow>

      {/* Additional fields for individual accounts */}
      {accountType === "individual" && (
        <FormRow>
          <div>
            <Label htmlFor="dob">
              Date of Birth<span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="dob"
              type="date"
              {...register("dob")}
              className="mt-1"
              disabled={disabled}
            />
            {errors.dob && (
              <p className="text-red-500 text-sm mt-1">{errors.dob.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="profession">Profession (Optional)</Label>
            <Select 
              value={watch("profession") || ""}
              onValueChange={(value) => setValue("profession", value)}
              disabled={disabled}
            >
              <SelectTrigger className="mt-1" id="profession">
                <SelectValue placeholder="Select profession" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Salaried">Salaried</SelectItem>
                <SelectItem value="Self-employed">Self-employed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </FormRow>
      )}
    </div>
  );
}
