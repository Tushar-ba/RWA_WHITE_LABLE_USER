import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import lightLogoPath from '@assets/WNVaultedAssets_1753707707419.png';
import darkLogoPath from '@assets/VaultedAssets (1)_1753709040936.png';

export function Footer() {
  const { t } = useTranslation('common');
  const { theme } = useTheme();
  const logoPath = theme === 'dark' ? darkLogoPath : lightLogoPath;
  return (
    <footer className="bg-gray-100 dark:bg-black text-gray-900 dark:text-gray-100 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src={logoPath}
                alt="Vaulted Assets Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold text-brand-dark-gold dark:text-brand-gold">Vaulted Assets</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
              {t("footer.description")}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>            
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Products */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t("footer.products")}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/gold-tokens">
                  <span className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">{t("footer.goldTokens")}</span>
                </Link>
              </li>
              <li>
                <Link href="/silver-tokens">
                  <span className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">{t("footer.silverTokens")}</span>
                </Link>
              </li>
              <li>
                <Link href="/portfolio">
                  <span className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">{t("footer.portfolioManagement")}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t("footer.company")}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about">
                  <span className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">{t("footer.about")}</span>
                </Link>
              </li>
              <li>
                <Link href="/whitepaper">
                  <span className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">{t("navigation.whitepaper")}</span>
                </Link>
              </li>
              <li>
                <Link href="/faq">
                  <span className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">{t("footer.faq")}</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-300 dark:border-gray-700 mt-8">
          <div className="mt-6 p-4 bg-gray-200 dark:bg-gray-900 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              <strong className="text-gray-800 dark:text-gray-300">{t('footer.importantNotice')}:</strong> <span className="text-brand-dark-gold dark:text-brand-gold">Vaulted Assets</span> {t('footer.complianceNotice')}
            </p>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-4">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-center gap-3 sm:gap-6 mb-4 md:mb-0">
              <Link href="/privacy-policy">
                <span className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm cursor-pointer">{t('footer.privacyPolicy')}</span>
              </Link>
              <Link href="/terms-of-service">  
                <span className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm cursor-pointer">{t('footer.termsOfService')}</span>
              </Link>
              <Link href="/cookie-policy">
                <span className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm cursor-pointer">{t('footer.cookiePolicy')}</span>
              </Link>
              <Link href="/contact">
                <span className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm cursor-pointer">{t('footer.contactUs')}</span>
              </Link>
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm text-center md:text-left">
              {t('footer.copyright')}
            </div>
          </div>
          
          {/* Compliance Notice */}
         
        </div>
      </div>
    </footer>
  );
}