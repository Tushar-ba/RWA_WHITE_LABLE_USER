import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Wallet,
  User,
  Mail,
  MapPin,
  Building,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";
import { type User as UserType, type UpdateUserProfile, type AccountStatus } from "../../../shared/schema";

interface UserProfile {
  user_id: string;
  email: string;
  account_type?: 'individual' | 'institutional';
  // Individual account fields
  first_name?: string;
  last_name?: string;
  dob?: string;
  // Institutional account fields
  company_name?: string;
  company_website?: string;
  company_phone?: string;
  authorized_signatory_name?: string;
  authorized_signatory_email?: string;
  authorized_signatory_phone?: string;
  // Common fields
  phone_number?: string;
  organization_name?: string;
  address1?: string;
  address2?: string;
  city?: string;
  country: string;
  state?: string;
  zipcode?: string;
  profession?: string;
  account_status: AccountStatus;
  email_verified: boolean;
  referral_code?: string;
  terms_accepted: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

interface ApiResponse {
  message: string;
  user: UserProfile;
  wallets?: Array<{
    _id: string;
    userId: string;
    address: string;
    type: string;
    label?: string;
    createdAt: Date;
  }>;
}

export default function Profile() {
  const { t, i18n } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    // Individual fields
    first_name: "",
    last_name: "",
    dob: "",
    // Institutional fields
    company_name: "",
    company_website: "",
    company_phone: "",
    authorized_signatory_name: "",
    authorized_signatory_email: "",
    authorized_signatory_phone: "",
    // Common fields
    phone_number: "",
    organization_name: "",
    address1: "",
    address2: "",
    city: "",
    country: "",
    state: "",
    zipcode: "",
    profession: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Password update state
  const [isPasswordEditing, setIsPasswordEditing] = useState(false);
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  // Fetch user profile data
  const { data: profileResponse, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ["/api/users/me"],
    queryFn: async () => {
      const response = await fetch("/api/users/me", {
        credentials: "include",
        headers: {
          "Authorization": `Bearer ${JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token || ''}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
    enabled: true,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updateData: UpdateUserProfile) => {
      // Get current language from i18n and map to backend language codes
      const currentLang = i18n.language || 'en';
      
      // Map frontend language codes to backend language codes
      let langParam = 'us'; // default
      switch (currentLang) {
        case 'en':
          langParam = 'us';
          break;
        case 'zh':
        case 'zh-CN':
        case 'zh-cn':
          langParam = 'zh';
          break;
        case 'zh-TW':
        case 'zh-tw':
        case 'tw':
          langParam = 'zh-tw';
          break;
        case 'fr':
          langParam = 'fr';
          break;
        case 'es':
          langParam = 'es';
          break;
        default:
          langParam = 'us';
      }
      
      const response = await apiRequest("POST", `/api/users/me?lang=${langParam}`, updateData);
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      toast({
        title: t("common.success"),
        description: data.message || t("profile.updateProfileSuccess"), // Use server message or fallback
      });
      setIsEditing(false);
      setErrors({});
    },
    onError: (error: any) => {
      console.error("Update profile error:", error);
      const errorMessage = error.response?.data?.message || t("profile.updateProfileError");
      toast({
        title: t("common.error"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (passwordUpdateData: { old_password: string; new_password: string }) => {
      const response = await apiRequest("POST", "/api/users/me/password", passwordUpdateData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("profile.passwordUpdateSuccess"),
      });
      setIsPasswordEditing(false);
      setPasswordData({ old_password: "", new_password: "", confirm_password: "" });
      setPasswordErrors({});
      setShowPasswords({ old: false, new: false, confirm: false });
    },
    onError: (error: any) => {
      console.error("Update password error:", error);
      const errorMessage = error.response?.data?.message || t("profile.passwordUpdateError");
      toast({
        title: t("common.error"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const profile = profileResponse?.user;
  const wallets = profileResponse?.wallets;

  // Initialize form data when profile loads
  React.useEffect(() => {
    if (profile && !isEditing) {
      setFormData({
        // Individual fields
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        dob: profile.dob || "",
        // Institutional fields
        company_name: profile.company_name || "",
        company_website: profile.company_website || "",
        company_phone: profile.company_phone || "",
        authorized_signatory_name: profile.authorized_signatory_name || "",
        authorized_signatory_email: profile.authorized_signatory_email || "",
        authorized_signatory_phone: profile.authorized_signatory_phone || "",
        // Common fields
        phone_number: profile.phone_number || "",
        organization_name: profile.organization_name || "",
        address1: profile.address1 || "",
        address2: profile.address2 || "",
        city: profile.city || "",
        country: profile.country || "",
        state: profile.state || "",
        zipcode: profile.zipcode || "",
        profession: profile.profession || "",
      });
    }
  }, [profile, isEditing]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const isIndividual = profile?.account_type === "individual";

    if (isIndividual) {
      if (!formData.first_name.trim()) {
        newErrors.first_name = t("profile.firstNameRequired");
      }

      if (!formData.last_name.trim()) {
        newErrors.last_name = t("profile.lastNameRequired");
      }
    } else {
      // Institutional validation
      if (!formData.company_name.trim()) {
        newErrors.company_name = t("profile.companyNameRequired");
      }

      if (!formData.company_phone.trim()) {
        newErrors.company_phone = t("profile.companyPhoneRequired");
      }

      if (!formData.authorized_signatory_name.trim()) {
        newErrors.authorized_signatory_name = t("profile.authorizedSignatoryNameRequired");
      }

      if (!formData.authorized_signatory_email.trim()) {
        newErrors.authorized_signatory_email = t("profile.authorizedSignatoryEmailRequired");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.authorized_signatory_email)) {
        newErrors.authorized_signatory_email = t("profile.invalidEmail");
      }

      if (!formData.authorized_signatory_phone.trim()) {
        newErrors.authorized_signatory_phone = t("profile.authorizedSignatoryPhoneRequired");
      }

      // Validate company website if provided
      if (formData.company_website.trim() && !/^https?:\/\/.+/.test(formData.company_website.trim())) {
        newErrors.company_website = t("profile.invalidWebsiteUrl");
      }
    }

    // Common validations
    if (!formData.country.trim()) {
      newErrors.country = t("profile.countryRequired");
    }

    if (!formData.address1.trim()) {
      newErrors.address1 = t("profile.address1Required");
    }

    if (!formData.city.trim()) {
      newErrors.city = t("profile.cityRequired");
    }

    if (!formData.zipcode.trim()) {
      newErrors.zipcode = t("profile.zipcodeRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    // Build update data with all fields based on account type
    const updateData: UpdateUserProfile = {};
    const isIndividual = profile?.account_type === "individual";

    if (isIndividual) {
      // Individual account required fields
      updateData.first_name = formData.first_name.trim();
      updateData.last_name = formData.last_name.trim();
      // Optional individual fields
      if (formData.dob.trim()) updateData.dob = formData.dob.trim();
    } else {
      // Institutional account required fields
      updateData.company_name = formData.company_name.trim();
      updateData.company_phone = formData.company_phone.trim();
      updateData.authorized_signatory_name = formData.authorized_signatory_name.trim();
      updateData.authorized_signatory_email = formData.authorized_signatory_email.trim();
      updateData.authorized_signatory_phone = formData.authorized_signatory_phone.trim();
      // Optional institutional fields
      if (formData.company_website.trim()) updateData.company_website = formData.company_website.trim();
    }

    // Common required fields (always include)
    updateData.address1 = formData.address1.trim();
    updateData.city = formData.city.trim();
    updateData.country = formData.country.trim();
    updateData.zipcode = formData.zipcode.trim();

    // Common optional fields
    if (formData.phone_number?.trim()) updateData.phone_number = formData.phone_number.trim();
    if (formData.organization_name?.trim()) updateData.organization_name = formData.organization_name.trim();
    if (formData.address2.trim()) updateData.address2 = formData.address2.trim();
    if (formData.state.trim()) updateData.state = formData.state.trim();
    if (formData.profession.trim()) updateData.profession = formData.profession.trim();

    updateProfileMutation.mutate(updateData);
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        // Individual fields
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        dob: profile.dob || "",
        // Institutional fields
        company_name: profile.company_name || "",
        company_website: profile.company_website || "",
        company_phone: profile.company_phone || "",
        authorized_signatory_name: profile.authorized_signatory_name || "",
        authorized_signatory_email: profile.authorized_signatory_email || "",
        authorized_signatory_phone: profile.authorized_signatory_phone || "",
        // Common fields
        phone_number: profile.phone_number || "",
        organization_name: profile.organization_name || "",
        address1: profile.address1 || "",
        address2: profile.address2 || "",
        city: profile.city || "",
        country: profile.country || "",
        state: profile.state || "",
        zipcode: profile.zipcode || "",
        profession: profile.profession || "",
      });
    }
    setIsEditing(false);
    setErrors({});
  };

  const handlePasswordInputChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (passwordErrors[field]) {
      setPasswordErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.old_password.trim()) {
      newErrors.old_password = t("profile.currentPasswordRequired");
    }

    if (!passwordData.new_password.trim()) {
      newErrors.new_password = t("profile.newPasswordRequired");
    } else if (passwordData.new_password.length < 8) {
      newErrors.new_password = t("profile.passwordTooShort");
    }

    if (!passwordData.confirm_password.trim()) {
      newErrors.confirm_password = t("profile.confirmPasswordRequired");
    } else if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = t("profile.passwordsDoNotMatch");
    }

    if (passwordData.old_password === passwordData.new_password && passwordData.old_password.trim()) {
      newErrors.new_password = t("profile.newPasswordSameAsOld");
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSave = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    updatePasswordMutation.mutate({
      old_password: passwordData.old_password,
      new_password: passwordData.new_password,
    });
  };

  const handlePasswordCancel = () => {
    setPasswordData({ old_password: "", new_password: "", confirm_password: "" });
    setIsPasswordEditing(false);
    setPasswordErrors({});
    setShowPasswords({ old: false, new: false, confirm: false });
  };

  const getAccountStatusIcon = () => {
    if (!profile) return <Clock className="h-4 w-4 text-yellow-500" />;
    
    switch (profile.account_status) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "unverified":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "suspended":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getAccountStatusBadge = () => {
    if (!profile) return <Badge variant="secondary">{t("profile.loading")}</Badge>;
    
    switch (profile.account_status) {
      case "verified":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
            data-testid="badge-account-verified"
          >
            {t("profile.verified")}
          </Badge>
        );
      case "unverified":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
            data-testid="badge-account-pending"
          >
            {t("profile.pendingVerification")}
          </Badge>
        );
      case "suspended":
        return <Badge variant="destructive" data-testid="badge-account-suspended">{t("profile.suspended")}</Badge>;
      default:
        return <Badge variant="secondary" data-testid="badge-account-unknown">{t("profile.unknown")}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t("profile.title")}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          {t("profile.subtitle")}
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {/* Personal Information Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t("profile.personalInformation")}
                </CardTitle>
                <CardDescription>
                  {t("profile.personalInformationDescription")}
                </CardDescription>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full sm:w-auto">
                  {t("profile.editProfile")}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Individual Account Fields */}
              {profile?.account_type === "individual" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t("profile.firstName")} *</Label>
                    <Input
                      id="firstName"
                      data-testid="input-first-name"
                      value={formData.first_name}
                      onChange={(e) =>
                        handleInputChange("first_name", e.target.value)
                      }
                      disabled={!isEditing}
                      className={errors.first_name ? "border-red-500" : ""}
                    />
                    {errors.first_name && (
                      <p className="text-sm text-red-500">{errors.first_name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t("profile.lastName")} *</Label>
                    <Input
                      id="lastName"
                      data-testid="input-last-name"
                      value={formData.last_name}
                      onChange={(e) =>
                        handleInputChange("last_name", e.target.value)
                      }
                      disabled={!isEditing}
                      className={errors.last_name ? "border-red-500" : ""}
                    />
                    {errors.last_name && (
                      <p className="text-sm text-red-500">{errors.last_name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      data-testid="input-dob"
                      value={formData.dob}
                      onChange={(e) =>
                        handleInputChange("dob", e.target.value)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                </>
              )}

              {/* Institutional Account Fields */}
              {profile?.account_type === "institutional" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      data-testid="input-company-name"
                      value={formData.company_name}
                      onChange={(e) =>
                        handleInputChange("company_name", e.target.value)
                      }
                      disabled={!isEditing}
                      className={errors.company_name ? "border-red-500" : ""}
                    />
                    {errors.company_name && (
                      <p className="text-sm text-red-500">{errors.company_name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyWebsite">Company Website</Label>
                    <Input
                      id="companyWebsite"
                      type="url"
                      data-testid="input-company-website"
                      value={formData.company_website}
                      onChange={(e) =>
                        handleInputChange("company_website", e.target.value)
                      }
                      disabled={!isEditing}
                      placeholder="https://example.com"
                      className={errors.company_website ? "border-red-500" : ""}
                    />
                    {errors.company_website && (
                      <p className="text-sm text-red-500">{errors.company_website}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Company Phone *</Label>
                    <Input
                      id="companyPhone"
                      type="tel"
                      data-testid="input-company-phone"
                      value={formData.company_phone}
                      onChange={(e) =>
                        handleInputChange("company_phone", e.target.value)
                      }
                      disabled={!isEditing}
                      className={errors.company_phone ? "border-red-500" : ""}
                    />
                    {errors.company_phone && (
                      <p className="text-sm text-red-500">{errors.company_phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="authorizedSignatoryName">Authorized Signatory Name *</Label>
                    <Input
                      id="authorizedSignatoryName"
                      data-testid="input-authorized-signatory-name"
                      value={formData.authorized_signatory_name}
                      onChange={(e) =>
                        handleInputChange("authorized_signatory_name", e.target.value)
                      }
                      disabled={!isEditing}
                      className={errors.authorized_signatory_name ? "border-red-500" : ""}
                    />
                    {errors.authorized_signatory_name && (
                      <p className="text-sm text-red-500">{errors.authorized_signatory_name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="authorizedSignatoryEmail">Authorized Signatory Email *</Label>
                    <Input
                      id="authorizedSignatoryEmail"
                      type="email"
                      data-testid="input-authorized-signatory-email"
                      value={formData.authorized_signatory_email}
                      onChange={(e) =>
                        handleInputChange("authorized_signatory_email", e.target.value)
                      }
                      disabled={!isEditing}
                      className={errors.authorized_signatory_email ? "border-red-500" : ""}
                    />
                    {errors.authorized_signatory_email && (
                      <p className="text-sm text-red-500">{errors.authorized_signatory_email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="authorizedSignatoryPhone">Authorized Signatory Phone *</Label>
                    <Input
                      id="authorizedSignatoryPhone"
                      type="tel"
                      data-testid="input-authorized-signatory-phone"
                      value={formData.authorized_signatory_phone}
                      onChange={(e) =>
                        handleInputChange("authorized_signatory_phone", e.target.value)
                      }
                      disabled={!isEditing}
                      className={errors.authorized_signatory_phone ? "border-red-500" : ""}
                    />
                    {errors.authorized_signatory_phone && (
                      <p className="text-sm text-red-500">{errors.authorized_signatory_phone}</p>
                    )}
                  </div>
                </>
              )}

              {/* Common Fields */}
              <div className="space-y-2">
                <Label htmlFor="email">{t("profile.email")}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="email"
                    data-testid="input-email"
                    value={profile?.email || ""}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500">{t("profile.emailCannotChange")}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("profile.phoneNumber")}</Label>
                <Input
                  id="phone"
                  data-testid="input-phone"
                  value={formData.phone_number}
                  onChange={(e) =>
                    handleInputChange("phone_number", e.target.value)
                  }
                  disabled={!isEditing}
                  placeholder={t("profile.phoneOptional")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address1">Address Line 1 *</Label>
                <Input
                  id="address1"
                  data-testid="input-address1"
                  value={formData.address1}
                  onChange={(e) => handleInputChange("address1", e.target.value)}
                  disabled={!isEditing}
                  className={errors.address1 ? "border-red-500" : ""}
                />
                {errors.address1 && (
                  <p className="text-sm text-red-500">{errors.address1}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address2">Address Line 2</Label>
                <Input
                  id="address2"
                  data-testid="input-address2"
                  value={formData.address2}
                  onChange={(e) => handleInputChange("address2", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  data-testid="input-city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  disabled={!isEditing}
                  className={errors.city ? "border-red-500" : ""}
                />
                {errors.city && (
                  <p className="text-sm text-red-500">{errors.city}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">{t("profile.country")} *</Label>
                <Input
                  id="country"
                  data-testid="input-country"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  disabled={!isEditing}
                  className={errors.country ? "border-red-500" : ""}
                />
                {errors.country && (
                  <p className="text-sm text-red-500">{errors.country}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">{t("profile.state")}</Label>
                <Input
                  id="state"
                  data-testid="input-state"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipcode">Zip Code *</Label>
                <Input
                  id="zipcode"
                  data-testid="input-zipcode"
                  value={formData.zipcode}
                  onChange={(e) => handleInputChange("zipcode", e.target.value)}
                  disabled={!isEditing}
                  className={errors.zipcode ? "border-red-500" : ""}
                />
                {errors.zipcode && (
                  <p className="text-sm text-red-500">{errors.zipcode}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profession">Profession</Label>
                <Input
                  id="profession"
                  data-testid="input-profession"
                  value={formData.profession}
                  onChange={(e) => handleInputChange("profession", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">{t("profile.organization")}</Label>
                <Input
                  id="organization"
                  data-testid="input-organization"
                  value={formData.organization_name}
                  onChange={(e) =>
                    handleInputChange("organization_name", e.target.value)
                  }
                  disabled={!isEditing}
                  placeholder={t("profile.organizationOptional")}
                />
              </div>
            </div>



            {isEditing && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  onClick={handleSave} 
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-save-profile"
                  className="w-full sm:w-auto"
                >
                  {updateProfileMutation.isPending ? t("profile.saving") : t("profile.saveChanges")}
                </Button>
                <Button 
                  onClick={handleCancel} 
                  variant="outline"
                  data-testid="button-cancel-edit"
                  className="w-full sm:w-auto"
                >
                  {t("profile.cancel")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Password Update Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  {t("profile.updatePassword")}
                </CardTitle>
                <CardDescription>
                  {t("profile.updatePasswordDescription")}
                </CardDescription>
              </div>
              {!isPasswordEditing && (
                <Button onClick={() => setIsPasswordEditing(true)} variant="outline" className="w-full sm:w-auto">
                  {t("profile.changePassword")}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isPasswordEditing ? (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">{t("profile.currentPassword")} *</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords.old ? "text" : "password"}
                        data-testid="input-current-password"
                        value={passwordData.old_password}
                        onChange={(e) => handlePasswordInputChange("old_password", e.target.value)}
                        className={passwordErrors.old_password ? "border-red-500" : ""}
                        placeholder={t("profile.currentPasswordPlaceholder")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, old: !prev.old }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        data-testid="button-toggle-current-password"
                      >
                        {showPasswords.old ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordErrors.old_password && (
                      <p className="text-sm text-red-500">{passwordErrors.old_password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t("profile.newPassword")} *</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        data-testid="input-new-password"
                        value={passwordData.new_password}
                        onChange={(e) => handlePasswordInputChange("new_password", e.target.value)}
                        className={passwordErrors.new_password ? "border-red-500" : ""}
                        placeholder={t("profile.newPasswordPlaceholder")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        data-testid="button-toggle-new-password"
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordErrors.new_password && (
                      <p className="text-sm text-red-500">{passwordErrors.new_password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t("profile.confirmPassword")} *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        data-testid="input-confirm-password"
                        value={passwordData.confirm_password}
                        onChange={(e) => handlePasswordInputChange("confirm_password", e.target.value)}
                        className={passwordErrors.confirm_password ? "border-red-500" : ""}
                        placeholder={t("profile.confirmPasswordPlaceholder")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        data-testid="button-toggle-confirm-password"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordErrors.confirm_password && (
                      <p className="text-sm text-red-500">{passwordErrors.confirm_password}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    onClick={handlePasswordSave} 
                    disabled={updatePasswordMutation.isPending}
                    data-testid="button-save-password"
                    className="w-full sm:w-auto"
                  >
                    {updatePasswordMutation.isPending ? t("profile.updating") : t("profile.updatePassword")}
                  </Button>
                  <Button 
                    onClick={handlePasswordCancel} 
                    variant="outline"
                    data-testid="button-cancel-password"
                    className="w-full sm:w-auto"
                  >
                    {t("profile.cancel")}
                  </Button>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t("profile.passwordSecurityNote")}
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("profile.passwordHidden")}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {t("profile.passwordLastUpdated")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {t("profile.accountStatus")}
            </CardTitle>
            <CardDescription>
              {t("profile.accountStatusDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Wallet Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold">{t("profile.connectedWallets")}</h3>
                </div>
                {wallets && wallets.length > 0 ? (
                  <div className="space-y-2">
                    {wallets.map((wallet, index) => (
                      <div key={wallet._id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {wallet.label ? `${wallet.label} ` : ''}{t("profile.wallet")} ({wallet.type})
                        </p>
                        <p className="font-mono text-xs sm:text-sm break-all" data-testid={`text-wallet-address-${index}`}>
                          {wallet.address}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("profile.noWalletsConnected")}
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  {t("profile.connectWalletToTrade")}
                </p>
              </div>

              {/* Account Status */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getAccountStatusIcon()}
                  <h3 className="font-semibold">{t("profile.accountStatus")}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {getAccountStatusBadge()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {profile?.account_status === "verified" && (
                    <p data-testid="text-account-verified">{t("profile.accountVerifiedMessage")}</p>
                  )}
                  {profile?.account_status === "unverified" && (
                    <p data-testid="text-account-pending">{t("profile.accountPendingMessage")}</p>
                  )}
                  {profile?.account_status === "suspended" && (
                    <p data-testid="text-account-suspended">
                      {t("profile.accountSuspendedMessage")}
                    </p>
                  )}
                </div>
                
                {profile?.email_verified ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400" data-testid="text-email-verified">
                      {t("profile.emailVerified")}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-yellow-600 dark:text-yellow-400" data-testid="text-email-pending">
                      {t("profile.emailNotVerified")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Information Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t("profile.securityInfo")}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
