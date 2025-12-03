import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


export default function Tokenomics() {


  return (
    <div className="min-h-screen bg-white dark:bg-black py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* <div className="mb-8">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="border-brand-dark-gold text-brand-dark-gold dark:text-brand-gold hover:bg-brand-gold/5"
          >
            ← Back
          </Button>
        </div> */}

        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Tokenomics
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Understanding the economic model behind Vaulted Assets' digital gold
            and silver tokens
          </p>
        </div>

        {/* Hero Image */}
        {/* <div className="mb-16 flex justify-center">
          <div className="relative w-full max-w-2xl h-80 rounded-2xl overflow-hidden">
            <img
              src={goldSilverImage}
              alt="Gold and Silver Bars"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          </div>
        </div> */}

        {/* Token Overview */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="border-brand-gold/20">
            <CardHeader>
              <CardTitle className="text-brand-dark-gold dark:text-brand-gold flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full mr-3 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Au</span>
                </div>
                VGOLD Token
              </CardTitle>
              <CardDescription>
                Each VGOLD token represents 1 gram of fine gold stored in
                insured, audited vaults. ERC-20 standard with 18 decimals supporting micro-gram ownership.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Backing Ratio:
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  1:1 Physical Gold
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Minimum Redemption:
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  10 VGOLD (10 grams)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Networks:
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  Ethereum & Solana
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-brand-gold/20">
            <CardHeader>
              <CardTitle className="text-brand-dark-gold dark:text-brand-gold flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-gray-300 to-gray-500 rounded-full mr-3 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Ag</span>
                </div>
                VSILVER Token
              </CardTitle>
              <CardDescription>
                Each VSILVER token represents 1 gram of fine silver stored in
                insured, audited vaults. ERC-20 standard with 18 decimals supporting micro-gram ownership.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Backing Ratio:
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  1:1 Physical Silver
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Minimum Redemption:
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  10 VSILVER (10 grams)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Networks:
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  Ethereum & Solana
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Supply Model */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                Supply Model
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-brand-dark-gold dark:text-brand-gold">
                  Dynamic
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  No fixed supply cap
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Tokens minted only when physical metals are purchased and vaulted
                </div>
              </div>
            </CardContent>
          </Card> */}

          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                Minting & Burning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-lg font-bold text-green-600">
                  Mint on Purchase
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  1:1 ratio with vaulted metals
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">
                  Burn on Redemption
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Tokens permanently removed
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                Reserve Backing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-green-600">100%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Fully collateralized
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Circulating supply = total vaulted reserves
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fee Structure */}
        {/* <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Fee Structure
            </CardTitle>
            <CardDescription>
              Transparent pricing for all platform operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-2xl font-bold text-brand-dark-gold dark:text-brand-gold mb-2">
                  0.2%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Protocol Fee (Transfers)
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Supports vault insurance
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-2xl font-bold text-brand-dark-gold dark:text-brand-gold mb-2">
                  1.0%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Redemption Fee
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Min. $50 (handling & shipping)
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  24/7
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  P2P Transfers Available
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Instant settlement
                </div>
              </div>
            </div>
          </CardContent>
        </Card> */}

      </div>
    </div>
  );
}
