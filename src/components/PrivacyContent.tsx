export default function PrivacyContent() {
  return (
    <div className="space-y-6 text-gray-300 text-sm">
      <div>
        <p className="text-xs text-gray-500">Effective: April 9, 2026 | Last updated: April 9, 2026</p>
      </div>

      <section>
        <h2 className="text-base font-semibold text-white mb-2">1. Information We Collect</h2>
        <p>We collect information you provide directly to us, such as when you create an account, update your profile, book a session, or communicate with other users. This may include:</p>
        <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
          <li><strong>Identifiers:</strong> Email address, username, IP address, device ID</li>
          <li><strong>Demographic information:</strong> Age (for verification only, deleted immediately), city</li>
          <li><strong>Fitness information:</strong> Fitness goals, workout preferences, exercise history</li>
          <li><strong>User content:</strong> Profile photos, bio, fitness goals, chat messages</li>
          <li><strong>Payment information:</strong> Processed by Stripe; we do not store full payment details</li>
          <li><strong>Location data:</strong> Precise GPS location (see Section 2)</li>
          <li><strong>Biometric data:</strong> Facial age estimation data (see Section 3) — only with separate written consent</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mb-2">2. Location Data</h2>
        <p>We collect precise GPS location data to verify that both parties are within <strong>0.75 miles (1207 meters)</strong> of the agreed session location, enable emergency SOS features, and prevent fraudulent or prohibited activities.</p>
        <p className="mt-2"><strong>Location Data Usage:</strong> Location data is used only for these safety purposes and is not sold or shared with third parties except as required to respond to an SOS activation or to comply with a legal obligation.</p>
        <p className="mt-2"><strong>Mandatory Access:</strong> You cannot use the App without enabling location services.</p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mb-2">3. Age Verification &amp; Biometric Data</h2>
        <p><strong>Age Verification:</strong> We collect your birth date (month/day/year) at account creation to verify you are at least 18 years old. Age verification data is used ONLY to confirm your age and is deleted immediately after verification.</p>
        <p className="mt-2">This complies with the Illinois Biometric Information Privacy Act (BIPA) and similar state laws.</p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mb-2">4. How We Use Your Information</h2>
        <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
          <li>Operate, maintain, and improve the App</li>
          <li>Verify your age and identity (data deleted immediately)</li>
          <li>Communicate with you (account updates, booking confirmations, marketing — you may opt out)</li>
          <li>Process payments via Stripe</li>
          <li>Enforce our Terms of Service</li>
          <li>Protect the safety and security of our users</li>
          <li>Comply with legal obligations</li>
          <li>Prevent fraud, abuse, and prohibited conduct</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mb-2">5. Sharing of Information</h2>
        <p><strong>We do not sell your personal data.</strong> We may share information with service providers (Stripe for payments, AI providers for content moderation), emergency services (SOS activation), and law enforcement (legal compliance, court orders).</p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mb-2">6. Data Retention and Deletion</h2>
        <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
          <li>Age verification data: Deleted immediately after verification</li>
          <li>Account data: Until account deletion, plus up to 30 days</li>
          <li>Location data: Used only during active session; not retained</li>
          <li>Payment information: Processed by Stripe; we do not retain</li>
        </ul>
        <p className="mt-2">To request account deletion, email <a href="mailto:primesocial@primesocial.xyz" className="text-red-400 underline">primesocial@primesocial.xyz</a>.</p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mb-2">7. Security &amp; Data Breach Notification</h2>
        <p>We implement reasonable security measures including encryption in transit (TLS/SSL) and at rest. In the event of a data breach, we will notify you and relevant regulatory authorities as required by applicable state laws.</p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mb-2">8. Children's Privacy</h2>
        <p><strong>The App is strictly for users 18 and older.</strong> Underage accounts are deleted within 24 hours of discovery per Florida SB 1722 and other applicable state laws.</p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mb-2">9. Your Privacy Rights (All US States)</h2>
        <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
          <li><strong>Right to Know/Access:</strong> Request a copy of your personal data</li>
          <li><strong>Right to Deletion:</strong> Request deletion of your account and data</li>
          <li><strong>Right to Portability:</strong> Receive a machine-readable export</li>
          <li><strong>Right to Correct:</strong> Correct inaccurate personal information</li>
          <li><strong>Right to Opt-Out of Sale/Sharing:</strong> Opt out of targeted advertising sharing</li>
          <li><strong>Right to Opt-Out of Automated Decision-Making</strong></li>
          <li><strong>Right to Appeal</strong></li>
        </ul>
        <p className="mt-2">To exercise your rights, email <a href="mailto:primesocial@primesocial.xyz" className="text-red-400 underline">primesocial@primesocial.xyz</a>. We respond within 45 days.</p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mb-2">10. State-Specific Privacy Rights</h2>
        <p>Residents of California (CCPA/CPRA), Colorado, Connecticut, Virginia, Utah, Oregon, Montana, Texas (TDPSA, AGE APT Act), Florida (SB 1722), Illinois (BIPA), Washington (My Health My Data Act), Nevada (SB 370), and all other US states and territories have the same rights to access, delete, correct, and opt-out as described in Section 9.</p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mb-2">11. Artificial Intelligence Use</h2>
        <p>We may use AI for partner matching, content moderation, and personalization. You have the right to opt out of automated decision-making and request human review of any AI-generated decision affecting you.</p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mb-2">17. No Medical Advice</h2>
        <p>Adonix Fit is a general wellness platform. We do not provide medical advice, diagnosis, treatment, or prescription. Consult with a qualified healthcare professional before beginning any exercise program.</p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mb-2">18. No Verification of Users</h2>
        <p>We do not conduct criminal background checks on any user. Partners' certifications are self-reported and not verified by us. You are solely responsible for your own safety and for assessing the suitability of any person you meet through the App.</p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mb-2">22. Contact Us</h2>
        <p><strong>Email:</strong> <a href="mailto:primesocial@primesocial.xyz" className="text-red-400 underline">primesocial@primesocial.xyz</a></p>
        <p><strong>Entity:</strong> Prime Social LLC</p>
        <p><strong>Jurisdiction:</strong> Orange County, Florida</p>
        <p><strong>Response Time:</strong> We respond to all privacy requests within 45 days.</p>
      </section>

      <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
        <p className="text-xs text-yellow-400 text-center">
          By using Adonix Fit, you acknowledge that you have read, understood, and agree to this Privacy Policy.
        </p>
      </div>
    </div>
  );
}
