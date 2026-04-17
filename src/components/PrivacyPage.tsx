import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Effective: April 17, 2026 | Last updated: April 17, 2026</p>

        <div className="space-y-6 text-gray-300">

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">1. DATA COLLECTION</h2>
            <p>Prime Social LLC collects identifiers (email address, username, IP address, device ID) and fitness data you provide when creating an account or booking sessions on Adonix Fit. Age verification data (birth date) is collected solely to confirm you are 18+ and is <strong>deleted immediately</strong> after verification. It is not used for marketing, analytics, or any other purpose.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">2. LOCATION DATA</h2>
            <p>GPS is used only for session check-in verification (confirming both parties are within 0.75 miles of the agreed public location) and for the SOS emergency safety feature. Location data is not retained after the active session ends and is <strong>never sold</strong> to third parties. You cannot use Adonix Fit without enabling location services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">3. BIOMETRICS</h2>
            <p>Per the Illinois Biometric Information Privacy Act (BIPA) and applicable state biometric privacy laws, facial estimation data is processed and purged instantly. Separate written consent is obtained before any biometric data is collected. Prime Social LLC does not sell, share, trade, or otherwise disclose biometric data to any third party. You may withdraw consent at any time by emailing <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">4. AI MODERATION</h2>
            <p>Prime Social LLC uses AI to scan user-generated content (messages, photos, profile content) for safety violations and Terms of Service breaches. AI moderation is not perfect — false positives and false negatives may occur. Human review of any AI-generated decision that affects your account is available upon request within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">5. NO SALE OF DATA</h2>
            <p>Prime Social LLC does not sell your personal data to third parties. Data may be shared with: Stripe (payment processing), emergency services (SOS activation), AI service providers (content moderation), and law enforcement (legal obligations and court orders only).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">6. DATA RETENTION</h2>
            <p>Account records are purged within <strong>30 days</strong> after account deletion. Age verification data is deleted immediately after verification. Location data is not retained beyond the active session. Payment data is processed and stored exclusively by Stripe — Prime Social LLC does not retain payment details. Some data may be retained for legal compliance, fraud prevention, or to prevent banned users from re-registering.</p>
            <p className="mt-2">To request account deletion, email <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">7. YOUR RIGHTS</h2>
            <p>Per CCPA/CPRA, Florida SB 1722, and all applicable US state privacy laws, you have the following rights:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li><strong>Right to Know/Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Right to Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Right to Portability:</strong> Receive a machine-readable export of your data</li>
              <li><strong>Right to Correct:</strong> Correct inaccurate personal information</li>
              <li><strong>Right to Opt-Out:</strong> Opt out of sharing for targeted advertising</li>
              <li><strong>Right to Appeal:</strong> Appeal any denial of your privacy request</li>
            </ul>
            <p className="mt-2">To exercise any of these rights, email <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a>. We respond within 45 days as required by law.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">8. SECURITY &amp; DATA BREACH</h2>
            <p>We implement reasonable security measures including encryption in transit (TLS/SSL) and at rest. No internet transmission is 100% secure and you use the App at your own risk. In the event of a data breach affecting your personal information, Prime Social LLC will notify you and relevant regulatory authorities as required by applicable state laws without unreasonable delay.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">9. CHILDREN'S PRIVACY</h2>
            <p>Adonix Fit is strictly for users 18 and older. Prime Social LLC does not knowingly collect information from minors. Underage accounts are deleted within 24 hours of discovery per Florida SB 1722 and applicable state laws. If you believe a minor has accessed the App, contact us immediately at <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">10. CHANGES TO THIS POLICY</h2>
            <p>Prime Social LLC may update this Privacy Policy from time to time. Material changes will be communicated by email or in-app notice. Continued use of Adonix Fit after changes constitutes acceptance of the updated Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">11. CONTACT</h2>
            <p><strong>Email:</strong> <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a></p>
            <p><strong>Entity:</strong> Prime Social LLC</p>
            <p><strong>Jurisdiction:</strong> Orange County, Florida</p>
            <p><strong>Response Time:</strong> We respond to all privacy requests within 45 days.</p>
          </section>

          <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-sm text-yellow-400 text-center">
              By using Adonix Fit, you acknowledge that you have read, understood, and agree to this Privacy Policy.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
