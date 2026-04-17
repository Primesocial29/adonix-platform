export default function PrivacyContent() {
  return (
    <div className="space-y-6 text-gray-300 text-sm">
      <div>
        <p className="text-xs text-gray-500">Effective: April 17, 2026 | Last updated: April 17, 2026</p>
      </div>

      <section>
        <h2 className="text-base font-semibold text-white mb-2">1. DATA COLLECTION</h2>
        <p>Prime Social LLC collects identifiers (email, username, IP address, device ID) and fitness data necessary to operate Adonix Fit. Age verification data is deleted immediately after 18+ verification is confirmed and is not retained for any other purpose.</p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mb-2">2. LOCATION DATA</h2>
        <p>GPS is used only for session check-in verification and the SOS emergency safety feature. Location data is not retained after the session and is never sold to third parties.</p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mb-2">3. BIOMETRICS</h2>
        <p>Per BIPA and applicable state biometric privacy laws, facial estimation data is processed and purged instantly. Separate written consent is obtained before any biometric data is collected. We do not sell, share, or trade biometric data.</p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mb-2">4. AI MODERATION</h2>
        <p>Prime Social LLC uses AI to scan user-generated content for safety violations and Terms of Service breaches. Human review of any AI-generated decision is available upon request to <a href="mailto:primesocial@primesocial.xyz" className="text-red-400 underline">primesocial@primesocial.xyz</a>.</p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mb-2">5. NO SALE OF DATA</h2>
        <p>Prime Social LLC does not sell personal data to third parties. Data may be shared with Stripe for payment processing, emergency services during SOS activation, and law enforcement as required by law.</p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mb-2">6. DATA RETENTION</h2>
        <p>Account records are purged within 30 days after account deletion. Age verification data is deleted immediately. Location data is not retained beyond the active session. Payment data is handled exclusively by Stripe.</p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mb-2">7. YOUR RIGHTS</h2>
        <p>Per CCPA/CPRA, Florida SB 1722, and all applicable US state privacy laws, you have the right to access, correct, delete, and port your personal data. To exercise your rights, email <a href="mailto:primesocial@primesocial.xyz" className="text-red-400 underline">primesocial@primesocial.xyz</a>. We respond within 45 days.</p>
      </section>

      <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
        <p className="text-xs text-yellow-400 text-center">
          By using Adonix Fit, you acknowledge that you have read, understood, and agree to this Privacy Policy.
        </p>
      </div>
    </div>
  );
}
