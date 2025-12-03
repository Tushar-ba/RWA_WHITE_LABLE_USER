import { Link, useLocation } from "wouter";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Wallet, User, Menu, X } from "lucide-react";

import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { useAuthStore } from "@/stores/authStore";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useIsMobile } from "@/hooks/use-mobile";
import lightLogoPath from "@assets/WNVaultedAssets_1753707707419.png";
import darkLogoPath from "@assets/VaultedAssets (1)_1753709040936.png";
import { useState } from "react";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

interface NavbarProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

export function Navbar({ isAuthenticated = false, onLogout }: NavbarProps) {
  const [location] = useLocation();
  const { theme } = useTheme();
  const { t } = useTranslation("common");
  const { logout } = useAuthStore();
  const logoPath = theme === "dark" ? darkLogoPath : lightLogoPath;
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Wallet connection using AppKit
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  // Auto-add wallet when connected
  const { isAddingWallet } = useWalletConnection();

  const handleConnectWallet = () => {
    open();
  };

  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = "/";
    }
    closeMobileMenu();
  };

  return (
    <nav className="bg-white dark:bg-black shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" onClick={closeMobileMenu}>
            <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer">
              <img
                src={logoPath}
                alt="Vaulted Assets Logo"
                className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
              />
              <span className="text-lg sm:text-xl font-bold text-brand-dark-gold dark:text-brand-gold">
                Vaulted Assets
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Home - Always visible */}
            <Link href="/">
              <span
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === "/"
                    ? "text-primary"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                {t("navigation.home")}
              </span>
            </Link>

            {/* Authenticated Navigation */}
            {isAuthenticated && (
              <>
                <Link href="/assets">
                  <span
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      location === "/assets"
                        ? "text-primary"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {t("navigation.assets")}
                  </span>
                </Link>
                <Link href="/portfolio">
                  <span
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      location === "/portfolio"
                        ? "text-primary"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {t("navigation.portfolio")}
                  </span>
                </Link>
                {/* Gifting - Separate navigation item */}
                <Link href="/gifting">
                  <span
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      location === "/gifting"
                        ? "text-primary"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {t("navigation.sendGift")}
                  </span>
                </Link>

                {/* Redemption - Separate navigation item */}
                <Link href="/redemption">
                  <span
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      location === "/redemption"
                        ? "text-primary"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {t("navigation.redemption")}
                  </span>
                </Link>
                <Link href="/transaction-history">
                  <span
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      location === "/transaction-history"
                        ? "text-primary"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    Transaction History
                  </span>
                </Link>
              </>
            )}

            {/* About Dropdown - Always visible */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`text-sm font-medium transition-colors hover:text-primary px-1 h-auto ${
                    ["/about", "/whitepaper", "/tokenomics"].includes(location)
                      ? "text-primary"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {t("navigation.about")}{" "}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link href="/about" className="cursor-pointer">
                    {t("navigation.about")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/whitepaper" className="cursor-pointer">
                    {t("navigation.whitepaper")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/tokenomics" className="cursor-pointer">
                    {t("navigation.tokenomics")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/audit-report" className="cursor-pointer">
                    {t("navigation.auditReport")}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Contact - Always visible */}
            <Link href="/contact">
              <span
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === "/contact"
                    ? "text-primary"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                {t("navigation.contact")}
              </span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="ml-2"
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>

          {/* Desktop - Language, Theme & Auth Buttons */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            <div className="hidden lg:flex items-center space-x-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>

            {isAuthenticated ? (
              <div className="flex items-center space-x-1">
                <Button
                  onClick={handleConnectWallet}
                  variant={isConnected ? "default" : "outline"}
                  size="sm"
                  disabled={isAddingWallet}
                  className={`flex items-center space-x-1 lg:space-x-1 text-xs lg:text-sm ${
                    isConnected
                      ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30"
                      : ""
                  }`}
                  data-testid="button-connect-wallet"
                >
                  <Wallet className="h-3 w-3 lg:h-4 lg:w-4" />
                  <span className="hidden lg:inline">
                    {isAddingWallet
                      ? t("navigation.addingWallet")
                      : isConnected && address
                        ? formatAddress(address)
                        : t("navigation.connectWallet")}
                  </span>
                  <span className="lg:hidden">
                    {isAddingWallet
                      ? t("navigation.adding")
                      : isConnected
                        ? t("navigation.connected")
                        : t("navigation.connect")}
                  </span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-1">
                      <User className="h-5 w-5" />
                      <span className="sr-only">Profile</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <User className="h-4 w-4" />
                        {t("navigation.profile")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleLogoutClick}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span>{t("navigation.signOut")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Link href="/signin">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary/80 text-xs lg:text-sm px-2 lg:px-4"
                    data-testid="button-sign-in"
                  >
                    {t("navigation.signIn")}
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white text-xs lg:text-sm px-2 lg:px-4"
                    data-testid="button-sign-up"
                  >
                    {t("navigation.signUp")}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700 shadow-lg z-40 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-4 py-4 space-y-4">
              {/* Mobile Theme and Language Controls */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <LanguageSwitcher />
                  <ThemeToggle />
                </div>
              </div>

              {/* Mobile Navigation Links */}
              <div className="space-y-3">
                {/* Home - Always visible */}
                <Link href="/" onClick={closeMobileMenu}>
                  <div
                    className={`block py-2 px-3 text-sm font-medium transition-colors hover:text-primary ${
                      location === "/"
                        ? "text-primary bg-primary/10 rounded-md"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                    data-testid="mobile-link-home"
                  >
                    {t("navigation.home")}
                  </div>
                </Link>

                {/* Authenticated Navigation */}
                {isAuthenticated && (
                  <>
                    <Link href="/assets" onClick={closeMobileMenu}>
                      <div
                        className={`block py-2 px-3 text-sm font-medium transition-colors hover:text-primary ${
                          location === "/assets"
                            ? "text-primary bg-primary/10 rounded-md"
                            : "text-gray-600 dark:text-gray-300"
                        }`}
                        data-testid="mobile-link-assets"
                      >
                        {t("navigation.assets")}
                      </div>
                    </Link>
                    <Link href="/portfolio" onClick={closeMobileMenu}>
                      <div
                        className={`block py-2 px-3 text-sm font-medium transition-colors hover:text-primary ${
                          location === "/portfolio"
                            ? "text-primary bg-primary/10 rounded-md"
                            : "text-gray-600 dark:text-gray-300"
                        }`}
                        data-testid="mobile-link-portfolio"
                      >
                        {t("navigation.portfolio")}
                      </div>
                    </Link>
                    <Link href="/gifting" onClick={closeMobileMenu}>
                      <div
                        className={`block py-2 px-3 text-sm font-medium transition-colors hover:text-primary ${
                          location === "/gifting"
                            ? "text-primary bg-primary/10 rounded-md"
                            : "text-gray-600 dark:text-gray-300"
                        }`}
                        data-testid="mobile-link-gifting"
                      >
                        {t("navigation.sendGift")}
                      </div>
                    </Link>
                    <Link href="/redemption" onClick={closeMobileMenu}>
                      <div
                        className={`block py-2 px-3 text-sm font-medium transition-colors hover:text-primary ${
                          location === "/redemption"
                            ? "text-primary bg-primary/10 rounded-md"
                            : "text-gray-600 dark:text-gray-300"
                        }`}
                        data-testid="mobile-link-redemption"
                      >
                        {t("navigation.redemption")}
                      </div>
                    </Link>
                  </>
                )}

                {/* About Section - Mobile */}
                <div className="space-y-2">
                  <div className="py-2 px-3 text-sm font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
                    {t("navigation.about")}
                  </div>
                  <Link href="/about" onClick={closeMobileMenu}>
                    <div
                      className={`block py-2 px-6 text-sm transition-colors hover:text-primary ${
                        location === "/about"
                          ? "text-primary bg-primary/10 rounded-md"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                      data-testid="mobile-link-about"
                    >
                      {t("navigation.about")}
                    </div>
                  </Link>
                  <Link href="/whitepaper" onClick={closeMobileMenu}>
                    <div
                      className={`block py-2 px-6 text-sm transition-colors hover:text-primary ${
                        location === "/whitepaper"
                          ? "text-primary bg-primary/10 rounded-md"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                      data-testid="mobile-link-whitepaper"
                    >
                      {t("navigation.whitepaper")}
                    </div>
                  </Link>
                  <Link href="/tokenomics" onClick={closeMobileMenu}>
                    <div
                      className={`block py-2 px-6 text-sm transition-colors hover:text-primary ${
                        location === "/tokenomics"
                          ? "text-primary bg-primary/10 rounded-md"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                      data-testid="mobile-link-tokenomics"
                    >
                      {t("navigation.tokenomics")}
                    </div>
                  </Link>
                  <Link href="/audit-report" onClick={closeMobileMenu}>
                    <div
                      className={`block py-2 px-6 text-sm transition-colors hover:text-primary ${
                        location === "/audit-report"
                          ? "text-primary bg-primary/10 rounded-md"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                      data-testid="mobile-link-audit-report"
                    >
                      {t("navigation.auditReport")}
                    </div>
                  </Link>
                </div>

                {/* Contact */}
                <Link href="/contact" onClick={closeMobileMenu}>
                  <div
                    className={`block py-2 px-3 text-sm font-medium transition-colors hover:text-primary ${
                      location === "/contact"
                        ? "text-primary bg-primary/10 rounded-md"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                    data-testid="mobile-link-contact"
                  >
                    {t("navigation.contact")}
                  </div>
                </Link>
              </div>

              {/* Mobile Auth Buttons */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                {isAuthenticated ? (
                  <>
                    <Button
                      onClick={() => {
                        handleConnectWallet();
                        closeMobileMenu();
                      }}
                      variant={isConnected ? "default" : "outline"}
                      className={`w-full flex items-center justify-center space-x-2 ${
                        isConnected
                          ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30"
                          : ""
                      }`}
                      disabled={isAddingWallet}
                      data-testid="mobile-button-connect-wallet"
                    >
                      <Wallet className="h-4 w-4" />
                      <span>
                        {isAddingWallet
                          ? t("navigation.addingWallet")
                          : isConnected && address
                            ? formatAddress(address)
                            : t("navigation.connectWallet")}
                      </span>
                    </Button>
                    <div className="flex items-center justify-between">
                      <Link href="/profile" onClick={closeMobileMenu}>
                        <Button
                          variant="outline"
                          className="flex items-center space-x-2"
                          data-testid="mobile-button-profile"
                        >
                          <User className="h-4 w-4" />
                          <span>{t("navigation.profile")}</span>
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        onClick={handleLogoutClick}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        data-testid="mobile-button-sign-out"
                      >
                        {t("navigation.signOut")}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <Link href="/signin" onClick={closeMobileMenu}>
                      <Button
                        variant="outline"
                        className="w-full text-primary hover:text-primary/80"
                        data-testid="mobile-button-sign-in"
                      >
                        {t("navigation.signIn")}
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={closeMobileMenu}>
                      <Button
                        className="w-full bg-primary hover:bg-primary/90 text-white"
                        data-testid="mobile-button-sign-up"
                      >
                        {t("navigation.signUp")}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        title={t("navigation.confirmLogout") || "Confirm Logout"}
        description={t("navigation.logoutConfirmMessage") || "Are you sure you want to sign out? You will need to sign in again to access your account."}
        confirmText={t("navigation.signOut")}
        cancelText={t("navigation.cancel") || "Cancel"}
        variant="destructive"
      />
    </nav>
  );
}
