// src/components/TermsPage.tsx
import React from 'react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: April 6, 2026</p>

        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using Adonix Fit (the "App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the App. The App is operated by Prime Social LLC ("Company", "we", "us").</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">2. Eligibility</h2>
            <p>You must be at least 18 years old to use the App. By using the App, you represent and warrant that you are 18 or older.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">3. Account Registration and Security</h2>
            <p>You agree to provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">4. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Use the App for any illegal purpose or in violation of any local, state, national, or international law.</li>
              <li>Harass, abuse, threaten, or intimidate other users.</li>
              <li>Post or share any content that is discriminatory, obscene, or otherwise offensive.</li>
              <li>Impersonate any person or entity.</li>
              <li>Share your account credentials with others.</li>
              <li>Attempt to reverse engineer or copy any part of the App.</li>
              <li>Take screenshots, screen recordings, or photographs of another user's content without their explicit permission.</li>
              <li>Use any automated tool (bot, scraper) to extract data from the App.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">5. In‑Person Meetings and Assumption of Risk</h2>
            <p>Adonix Fit is a platform for connecting users who wish to exercise together. You acknowledge that physical activities involve inherent risks of injury, including serious injury, disability, or death. You voluntarily assume all risks associated with any in‑person meetings or workouts arranged through the App.</p>
            <p className="mt-2">The Company does not conduct criminal background checks on users and makes no guarantees about the identity, safety, or conduct of any user. While the Company may use photo and identity verification tools, we do not warrant that such verification is error‑free or that all users are who they claim to be.</p>
            <p className="mt-2">You agree to take all reasonable safety precautions, including meeting in public places and informing others of your plans.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">6. Location Tracking and GPS Check‑in</h2>
            <p>The App uses location services (GPS) to verify that you are within <strong>0.75 miles (1207 metres)</strong> of the agreed session location. This check‑in is mandatory for safety and fraud prevention. By using the App, you consent to the collection, processing, and sharing of your precise location data for these purposes.</p>
            <p className="mt-2">You agree to meet only in public places such as parks, gyms, fitness studios, or other publicly accessible venues. Private residences, hotels, motels, short‑term rentals, home gyms, and any non‑public location are strictly prohibited. Sessions attempted at prohibited locations will be cancelled, and your account may be suspended.</p>
            <p className="mt-2">The App may include an SOS / emergency feature that, if activated, will share your real‑time location with emergency services and designated contacts. You acknowledge that enabling location services is required to use the App, and you may not opt out of location tracking while using core features. You may disable location services in your device settings, but doing so will prevent you from using the App.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">7. Payments and Fees</h2>
            <p>Partners set their own hourly rates. The platform adds a service fee. All fees are displayed before you confirm a booking. The intent fee is non‑refundable. The platform fee is non‑refundable once a booking is confirmed by the partner.</p>
            <p>Payments are processed by Stripe, and you agree to Stripe's Connected Account Agreement and Terms of Service. Any disputes regarding payment processing must be resolved directly with Stripe; the Company is not responsible for Stripe's actions or errors.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">8. Cancellations and Refunds</h2>
            <p>Once a booking is confirmed, the platform fee is non‑refundable. Partners may set their own cancellation policies. Any disputes regarding cancellations must be resolved directly between the user and the partner.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">9. User Content and License</h2>
            <p>By uploading photos, videos, or other content, you grant the Company a non‑exclusive, worldwide, royalty‑free license to use, display, and moderate that content for the purpose of operating the App. You represent that you have all necessary rights to the content.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">10. DMCA / Copyright Infringement</h2>
            <p>If you believe that any content on the App infringes your copyright, please provide a written notice to our designated agent at: <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a> with the following information:</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Identification of the copyrighted work claimed to have been infringed.</li>
              <li>Identification of the material that is claimed to be infringing.</li>
              <li>Your contact information (name, address, email, phone).</li>
              <li>A statement that you have a good faith belief that the use is not authorised.</li>
              <li>A statement that the information in the notice is accurate, under penalty of perjury, and that you are authorised to act on behalf of the copyright owner.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">11. Data Deletion (GDPR / CCPA)</h2>
            <p>You may request deletion of your account and associated personal data by contacting us at <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a>. We will delete your data within a reasonable time, except where retention is required for legal, security, or fraud prevention purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">12. Termination</h2>
            <p>We may suspend or terminate your account at any time for violation of these Terms or for any other reason. You may delete your account at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">13. Disclaimer of Warranties</h2>
            <p>THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON‑INFRINGEMENT.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">14. Limitation of Liability</h2>
            <p>TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT SHALL PRIME SOCIAL LLC BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOSS OF PROFITS, DATA, OR USE, ARISING FROM OR RELATED TO THESE TERMS OR THE APP. OUR TOTAL LIABILITY SHALL NOT EXCEED ONE HUNDRED DOLLARS ($100).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">15. Indemnification</h2>
            <p>You agree to indemnify, defend, and hold harmless Prime Social LLC from any claims, damages, losses, or expenses (including reasonable attorney's fees) arising from your use of the App or violation of these Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">16. Dispute Resolution – Binding Arbitration</h2>
            <p>Any dispute arising out of or relating to these Terms or the App shall be resolved exclusively through binding arbitration in Orange County, Florida, under the rules of the American Arbitration Association. You waive the right to a jury trial or to participate in a class action. The arbitrator may award the same relief as a court, but only on an individual basis.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">17. Governing Law</h2>
            <p>These Terms are governed by the laws of the State of Florida, without regard to its conflict of laws principles.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">18. Electronic Signature Consent</h2>
            <p>By registering for an account, you agree that your clicking "I agree" or similar button constitutes a valid electronic signature and consent to be bound by these Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">19. Changes to Terms</h2>
            <p>We may update these Terms from time to time. Continued use of the App after changes constitutes acceptance of the new Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">20. Contact Information</h2>
            <p>If you have any questions, please contact us at: <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a></p>
          </section>

          <p className="text-sm text-gray-400 mt-8">By using Adonix Fit, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>
        </div>
      </div>
    </div>
  );
}