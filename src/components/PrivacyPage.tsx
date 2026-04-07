// src/components/PrivacyPage.tsx
import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: April 4, 2026</p>

        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you create an account, update your profile, book a session, or communicate with other users. This may include your name, email address, photos, location data, and fitness preferences.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">2. Location Data</h2>
            <p>We collect precise GPS location data to:</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Verify that you are within 200 metres of the agreed session location (GPS check‑in).</li>
              <li>Enable emergency SOS features, which may share your real‑time location with emergency services or your designated contacts.</li>
              <li>Prevent fraudulent or prohibited activities (e.g., meetings at private residences).</li>
            </ul>
            <p className="mt-2">Location data is used only for these safety purposes and is not sold or shared with third parties except as required to respond to an SOS activation or legal obligation. You cannot use the App without enabling location services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">3. How We Use Your Information</h2>
            <p>We use your information to operate, maintain, and improve the App, to communicate with you, to process payments via Stripe, to enforce our Terms of Service, and to protect the safety and security of our users.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">4. Sharing of Information</h2>
            <p>We do not sell your personal data. We may share information with:</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Other users as necessary to facilitate bookings (e.g., your profile photo and fitness goals).</li>
              <li>Stripe for payment processing (Stripe's privacy policy applies).</li>
              <li>Emergency services if you activate the SOS feature.</li>
              <li>Law enforcement if required by law or to protect rights and safety.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">5. Data Retention and Deletion</h2>
            <p>We retain your information as long as your account is active. You may request deletion of your account and associated data by emailing <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a>. Some data may be retained for legal, security, or fraud prevention purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">6. Security</h2>
            <p>We implement reasonable security measures to protect your data. However, no transmission over the internet is 100% secure, and you use the App at your own risk.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">7. Children's Privacy</h2>
            <p>The App is not intended for users under 18. We do not knowingly collect information from minors.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">8. Your Rights (GDPR / CCPA)</h2>
            <p>Depending on your location, you may have the right to access, correct, or delete your personal data, and to restrict or object to certain processing. To exercise these rights, contact us at <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Continued use of the App after changes constitutes acceptance of the new policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">10. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us at <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}