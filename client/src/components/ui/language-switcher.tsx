import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "zh", name: "Simplified Chinese (简体中文)", flag: "🇨🇳" },
  { code: "zh-tw", name: "Traditional Chinese (繁體中文)", flag: "🇹🇼" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(
    languages.find((lang) => lang.code === i18n.language) || languages[0],
  );

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setCurrentLanguage(
      languages.find((lang) => lang.code === langCode) || languages[0],
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          {/* <Globe className="h-4 w-4" /> */}
          <span className="hidden sm:inline text-sm font-medium">
            {currentLanguage.flag}{" "}
            {currentLanguage.code === "en"
              ? "English"
              : currentLanguage.code === "zh"
                ? "简体中文"
                : currentLanguage.code === "zh-tw"
                  ? "繁體中文"
                  : currentLanguage.code === "fr"
                    ? "Français"
                    : currentLanguage.code === "es"
                      ? "Español"
                      : "English"}
          </span>
          <span className="sm:hidden text-sm">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={`flex items-center space-x-2 cursor-pointer ${
              currentLanguage.code === language.code
                ? "bg-brand-gold/10 dark:bg-brand-gold/5"
                : ""
            }`}
          >
            <span className="text-lg">{language.flag}</span>
            <span className="font-medium">{language.name}</span>
            {currentLanguage.code === language.code && (
              <span className="ml-auto text-brand-dark-gold dark:text-brand-gold text-xs">
                ✓
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
