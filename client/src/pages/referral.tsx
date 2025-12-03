import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Mail, Share2, Users, Gift, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function Referral() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Generate a unique referral code (in real app, this would come from backend)
  const referralCode = "abc123";
  const referralLink = `mits.net/ref/${referralCode}`;

  // Dummy referral data
  const [referrals, setReferrals] = useState([
    {
      id: 1,
      email: "john.doe@example.com",
      status: "pending",
      reward: "10 GLD",
      date: "2024-01-15",
      kycCompleted: false,
      invested: false,
    },
    {
      id: 2,
      email: "jane.smith@example.com",
      status: "completed",
      reward: "10 GLD",
      date: "2024-01-10",
      kycCompleted: true,
      invested: true,
    },
    {
      id: 3,
      email: "mike.wilson@example.com",
      status: "kyc_completed",
      reward: "5 GLD",
      date: "2024-01-08",
      kycCompleted: true,
      invested: false,
    },
  ]);

  const totalReferrals = referrals.length;
  const completedReferrals = referrals.filter(
    (r) => r.status === "completed"
  ).length;
  const totalRewards = referrals
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + parseInt(r.reward.split(" ")[0]), 0);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: t("common.success"),
        description: t("toasts.referralLinkCopied"),
      });
    } catch (err) {
      toast({
        title: t("common.error"),
        description: t("toasts.failedToCopyLink"),
        variant: "destructive",
      });
    }
  };

  const shareViaEmail = async () => {
    if (!email) {
      toast({
        title: t("common.error"),
        description: t("toasts.enterEmailAddress"),
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: t("common.error"),
        description: t("toasts.enterValidEmail"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      toast({
        title: t("common.success"),
        description: `Referral link sent to ${email}!`,
      });
      setEmail("");
      setIsLoading(false);
    }, 1000);
  };

  const shareOnSocial = (platform: "twitter" | "linkedin" | "telegram") => {
    const shareText = `Join Vaulted Assets and earn rewards! Use my referral link: ${referralLink}`;
    const shareUrl = encodeURIComponent(shareText);

    let url = "";
    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${shareUrl}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          window.location.origin
        )}&title=${encodeURIComponent(
          "Vaulted Assets Referral"
        )}&summary=${shareUrl}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(
          window.location.origin
        )}&text=${shareUrl}`;
        break;
    }

    window.open(url, "_blank");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
            Completed
          </Badge>
        );
      case "kyc_completed":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
            KYC Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
            Pending
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Referrals
                  </p>
                  <p className="text-2xl font-bold">{totalReferrals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Completed
                  </p>
                  <p className="text-2xl font-bold">{completedReferrals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <Gift className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Rewards
                  </p>
                  <p className="text-2xl font-bold">{totalRewards} GLD</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Your Referral Link
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Referral Link Display */}
              <div>
                <Label htmlFor="referral-link">Referral Link</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="referral-link"
                    value={referralLink}
                    readOnly
                    className="flex-1 font-mono text-sm"
                  />
                  <Button onClick={copyToClipboard} variant="outline">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </div>

              {/* Email Share */}
              <div>
                <Label htmlFor="email">Share via Email</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1"
                  />
                  <Button
                    onClick={shareViaEmail}
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {isLoading ? "Sending..." : "Send"}
                  </Button>
                </div>
              </div>

              {/* Social Share Buttons */}
              <div>
                <Label>Share on Social Media</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={() => shareOnSocial("twitter")}
                    variant="outline"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                    Twitter
                  </Button>
                  <Button
                    onClick={() => shareOnSocial("linkedin")}
                    variant="outline"
                    size="sm"
                    className="text-blue-700 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </Button>
                  <Button
                    onClick={() => shareOnSocial("telegram")}
                    variant="outline"
                    size="sm"
                    className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                    Telegram
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Status Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Referral Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Reward
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral) => (
                    <tr
                      key={referral.id}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium">
                          {referral.email}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(referral.status)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                          {referral.reward}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {referral.date}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                referral.kycCompleted
                                  ? "bg-green-500"
                                  : "bg-gray-300 dark:bg-gray-600"
                              }`}
                              title="KYC Completed"
                            ></div>
                            <div
                              className={`w-2 h-2 rounded-full ${
                                referral.invested
                                  ? "bg-green-500"
                                  : "bg-gray-300 dark:bg-gray-600"
                              }`}
                              title="Investment Made"
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {referral.kycCompleted
                              ? referral.invested
                                ? "Complete"
                                : "KYC Done"
                              : "Pending"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>How the Referral Program Works</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    1
                  </span>
                </div>
                <h3 className="font-semibold mb-2">Share Your Link</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Share your unique referral link with friends and family
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    2
                  </span>
                </div>
                <h3 className="font-semibold mb-2">They Complete KYC</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  When they complete KYC, you earn 5 GLD tokens
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                    3
                  </span>
                </div>
                <h3 className="font-semibold mb-2">They Invest</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  When they make their first investment, you earn an additional
                  5 GLD
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
