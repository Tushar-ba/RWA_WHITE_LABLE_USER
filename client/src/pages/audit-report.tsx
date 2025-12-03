import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, CheckCircle, AlertTriangle } from "lucide-react";

export default function AuditReport() {
  return (
    <div className="min-h-screen bg-white dark:bg-black py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Security Audit Report
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Comprehensive security assessment and audit findings for Vaulted
            Assets' smart contracts and infrastructure
          </p>
        </div>

        {/* Latest Audit Overview */}
        <Card className="mb-16 border-brand-gold/20">
          <CardHeader>
            <CardTitle className="text-brand-dark-gold dark:text-brand-gold flex items-center">
              <Shield className="w-6 h-6 mr-2" />
              Latest Audit Summary
            </CardTitle>
            <CardDescription>Conducted by CertiK - March 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  100%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Security Score
                </div>
              </div>
              <div className="text-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-4xl font-bold text-brand-dark-gold dark:text-brand-gold mb-2">
                  0
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Critical Issues
                </div>
              </div>
              <div className="text-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-4xl font-bold text-amber-600 mb-2">2</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Resolved Issues
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Scope */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Audit Scope
            </CardTitle>
            <CardDescription>
              Components and systems covered in the security audit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Smart Contracts
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Complete review of all smart contract code including token
                    contracts, vaulting system, and redemption mechanisms
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Platform Architecture
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Assessment of the overall system architecture, including
                    access controls and privilege management
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Security Controls
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Evaluation of security mechanisms, including multi-signature
                    wallets and time-locks
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Findings */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
            <CardHeader>
              <CardTitle className="text-green-800 dark:text-green-200 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Security Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-green-800 dark:text-green-200">
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Robust access control implementation</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Secure token minting and burning mechanisms</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Well-implemented emergency pause functionality</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Comprehensive event logging and monitoring</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Resolved Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-amber-800 dark:text-amber-200">
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <span className="font-medium">Gas Optimization</span>
                    <p className="text-sm">
                      Improved gas efficiency in redemption process
                    </p>
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <span className="font-medium">Input Validation</span>
                    <p className="text-sm">
                      Enhanced input validation for token transfers
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Security Recommendations
            </CardTitle>
            <CardDescription>
              Ongoing security measures and best practices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-brand-dark-gold dark:bg-brand-gold rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Regular Audits
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Conduct comprehensive security audits every 6 months or
                    after major updates
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-brand-dark-gold dark:bg-brand-gold rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Continuous Monitoring
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Implement 24/7 security monitoring and automated threat
                    detection
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-brand-dark-gold dark:bg-brand-gold rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Bug Bounty Program
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Maintain an active bug bounty program to incentivize
                    responsible disclosure
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certification */}
        <Card className="border-brand-gold/20">
          <CardHeader>
            <CardTitle className="text-brand-dark-gold dark:text-brand-gold flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Audit Certification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This security audit was conducted and certified by
              </p>
              <div className="font-bold text-2xl text-gray-900 dark:text-white mb-2">
                CertiK Security
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Certificate ID: CTK-2024-03-VA-001
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Issue Date: March 15, 2024
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
