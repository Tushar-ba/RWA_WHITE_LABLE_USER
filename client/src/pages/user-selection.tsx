import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import lightLogoPath from "@assets/WNVaultedAssets_1753707707419.png";
import darkLogoPath from "@assets/VaultedAssets (1)_1753709040936.png";

export default function UserSelection() {
  const { theme } = useTheme();
  const logoPath = theme === "dark" ? darkLogoPath : lightLogoPath;
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <img
              src={logoPath}
              alt="Vaulted Assets Logo"
              className="w-12 h-12 object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Join Vaulted Assets
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Start your investment journey with precious metals
          </p>
        </div>

        <Card className="cursor-pointer group hover:shadow-xl transition-all border-2 hover:border-primary/20">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Create Your Account
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Join our platform to invest in precious metals with secure,
              transparent, and accessible investment opportunities.
            </p>

            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300 mb-8">
              <li className="flex items-center">
                <svg
                  className="w-4 h-4 text-green-500 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                Minimum investment from $100
              </li>
              <li className="flex items-center">
                <svg
                  className="w-4 h-4 text-green-500 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                Simple KYC process
              </li>
              <li className="flex items-center">
                <svg
                  className="w-4 h-4 text-green-500 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                Mobile-first experience
              </li>
              <li className="flex items-center">
                <svg
                  className="w-4 h-4 text-green-500 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                24/7 customer support
              </li>
              <li className="flex items-center">
                <svg
                  className="w-4 h-4 text-green-500 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                Bulk purchase capabilities
              </li>
              <li className="flex items-center">
                <svg
                  className="w-4 h-4 text-green-500 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                Advanced reporting & analytics
              </li>
            </ul>

            <Link href="/signup">
              <Button className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors">
                Get Started
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Link href="/">
            <Button
              variant="ghost"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              ← Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
