// src/components/PrivacyPage.tsx
import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Effective: April 9, 2026 | Last updated: April 9, 2026</p>

        <div className="space-y-6 text-gray-300">
          
          {/* 1. Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">1. Information We Collect</h2>
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

          {/* 2. Location Data */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">2. Location Data</h2>
            <p>We collect precise GPS location data to:</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Verify that both parties are within <strong>0.75 miles (1207 meters)</strong> of the agreed session location (GPS check‑in) — this matches our Terms of Service</li>
              <li>Enable emergency SOS features, which may share your real‑time location with emergency services or your designated contacts</li>
              <li>Prevent fraudulent or prohibited activities (e.g., meetings at private residences)</li>
            </ul>
            <p className="mt-2"><strong>Location Data Usage:</strong> Location data is used only for these safety purposes and is not sold or shared with third parties except as required to respond to an SOS activation, to comply with a legal obligation, or to protect the rights and safety of users.</p>
            <p className="mt-2"><strong>Signal Disclaimer:</strong> We are not liable for GPS/satellite signal degradation, localized outages, or hardware interference that may affect location verification.</p>
            <p className="mt-2"><strong>Mandatory Access:</strong> You cannot use the App without enabling location services. You may disable location services in your device settings, but doing so will prevent you from using the App.</p>
          </section>

          {/* 3. Age Verification & Biometric Data */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">3. Age Verification &amp; Biometric Data</h2>
            <p><strong>Age Verification:</strong> We collect your birth date (month/day/year) at account creation to verify you are at least 18 years old. Age verification data is used <strong>ONLY</strong> to confirm your age and is <strong>deleted immediately</strong> after verification. We do not retain birth dates.</p>
            <p className="mt-2"><strong>Biometric Data (Facial Age Estimation):</strong> If we use facial age estimation technology:</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>We obtain your <strong>separate, written consent</strong> before collecting any biometric data</li>
              <li>Biometric data is used <strong>ONLY</strong> for age verification</li>
              <li>Biometric data is <strong>deleted immediately</strong> after verification</li>
              <li>We do not sell, share, trade, or disclose biometric data to any third party</li>
              <li>You may withdraw consent at any time by emailing primesocial@primesocial.xyz</li>
            </ul>
            <p className="mt-2">This complies with the Illinois Biometric Information Privacy Act (BIPA) and similar state laws.</p>
          </section>

          {/* 4. How We Use Your Information */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">4. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Operate, maintain, and improve the App</li>
              <li>Verify your age and identity (age verification only, data deleted immediately)</li>
              <li>Communicate with you (account updates, booking confirmations, marketing — you may opt out)</li>
              <li>Process payments via Stripe</li>
              <li>Enforce our Terms of Service</li>
              <li>Protect the safety and security of our users</li>
              <li>Comply with legal obligations</li>
              <li>Personalize partner recommendations (including using AI — see Section 11)</li>
              <li>Prevent fraud, abuse, and prohibited conduct</li>
            </ul>
          </section>

          {/* 5. Sharing of Information */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">5. Sharing of Information</h2>
            <p><strong>We do not sell your personal data.</strong> We may share information with:</p>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm border border-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="p-2 text-left border border-white/10">Recipient</th>
                    <th className="p-2 text-left border border-white/10">Purpose</th>
                    <th className="p-2 text-left border border-white/10">Legal Basis</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="p-2 border border-white/10">Other users</td><td className="p-2 border border-white/10">Facilitate bookings (profile photo, username, fitness goals, bio)</td><td className="p-2 border border-white/10">Legitimate interest (service operation)</td></tr>
                  <tr><td className="p-2 border border-white/10">Stripe</td><td className="p-2 border border-white/10">Payment processing (Stripe's privacy policy applies)</td><td className="p-2 border border-white/10">Contract (payment processing)</td></tr>
                  <tr><td className="p-2 border border-white/10">Emergency services</td><td className="p-2 border border-white/10">SOS feature activation</td><td className="p-2 border border-white/10">Vital interest (safety)</td></tr>
                  <tr><td className="p-2 border border-white/10">Law enforcement</td><td className="p-2 border border-white/10">Legal compliance, court orders, subpoenas</td><td className="p-2 border border-white/10">Legal obligation</td></tr>
                  <tr><td className="p-2 border border-white/10">AI service providers</td><td className="p-2 border border-white/10">Content moderation, matching recommendations (see Section 11)</td><td className="p-2 border border-white/10">Legitimate interest (safety &amp; improvement)</td></tr>
                  <tr><td className="p-2 border border-white/10">Marketing partners</td><td className="p-2 border border-white/10">Remarketing pixels (Facebook, Google, TikTok) — you may opt out</td><td className="p-2 border border-white/10">Consent (opt-out available)</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2">We require all third parties to respect the security of your data and to treat it in accordance with the law.</p>
          </section>

          {/* 6. Data Retention and Deletion */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">6. Data Retention and Deletion</h2>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm border border-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="p-2 text-left border border-white/10">Data Type</th>
                    <th className="p-2 text-left border border-white/10">Retention Period</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="p-2 border border-white/10">Age verification data (birth date, facial estimation)</td><td className="p-2 border border-white/10">Deleted immediately after verification</td></tr>
                  <tr><td className="p-2 border border-white/10">Account data (profile, photos, bio, fitness goals)</td><td className="p-2 border border-white/10">Until account deletion, plus up to 30 days</td></tr>
                  <tr><td className="p-2 border border-white/10">Chat messages</td><td className="p-2 border border-white/10">Until account deletion, plus up to 30 days</td></tr>
                  <tr><td className="p-2 border border-white/10">Location data (GPS)</td><td className="p-2 border border-white/10">Used only during active session; not retained</td></tr>
                  <tr><td className="p-2 border border-white/10">Payment information</td><td className="p-2 border border-white/10">Processed by Stripe; we do not retain</td></tr>
                  <tr><td className="p-2 border border-white/10">Marketing data (pixels, cookies)</td><td className="p-2 border border-white/10">Per cookie duration (typically 30-90 days)</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2"><strong>Account Deletion:</strong> You may request deletion of your account and associated data by emailing <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a>. Data will be deleted within <strong>30 days</strong> of your request. Some data may be retained for legal compliance, security, fraud prevention, or legitimate business purposes (e.g., to prevent banned users from re-registering).</p>
          </section>

          {/* 7. Security & Data Breach Notification */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">7. Security &amp; Data Breach Notification</h2>
            <p>We implement reasonable security measures to protect your data, including encryption in transit (TLS/SSL), encryption at rest, access controls, and regular security audits. However, no transmission over the internet is 100% secure, and you use the App at your own risk.</p>
            <p className="mt-2"><strong>No Guarantee of Security:</strong> Despite our reasonable security measures, no data transmission over the internet or wireless network can be guaranteed to be 100% secure. You acknowledge and agree that you provide your information at your own risk. We are not liable for unauthorized access, hacking, data breaches, or other security incidents caused by third parties, acts of God, cyberattacks, or events outside our reasonable control.</p>
            <p className="mt-2"><strong>Data Breach Notification:</strong> In the event of a data breach that compromises your personal information, we will notify you and relevant regulatory authorities as required by applicable state laws (including California, Florida, Texas, New York, and others). Notification will be provided without unreasonable delay, consistent with law enforcement needs.</p>
          </section>

          {/* 8. Children's Privacy */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">8. Children's Privacy</h2>
            <p><strong>The App is strictly for users 18 and older.</strong> We do not knowingly collect information from minors under 18. If you believe a minor has accessed the App, please contact us immediately at <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a>. Underage accounts are deleted within 24 hours of discovery per Florida SB 1722 and other applicable state laws.</p>
            <p className="mt-2"><strong>COPPA Compliance:</strong> We comply with the Children's Online Privacy Protection Act (COPPA). We do not knowingly collect personal information from children under 13. If we discover we have collected information from a child under 13, we will delete it immediately. Parents or guardians who believe their child under 13 has provided information to us should contact us at <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a>.</p>
          </section>

          {/* 9. Your Rights (All US States & Territories) */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">9. Your Rights (All US States &amp; Territories)</h2>
            <p>Depending on where you live, you may have the following rights under applicable privacy laws (including CCPA/CPRA, VCDPA, ColoPA, CTDPA, UCPA, OCPA, MCDPA, and similar laws in all 50 states and territories):</p>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm border border-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="p-2 text-left border border-white/10">Right</th>
                    <th className="p-2 text-left border border-white/10">What It Means</th>
                    <th className="p-2 text-left border border-white/10">How to Exercise</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="p-2 border border-white/10">Right to Know/Access</td><td className="p-2 border border-white/10">Request a copy of the personal data we hold about you</td><td className="p-2 border border-white/10">Email primesocial@primesocial.xyz</td></tr>
                  <tr><td className="p-2 border border-white/10">Right to Deletion</td><td className="p-2 border border-white/10">Request deletion of your account and associated data</td><td className="p-2 border border-white/10">Email primesocial@primesocial.xyz</td></tr>
                  <tr><td className="p-2 border border-white/10">Right to Portability</td><td className="p-2 border border-white/10">Receive a machine-readable export of your data</td><td className="p-2 border border-white/10">Email primesocial@primesocial.xyz</td></tr>
                  <tr><td className="p-2 border border-white/10">Right to Correct</td><td className="p-2 border border-white/10">Correct inaccurate personal information</td><td className="p-2 border border-white/10">Email primesocial@primesocial.xyz</td></tr>
                  <tr><td className="p-2 border border-white/10">Right to Opt-Out of Sale/Sharing</td><td className="p-2 border border-white/10">Opt out of sharing for targeted advertising</td><td className="p-2 border border-white/10">Email primesocial@primesocial.xyz or use "Do Not Sell My Personal Information" link in App Settings</td></tr>
                  <tr><td className="p-2 border border-white/10">Right to Opt-Out of Automated Decision-Making</td><td className="p-2 border border-white/10">Opt out of AI-driven decisions (matching, recommendations)</td><td className="p-2 border border-white/10">Email primesocial@primesocial.xyz</td></tr>
                  <tr><td className="p-2 border border-white/10">Right to Appeal</td><td className="p-2 border border-white/10">Appeal a denial of your privacy request</td><td className="p-2 border border-white/10">Email primesocial@primesocial.xyz</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2"><strong>We do not sell your personal information.</strong> We do share information with advertising partners (remarketing pixels) for targeted advertising purposes. You may opt out of this sharing at any time.</p>
            <p className="mt-2"><strong>Response Time:</strong> We will respond to all privacy requests within <strong>45 days</strong> as required by law.</p>
          </section>

          {/* 10. State-Specific Privacy Rights */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">10. State-Specific Privacy Rights</h2>
            
            <h3 className="text-lg font-semibold text-white mt-4 mb-2">California Residents (CCPA/CPRA)</h3>
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-3">
              <p className="text-sm text-yellow-400 font-semibold">📋 California Privacy Rights at a Glance:</p>
              <ul className="list-disc list-inside ml-4 mt-1 text-sm text-gray-300">
                <li>You have the right to know what data we collect</li>
                <li>You have the right to delete your data</li>
                <li>You have the right to opt out of data sharing for advertising</li>
                <li>You have the right to non-discrimination for exercising your rights</li>
                <li>We do not sell your personal information</li>
              </ul>
            </div>
            <p>In addition to the rights above, California residents have the right to know the categories of personal information collected, sold, or shared, the business purpose for collecting personal information, the categories of third parties with whom personal information is shared, and to designate an authorized agent to make requests on your behalf.</p>
            <p className="mt-2"><strong>Categories of Personal Information Collected (CCPA/CPRA):</strong> Identifiers (email, username, IP address, device ID), demographic information (age — deleted immediately), commercial information (booking history), biometric information (facial age estimation — with consent, deleted immediately), internet activity (usage data, clicks, page views), geolocation data (GPS), and inferences drawn from this data.</p>
            <p className="mt-2"><strong>Shine the Light (California Civil Code § 1798.83):</strong> California residents may request information about our disclosure of personal information to third parties for their direct marketing purposes. We do not disclose personal information to third parties for their own direct marketing purposes without your consent. To request information, email <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a>.</p>
            <p className="mt-2"><strong>Do Not Sell My Personal Information:</strong> To opt out of the sharing of your personal information for targeted advertising, email <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a> or use the "Do Not Sell My Personal Information" link in App Settings.</p>

            <h3 className="text-lg font-semibold text-white mt-4 mb-2">Colorado, Connecticut, Virginia, Utah, Oregon, Montana, Texas, Indiana, Iowa, Tennessee, New Hampshire, New Jersey, Delaware, Kentucky, Maryland, Minnesota, Nebraska</h3>
            <p>Residents of these states have the same rights to access, delete, correct, opt out, and appeal as described in Section 9. We provide a universal opt-out mechanism for the sale of personal information and targeted advertising.</p>

            <h3 className="text-lg font-semibold text-white mt-4 mb-2">Washington Residents (My Health My Data Act)</h3>
            <p>Under the Washington My Health My Data Act, you have the right to withdraw consent for collection of your health data (fitness goals, workout preferences, health-related information) at any time, know what health data we collect and why, and request deletion of your health data. <strong>We do not sell your health data.</strong></p>

            <h3 className="text-lg font-semibold text-white mt-4 mb-2">Nevada Residents (SB 370)</h3>
            <p>Nevada residents may opt out of the sale of their personal information by emailing <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a>.</p>

            <h3 className="text-lg font-semibold text-white mt-4 mb-2">Illinois Residents (BIPA)</h3>
            <p>If we use facial age estimation technology, we obtain separate written consent as required by the Illinois Biometric Information Privacy Act (BIPA). Biometric data is used only for age verification and is deleted immediately after verification. We do not sell, share, or trade biometric data.</p>

            <h3 className="text-lg font-semibold text-white mt-4 mb-2">Texas Residents (AGE APT Act, TDPSA)</h3>
            <p>We have assigned age ratings to the App and to each in-app purchase type as required by Texas law. We use commercially reasonable age verification methods.</p>

            <h3 className="text-lg font-semibold text-white mt-4 mb-2">Florida Residents (SB 1722, Digital Bill of Rights)</h3>
            <p>We use commercially reasonable age verification methods substantially similar to those required by Florida SB 1722. Underage accounts are terminated within 24 hours of discovery.</p>
          </section>

          {/* 11. Artificial Intelligence Use */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">11. Artificial Intelligence Use</h2>
            <p>We may use artificial intelligence (AI) for the following purposes:</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li><strong>Partner Matching:</strong> AI algorithms suggest potential fitness partners based on your preferences, fitness goals, and location</li>
              <li><strong>Content Moderation:</strong> AI scans messages, photos, and other content for violations of our Terms of Service (prohibited conduct, nudity, harassment, etc.)</li>
              <li><strong>Recommendations:</strong> AI personalizes workout recommendations and partner suggestions</li>
            </ul>
            <p className="mt-2"><strong>Your Rights Regarding AI:</strong></p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>You have the right to opt out of automated decision-making (AI matching) by emailing <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a></li>
              <li>You may request human review of any AI-generated decision affecting you</li>
              <li>We do not make final decisions about account termination or payment disputes solely by AI — human review is available</li>
            </ul>
            <p className="mt-2"><strong>No Liability for AI Output:</strong> We are not liable for any damages, losses, or harms arising from your reliance on AI-generated recommendations or from AI moderation errors. AI-generated suggestions are for convenience only and are not guaranteed to be accurate, appropriate, or suitable for your needs. You are solely responsible for evaluating any AI-generated suggestion before acting on it.</p>
          </section>

          {/* 12. Marketing & Remarketing Pixels */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">12. Marketing &amp; Remarketing Pixels</h2>
            <p>We may use "pixels," cookies, or hashed identifiers from third-party advertising platforms (including Facebook/Meta, Google, TikTok, and others) to:</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Show you Adonix-related advertisements on other websites and social media platforms</li>
              <li>Measure the effectiveness of our advertising campaigns</li>
              <li>Retarget users who have visited the App but not completed an action</li>
            </ul>
            <p className="mt-2"><strong>Opt Out:</strong> You may opt out of targeted advertising by:</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Emailing <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a></li>
              <li>Using the "Do Not Sell My Personal Information" link in App Settings</li>
              <li>Adjusting your device advertising settings (Limit Ad Tracking on iOS, Opt Out of Ads Personalization on Android)</li>
              <li>Visiting the Digital Advertising Alliance opt-out portal at <a href="https://optout.aboutads.info" className="text-red-500 hover:underline">optout.aboutads.info</a></li>
            </ul>
          </section>

          {/* 13. Cookies and Tracking Technologies */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">13. Cookies and Tracking Technologies</h2>
            <p>We use cookies and similar tracking technologies to authenticate users and maintain session state, remember preferences and settings, analyze usage and improve the App, and serve targeted advertisements (you may opt out).</p>
            <p className="mt-2"><strong>Do Not Track (DNT):</strong> Some browsers transmit "Do Not Track" (DNT) signals. The App does not currently respond to DNT signals because no uniform standard has been adopted. However, you may opt out of targeted advertising as described in Section 12.</p>
            <p className="mt-2">You may disable cookies in your browser settings, but doing so may affect the functionality of the App.</p>
          </section>

          {/* 14. Data Broker Registration */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">14. Data Broker Registration</h2>
            <p>We do not sell personal information and are not a data broker as defined by applicable state laws (including California, Vermont, Texas, and others). If this changes, we will register as required by law.</p>
          </section>

          {/* 15. International Data Transfers */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">15. International Data Transfers</h2>
            <p>Adonix Fit is currently available only within the United States. All data is stored on servers located within the United States. We do not transfer personal data outside the United States. If you access the App from outside the USA, you do so at your own risk and consent to the transfer of your data to the USA.</p>
          </section>

          {/* 16. Third-Party Links */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">16. Third-Party Links</h2>
            <p>The App may contain links to third-party websites, services, or content (including YouTube workout videos, fitness articles, or external resources). We are not responsible for the privacy practices, data collection practices, or content of any third-party sites. You access third-party content at your own risk.</p>
          </section>

          {/* 17. No Medical Advice */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">17. No Medical Advice</h2>
            <p>Adonix Fit is a general wellness platform. We do not provide medical advice, diagnosis, treatment, or prescription. Any fitness, health, or wellness information provided through the App is for informational purposes only. You should consult with a qualified healthcare professional before beginning any exercise program or making health-related decisions.</p>
          </section>

          {/* 18. No Verification of Users */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">18. No Verification of Users</h2>
            <p>We do not conduct criminal background checks on any user. We do not verify the identity, qualifications, certifications, safety, or conduct of any user. Partners' certifications are self-reported and are not verified by us. You are solely responsible for your own safety and for assessing the suitability of any person you meet through the App. We are not liable for any harm arising from in-person meetings.</p>
          </section>

          {/* 19. No Guaranteed Results */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">19. No Guaranteed Results</h2>
            <p>We do not guarantee any specific fitness results, including weight loss, muscle gain, improved endurance, or any other outcome. Results vary by individual and depend on many factors outside of our control. Your reliance on any information provided through the App is at your own risk.</p>
          </section>

          {/* 20. Consent to Electronic Signatures & Records */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">20. Consent to Electronic Signatures &amp; Records</h2>
            <p>By creating an account, clicking "I agree," "Sign Up," "Create Account," or any similar button, you agree that your electronic signature is the legal equivalent of your manual signature. You consent to receive all agreements, disclosures, notices, and other communications electronically. You may withdraw consent by deleting your account, but doing so will terminate your access to the App.</p>
          </section>

          {/* 21. Changes to This Policy */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">21. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes by:</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Sending an email to the address associated with your account</li>
              <li>Posting a notice in the App</li>
              <li>Providing notice through the App Store per Florida law and other applicable state laws</li>
            </ul>
            <p className="mt-2">Continued use of the App after changes constitutes acceptance of the new Privacy Policy. The "Effective" and "Last updated" dates at the top of this policy indicate when it became active and when it was last revised.</p>
          </section>

          {/* 22. Contact Us */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">22. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, need to exercise your privacy rights, or wish to report a privacy concern:</p>
            <p className="mt-2"><strong>Email:</strong> <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a></p>
            <p><strong>Entity:</strong> Prime Social LLC</p>
            <p><strong>Jurisdiction:</strong> Orange County, Florida</p>
            <p><strong>Response Time:</strong> We will respond to all privacy requests within 45 days.</p>
            <p className="mt-2"><strong>Data Protection Officer:</strong> If you are a resident of California or any jurisdiction requiring a designated Data Protection Officer, you may contact our DPO at the same email address: <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a>.</p>
          </section>

          {/* Final Acknowledgment */}
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