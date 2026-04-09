// src/components/TermsPage.tsx
import React from 'react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-8">Effective: April 9, 2026 | Last updated: April 9, 2026</p>

        <div className="space-y-6 text-gray-300">
          
          {/* 1. Acceptance of Terms */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">1. Acceptance of Terms</h2>
            <p>By accessing Adonix (also referred to as Adonix Fit) (the "App"), you agree to these Terms. The App is operated by Prime Social LLC ("Company", "we", "us").</p>
          </section>

          {/* 2. USA-Only Service & 18+ Eligibility */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">2. USA-Only Service &amp; 18+ Eligibility</h2>
            <p><strong>Location:</strong> Available only within the United States of America, including its territories and possessions (Puerto Rico, Guam, US Virgin Islands, Northern Mariana Islands, American Samoa). VPN use to bypass this restriction is prohibited and may result in account termination.</p>
            <p className="mt-2"><strong>Human-Only:</strong> Use of Artificial Intelligence (AI) to act as a user, generate fake personas, or automate chat is strictly prohibited. Violation results in immediate permanent ban.</p>
            <p className="mt-2"><strong>Age:</strong> You must be at least 18 years old. Underage accounts are deleted within 24 hours of discovery per Florida SB 1722.</p>
            <p className="mt-2"><strong>Age Verification Methods:</strong> We use commercially reasonable age verification methods including:</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Birth date collection (month/day/year dropdowns) at account creation</li>
              <li>The right to request government-issued identification</li>
              <li>The right to use facial age estimation technology (with separate written consent)</li>
            </ul>
            <p className="mt-2"><strong>Purpose Limitation:</strong> Age verification data is used ONLY to confirm you are 18 or older. It is NOT used for marketing, analytics, personalization, or any other purpose.</p>
            <p className="mt-2"><strong>Data Deletion:</strong> Age verification data is deleted immediately after confirmation. We do not retain birth dates or age estimation data.</p>
            <p className="mt-2"><strong>Florida SB 1722 Compliance:</strong> We use commercially reasonable age verification methods substantially similar to those required by Florida Senate Bill 1722.</p>
            <p className="mt-2"><strong>Texas AGE APT Act Compliance:</strong> We have assigned age ratings to the App and to each in-app purchase type as required by Texas law.</p>
            <p className="mt-2"><strong>Utah App Store Accountability Act Compliance:</strong> We receive and act on age signals provided by app stores to enforce age restrictions.</p>
            <p className="mt-2"><strong>Louisiana Act 172 Compliance:</strong> We use age verification methods consistent with Louisiana law.</p>
            <p className="mt-2"><strong>California Age-Appropriate Design Code (CAADCA) Compliance:</strong> California users: We have conducted a Data Protection Impact Assessment as required by the CAADCA. We have assessed and mitigated risks of harmful content to minors. No user under 18 is permitted on the App.</p>
          </section>

          {/* 3. Biometric Information (Illinois BIPA) */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">3. Biometric Information (Illinois BIPA)</h2>
            <p>If facial age estimation is used, we obtain separate written consent before collecting any biometric data. Biometric data is used only for age verification and is deleted immediately after verification. We do not sell, share, trade, or otherwise disclose biometric data to any third party. You may withdraw consent at any time by emailing primesocial@primesocial.xyz. This complies with the Illinois Biometric Information Privacy Act (BIPA) and similar state laws.</p>
          </section>

          {/* 4. Username Policy */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">4. Username Policy</h2>
            <p>Usernames must be 3-20 characters and may only contain letters, numbers, underscores (_), and periods (.). Emojis, spaces, and special characters are prohibited. Offensive, impersonating, or inappropriate usernames will be removed or changed at our sole discretion.</p>
          </section>

          {/* 5. Prohibited Conduct (Zero-Tolerance) */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">5. Prohibited Conduct (Zero-Tolerance)</h2>
            <p>Immediate permanent ban without notice for:</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li><strong>Nudity or Sexually Explicit Content:</strong> No genitalia, no exposed breasts, no sexually suggestive poses. Swimwear and athletic attire are permitted.</li>
              <li><strong>Cross-Promotion:</strong> No promoting other social media platforms (Instagram, TikTok, Twitter, Snapchat, Discord, Telegram, WhatsApp, etc.) or "link-in-bio" sites (Linktree, Beacons, etc.).</li>
              <li><strong>Screenshots or Recordings:</strong> Capturing, recording, or sharing another user's content, image, or conversation without their explicit written permission.</li>
              <li><strong>AI Impersonation:</strong> Use of AI to mimic a human user, automate chat, or create fake personas.</li>
              <li><strong>AI-Generated Profile Content:</strong> Profile photos and bio must be of a real human. AI-generated, deepfake, or synthetic images are prohibited.</li>
              <li><strong>Deepfakes:</strong> Creating or sharing AI-generated or manipulated media that falsely portrays another user.</li>
              <li><strong>Harassment or Abuse:</strong> Threatening, intimidating, stalking, or harassing other users.</li>
              <li><strong>Impersonation:</strong> Impersonating another person, entity, or brand.</li>
              <li><strong>Automated Tools:</strong> Using bots, scrapers, crawlers, or other automated tools to extract data from the App.</li>
              <li><strong>External Payments:</strong> Mentioning, requesting, or using external payment apps (Venmo, CashApp, PayPal, Zelle, Apple Pay, Google Pay, etc.).</li>
            </ul>
          </section>

          {/* 6. Chat & Security Monitoring */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">6. Chat &amp; Security Monitoring</h2>
            <p>The Company monitors App communications for safety and fraud prevention. By using the App, you consent to this monitoring. Monitoring is for safety and fraud prevention purposes, but we do not guarantee that all messages will be reviewed. Do not share personal contact information (phone number, email address, home address) in chat. Do not discuss payments outside of the App. Violations may result in account termination.</p>
          </section>

          {/* 7. Payment System & Multi-Vendor Fee Disclosure */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">7. Payment System &amp; Multi-Vendor Fee Disclosure</h2>
            <p><strong>Exclusive Provider:</strong> All transactions must be processed via the App's integrated payment systems (currently Stripe). Mentioning, requesting, or using external payment apps (Venmo, PayPal, CashApp, Zelle, etc.) is a material breach of these Terms and will result in immediate account termination.</p>
            <p className="mt-2"><strong>Tiered/Variable Fees:</strong> Prime Social LLC utilizes multiple third-party vendors for payments, security, identity verification, and infrastructure. Fees for these services range from 0.01% up to 30% per individual service or vendor used.</p>
            <p className="mt-2"><strong>Cumulative Pass-Through:</strong> These percentages are not a single 30% total, but are calculated per service Adonix uses or is legally required to use. These costs, along with the Company's service commission, are passed to the user.</p>
            <p className="mt-2"><strong>Total Price Disclosure:</strong> We adhere to all federal and state "Junk Fee" transparency laws. The App will display a Total "All-In" Price (including the Partner's hourly rate and all cumulative vendor/platform fees) before you confirm any booking.</p>
            <p className="mt-2"><strong>No Refunds:</strong> ALL PAYMENTS ARE FINAL AND NON-REFUNDABLE. Dissatisfaction with a Partner, dissatisfaction with a session, no-shows, or any other reason does not qualify for a refund. However, Apple and Google may have their own refund policies outside of our control as the App Store and Google Play Store providers.</p>
            <p className="mt-2"><strong>Payment Hold:</strong> When a client books a session, payment is authorized but not captured. Payment is only captured when:</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>The Partner scans the client's QR code AND GPS confirms both parties are within 0.75 miles (1207 meters) of the agreed public location, OR</li>
              <li>The client fails to cancel within the Partner's specified cancellation window (24-48 hours as set by the Partner), OR</li>
              <li>The client no-shows without scanning the Partner's QR code for any reason.</li>
            </ul>
          </section>

          {/* 8. Location Tracking, QR-Code & Signal Disclaimer */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">8. Location Tracking, QR-Code &amp; Signal Disclaimer</h2>
            <p><strong>Functional Necessity:</strong> GPS location access is mandatory and required to use the App. We use GPS to verify that both parties are within 0.75 miles (1207 meters) of the agreed public location before payment is released.</p>
            <p className="mt-2"><strong>Payment Trigger:</strong> Payouts to Partners are authorized ONLY after the client scans the Partner's unique QR code AND GPS confirms both parties are present at the agreed location within the required distance.</p>
            <p className="mt-2"><strong>Privacy Compliance:</strong> Precise location data is used solely for session verification and the SOS emergency feature. Location data is not sold, not shared with third parties (except emergency services during SOS activation), and not used for secondary profiling or marketing.</p>
            <p className="mt-2"><strong>Signal Disclaimer:</strong> We are not liable for session delays, payment failures, or verification errors caused by GPS/satellite signal degradation, localized outages, hardware interference, network connectivity issues, or mobile device limitations.</p>
            <p className="mt-2"><strong>SOS Feature Disclaimer:</strong> The SOS feature is a "best effort" tool only and is not a replacement for dialing 911 directly. We do not guarantee response times, that emergency services will receive your location, or that the SOS feature will function in all areas or under all conditions. You should always prioritize calling 911 directly in an emergency.</p>
          </section>

          {/* 9. Public Locations Only */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">9. Public Locations Only</h2>
            <p><strong>Public Venues Only:</strong> You agree to meet only in public places such as parks, public gyms, public fitness studios, public recreation centers, or other publicly accessible venues. Private residences, apartments, condos, townhomes, hotels, motels, short-term rentals (Airbnb, Vrbo, etc.), home gyms, office buildings after hours, parking lots, garages, and any non-public or non-commercial location are strictly prohibited.</p>
            <p className="mt-2"><strong>Three-Strike Policy:</strong> Violation of the public locations requirement results in:</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>First offense: Written warning</li>
              <li>Second offense: 7-day account suspension</li>
              <li>Third offense: Permanent account ban</li>
            </ul>
          </section>

          {/* 10. In‑Person Safety & Assumption of Risk */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">10. In‑Person Safety &amp; Assumption of Risk</h2>
            <p className="font-bold text-red-400">CONSPICUOUS DISCLAIMER: PHYSICAL ACTIVITIES INVOLVE INHERENT RISKS OF SERIOUS INJURY, INCLUDING PARALYSIS OR DEATH. YOU VOLUNTARILY ASSUME ALL RISKS ASSOCIATED WITH ANY IN-PERSON MEETINGS OR WORKOUTS ARRANGED THROUGH THE APP.</p>
            <p className="mt-2"><strong>No Background Checks:</strong> Prime Social LLC does NOT conduct criminal background checks on any users. We do NOT verify the identity, qualifications, certifications, safety, criminal history, or conduct of any user. Partners' certifications, credentials, and qualifications are self-reported and are not verified by us. You are solely responsible for assessing the suitability, safety, and trustworthiness of any person you meet through the App.</p>
            <p className="mt-2"><strong>No ID Verification Guarantee:</strong> Even if we offer ID verification features in the future, we do not guarantee that such verification is error-free, complete, or that all users are who they claim to be. ID verification does not guarantee safety or good conduct.</p>
            <p className="mt-2"><strong>Release of Liability:</strong> Prime Social LLC is not responsible for the conduct of any user, whether online or offline. You release Prime Social LLC, its members, managers, employees, and agents from all liability arising from any in-person meeting, including but not limited to claims of assault, battery, theft, stalking, harassment, or any criminal act by a third party.</p>
            <p className="mt-2"><strong>Equipment Disclaimer:</strong> We are not responsible for any injury arising from equipment suggested, recommended, loaned, or provided by a Partner or any other user, including but not limited to weights, dumbbells, barbells, kettlebells, resistance bands, exercise machines, yoga mats, or any other fitness equipment.</p>
            <p className="mt-2"><strong>Weather Disclaimer:</strong> We are not responsible for weather-related injuries occurring during outdoor sessions, including but not limited to heat stroke, heat exhaustion, dehydration, hypothermia, frostbite, sunburn, sun poisoning, lightning strikes, slip and fall on ice or wet surfaces, or injury from any adverse weather condition.</p>
          </section>

          {/* 11. Wellness & Medical Disclaimer (Apple 2026 Compliance) */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">11. Wellness &amp; Medical Disclaimer (Apple 2026 Compliance)</h2>
            <p><strong>NOT A MEDICAL DEVICE:</strong> Adonix is a general wellness platform. It does not diagnose, treat, cure, or prevent any medical condition, disease, or illness. We do not provide medical advice, diagnosis, treatment, or prescription of any kind.</p>
            <p className="mt-2"><strong>Consult a Physician:</strong> You should consult with a qualified healthcare professional, licensed physician, or doctor before beginning any exercise program, making any health-related decisions, or changing your diet or exercise routine.</p>
            <p className="mt-2"><strong>No Guaranteed Results:</strong> We do not guarantee any specific results, including but not limited to weight loss, muscle gain, improved endurance, increased strength, better flexibility, or any other fitness outcome. Results vary by individual and depend on many factors outside of our control.</p>
            <p className="mt-2"><strong>Partner Qualifications:</strong> Partners' certifications, credentials, qualifications, and expertise are self-reported. We do not verify the accuracy, validity, or standing of any claimed certification or credential.</p>
          </section>

          {/* 12. Independent Contractor Status */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">12. Independent Contractor Status</h2>
            <p>Partners are Independent Contractors, not employees, agents, joint venturers, or franchisees of Prime Social LLC. Partners are solely responsible for their own:</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Federal, state, and local taxes (including self-employment tax)</li>
              <li>Business licenses and permits</li>
              <li>Insurance (liability, health, disability, workers' compensation)</li>
              <li>Professional conduct and ethics</li>
              <li>Compliance with all applicable laws and regulations</li>
              <li>Equipment, transportation, and business expenses</li>
            </ul>
            <p className="mt-2">Nothing in these Terms creates an employment relationship, partnership, or joint venture. Partners set their own hourly rates (subject to minimum and maximum limits set by the Company). Partners have no authority to bind the Company to any contract or obligation.</p>
          </section>

          {/* 13. Artificial Intelligence Use */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">13. Artificial Intelligence Use</h2>
            <p><strong>AI Matching &amp; Recommendations:</strong> Adonix Fit may use artificial intelligence algorithms to suggest partners, recommend workouts, personalize your experience, and optimize matching. These suggestions are generated by AI and are not guaranteed to be accurate, appropriate, suitable for your needs, or free from bias. You are solely responsible for evaluating any AI-generated recommendation before acting on it.</p>
            <p className="mt-2"><strong>AI Content Moderation:</strong> We may use AI to scan messages, photos, videos, and other content for violations of these Terms. AI moderation is not perfect. False positives (flagging innocent content) and false negatives (missing violations) may occur. Human review is available upon request.</p>
            <p className="mt-2"><strong>No AI Impersonation (Reiterated):</strong> Use of AI to impersonate a human user, automate conversations, create fake personas, or simulate human interaction is strictly prohibited and will result in immediate permanent ban.</p>
            <p className="mt-2"><strong>No AI-Generated Profile Content:</strong> Profile photos, bios, fitness goals, and other user content must depict or represent a real human. AI-generated images, deepfakes, synthetic media, or artificially created personas are prohibited.</p>
            <p className="mt-2"><strong>Human Review:</strong> You may request human review of any AI-generated decision (including content removal, account suspension, or account termination) by emailing primesocial@primesocial.xyz within 30 days of the decision.</p>
            <p className="mt-2"><strong>No Liability for AI Output:</strong> We are not liable for any damages, losses, or harms arising from your reliance on AI-generated recommendations, AI moderation errors, or any other AI system output.</p>
          </section>

          {/* 14. User Content and License */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">14. User Content and License</h2>
            <p>By uploading, posting, or otherwise submitting photos, videos, bio, fitness goals, or other content to the App, you grant the Company a non-exclusive, worldwide, royalty-free, sublicensable license to use, reproduce, modify, adapt, publish, translate, distribute, and display that content for the purpose of operating, improving, and promoting the App.</p>
            <p className="mt-2">You represent and warrant that:</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>You have all necessary rights, consents, and permissions to grant this license</li>
              <li>Your content does not violate any third-party copyright, trademark, privacy right, or other right</li>
              <li>Your content is of a real human and not AI-generated, deepfake, or synthetic media</li>
            </ul>
            <p className="mt-2">We reserve the right to remove, moderate, or delete any content that violates these Terms at our sole discretion, without prior notice.</p>
          </section>

          {/* 15. DMCA / Copyright Compliance (Safe Harbor) */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">15. DMCA / Copyright Compliance (Safe Harbor)</h2>
            <p>If you believe that any content on the App infringes your copyright, please provide a written notice to our designated copyright agent at <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a> with the following information:</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Identification of the copyrighted work claimed to have been infringed</li>
              <li>Identification of the material that is claimed to be infringing, including a description of where it is located on the App</li>
              <li>Your contact information (name, address, email address, and phone number)</li>
              <li>A statement that you have a good faith belief that the use is not authorized by the copyright owner, its agent, or the law</li>
              <li>A statement that the information in the notice is accurate, under penalty of perjury, and that you are authorized to act on behalf of the copyright owner</li>
              <li>Your physical or electronic signature</li>
            </ul>
            <p className="mt-2">We will respond to valid DMCA notices promptly. We will terminate, in appropriate circumstances, the accounts of repeat infringers.</p>
          </section>

          {/* 16. Data Rights & Privacy */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">16. Data Rights &amp; Privacy</h2>
            <p>In accordance with applicable federal and state privacy laws (including but not limited to the California Consumer Privacy Act (CCPA/CPRA), Florida Digital Bill of Rights, Virginia Consumer Data Protection Act (VCDPA), Colorado Privacy Act (ColoPA), Connecticut Data Privacy Act (CTDPA), Utah Consumer Privacy Act (UCPA), and all similar laws in Oregon, Montana, Indiana, Tennessee, New Hampshire, New Jersey, Delaware, Kentucky, Iowa, Maryland, Minnesota, Nebraska, and all US territories), you have the following rights:</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li><strong>Right to Know/Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Right to Deletion:</strong> Request deletion of your account and associated personal data</li>
              <li><strong>Right to Portability:</strong> Receive a machine-readable export of your data</li>
              <li><strong>Right to Correct:</strong> Correct inaccurate personal information</li>
              <li><strong>Right to Opt-Out of Sale/Sharing:</strong> Opt-out of the sharing of your personal information for targeted advertising</li>
              <li><strong>Right to Opt-Out of Automated Decision-Making:</strong> Opt-out of automated decisions that significantly affect you</li>
              <li><strong>Right to Appeal:</strong> Appeal a denial of your privacy request</li>
            </ul>
            <p className="mt-2"><strong>To exercise your rights:</strong> Email <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a>. We will respond within 45 days as required by law.</p>
            <p className="mt-2"><strong>Data Minimization:</strong> We collect only the data necessary for the operation of the App. Age verification data is deleted immediately after confirmation. We do not retain biometric data.</p>
            <p className="mt-2"><strong>Data Retention:</strong> We retain your personal information as long as your account is active. After account deletion, data is deleted within 30 days except where retention is required for legal compliance, security, fraud prevention, or legitimate business purposes.</p>
            <p className="mt-2"><strong>Washington My Health My Data Act:</strong> Under the Washington My Health My Data Act, you have the right to withdraw consent for collection of your health data at any time. We do not sell your health data.</p>
            <p className="mt-2"><strong>Nevada Privacy Law (SB 370):</strong> Nevada residents may opt out of the sale of their personal information by emailing <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a>.</p>
            <p className="mt-2"><strong>Notice to California Residents (CCPA/CPRA):</strong> We collect identifiers (email, username, IP address), location data (GPS), fitness information, commercial information (booking history), and inferences. We do not sell your personal information. California residents have the right to opt-out of sharing, request deletion, and request access.</p>
            <p className="mt-2"><strong>Data Broker Registration:</strong> We do not sell personal information and are not a data broker as defined by applicable state laws.</p>
            <p className="mt-2"><strong>Automated Decision-Making Disclosure:</strong> We use automated decision-making for partner matching, content moderation, fraud detection, and recommendations. You have the right to opt out of automated decisions that significantly affect you.</p>
            <p className="mt-2"><strong>Third-Party Links Disclaimer:</strong> The App may contain links to third-party websites or content. We are not responsible for the privacy practices or content of any third-party sites.</p>
          </section>

          {/* 17. Use of Information for Marketing */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">17. Use of Information for Marketing</h2>
            <p>By providing information to the App, you grant Prime Social LLC the right to use your non-sensitive personal data (such as email address, username, usage habits, workout preferences, and fitness goals) for the following purposes:</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li><strong>Internal Marketing:</strong> To send you updates, newsletters, promotional offers, and announcements. You may opt out at any time.</li>
              <li><strong>Personalization:</strong> To tailor the App experience, partner recommendations, and content to your interests.</li>
              <li><strong>Third-Party Remarketing:</strong> We may use "pixels," cookies, or hashed identifiers to show you Adonix-related advertisements on other platforms, provided you have not exercised your right to opt-out.</li>
              <li><strong>Aggregated Data:</strong> We may use aggregated, de-identified data for business analytics, reporting, research, and product improvement.</li>
            </ul>
          </section>

          {/* 18. No Refunds (Reiterated) */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">18. No Refunds (Reiterated)</h2>
            <p><strong>ALL PAYMENTS ARE FINAL AND NON-REFUNDABLE. NO EXCEPTIONS.</strong></p>
            <p className="mt-2">By using the App, you waive any right to dispute a charge, request a refund, or initiate a chargeback on the basis of dissatisfaction with a Partner, dissatisfaction with a session, no-shows or cancellations, technical issues, GPS or signal failures, or any other reason whatsoever.</p>
            <p className="mt-2">If you believe a charge was made in error due to fraud, technical error on our part, or unauthorized account access, you must contact us at <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a> within 7 days of the charge. We will investigate and may issue a refund at our sole discretion.</p>
            <p className="mt-2"><strong>Note:</strong> Apple (App Store) and Google (Google Play Store) may have their own refund policies that apply to in-app purchases. Those policies are outside of our control.</p>
          </section>

          {/* 19. Indemnification */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">19. Indemnification</h2>
            <p>You agree to defend, indemnify, and hold harmless Prime Social LLC, its members, managers, employees, agents, successors, and assigns from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from or relating to your use of the App, your conduct with any other user, your violation of these Terms, your violation of any applicable law, your in-person meetings with other users, any injury or death arising from your use of the App, your content, or your breach of any representation or warranty made in these Terms.</p>
          </section>

          {/* 20. Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">20. Limitation of Liability</h2>
            <p className="font-bold">TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT SHALL PRIME SOCIAL LLC BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES. OUR TOTAL AGGREGATE LIABILITY TO YOU SHALL NOT EXCEED ONE HUNDRED DOLLARS ($100).</p>
            <p className="mt-2">This limitation applies to all claims, including but not limited to claims for personal injury, paralysis, death, emotional distress, theft, assault, battery, stalking, harassment, equipment-related injuries, weather-related injuries, GPS or signal failures, AI-generated recommendations or moderation errors, data breaches, or any other harm arising from in-person meetings arranged through the App.</p>
          </section>

          {/* 21. Dispute Resolution – Binding Arbitration & Class Action Waiver */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">21. Dispute Resolution – Binding Arbitration &amp; Class Action Waiver</h2>
            <p><strong>Binding Arbitration:</strong> Any dispute arising out of or relating to these Terms or the App shall be resolved exclusively through binding arbitration in Orange County, Florida, under the rules of the American Arbitration Association (AAA).</p>
            <p className="mt-2"><strong>Class Action Waiver:</strong> YOU WAIVE THE RIGHT TO BRING OR PARTICIPATE IN ANY CLASS ACTION, COLLECTIVE ACTION, REPRESENTATIVE ACTION, OR CONSOLIDATED ACTION AGAINST PRIME SOCIAL LLC. All disputes shall be resolved on an individual basis only.</p>
            <p className="mt-2"><strong>Small Claims Exception:</strong> Either party may bring individual claims in small claims court instead of arbitration, provided the claim falls within the court's jurisdiction and is brought on an individual basis only.</p>
            <p className="mt-2"><strong>Opt-Out Right:</strong> You may opt out of this arbitration provision within 30 days of creating your account by emailing <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a> with your full name, email address, and a clear statement that you opt out of the arbitration agreement.</p>
            <p className="mt-2"><strong>Governing Law:</strong> These Terms are governed by the laws of the State of Florida, without regard to its conflict of laws principles.</p>
          </section>

          {/* 22. Force Majeure */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">22. Force Majeure</h2>
            <p>We are not liable for any delay or failure to perform resulting from causes outside our reasonable control, including but not limited to acts of God, war, terrorism, pandemic, epidemic, government orders, natural disasters, labor disputes, power outages, server failures, cyberattacks, or internet service provider failures.</p>
          </section>

          {/* 23. Beta Testing Terms */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">23. Beta Testing Terms</h2>
            <p>If you participate in any beta testing program for Adonix Fit, you agree to provide honest feedback, keep confidential any non-public information, not share screenshots or recordings of the beta version publicly, and understand that beta versions may contain bugs and are provided "AS IS".</p>
          </section>

          {/* 24. Referral Program Terms */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">24. Referral Program Terms</h2>
            <p>If we offer a referral program in the future, referral rewards are promotional credits only, not redeemable for cash, expire 90 days after issuance, and fraudulent self-referrals will result in account termination.</p>
          </section>

          {/* 25. Gift Card / Credit Terms */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">25. Gift Card / Credit Terms</h2>
            <p>If we offer gift cards or in-app credits in the future, credits expire 12 months from issuance, are non-refundable and non-transferable, and we are not responsible for lost or stolen codes.</p>
          </section>

          {/* 26. Accessibility Statement */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">26. Accessibility Statement</h2>
            <p>Adonix Fit is committed to accessibility. If you have difficulty accessing any feature, please contact us at <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a>.</p>
          </section>

          {/* 27. Severability */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">27. Severability</h2>
            <p>If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.</p>
          </section>

          {/* 28. Entire Agreement */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">28. Entire Agreement</h2>
            <p>These Terms, together with our Privacy Policy, constitute the entire agreement between you and Prime Social LLC regarding the App and supersede all prior communications.</p>
          </section>

          {/* 29. Consent to Electronic Signatures */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">29. Consent to Electronic Signatures</h2>
            <p>By clicking "I agree," "Create Account," "Sign Up," "Complete Profile," or any similar button, you agree that your electronic signature is the legal equivalent of your manual signature. You may withdraw consent by deleting your account, but doing so will terminate your access to the App.</p>
          </section>

          {/* 30. Right to Change Terms */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">30. Right to Change Terms</h2>
            <p>We may update these Terms from time to time. We will notify you of material changes by email, by posting a notice in the App, or through the App Store per Florida law. Continued use of the App after changes constitutes acceptance of the new Terms.</p>
          </section>

          {/* 31. Termination */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">31. Termination</h2>
            <p>We may suspend or terminate your account at any time for violation of these Terms or for any other reason, with or without notice. You may delete your account at any time by emailing <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a>. Upon termination, you remain liable for any payments due and any indemnification obligations.</p>
          </section>

          {/* 32. Contact Information */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">32. Contact Information</h2>
            <p>For all legal inquiries, privacy requests, DMCA notices, arbitration opt-outs, accessibility requests, or data deletion requests:</p>
            <p className="mt-2"><strong>Email:</strong> <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a></p>
            <p><strong>Entity:</strong> Prime Social LLC</p>
            <p><strong>Jurisdiction:</strong> Orange County, Florida</p>
            <p><strong>Response Time:</strong> We will respond to all legal and privacy requests within 45 days as required by applicable law.</p>
          </section>

          {/* 33. Other State Laws (All 50 States + Territories) */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">33. Other State Laws (All 50 States + Territories)</h2>
            <p>Adonix Fit complies with applicable data privacy, age verification, and consumer protection laws in all states and territories where it operates, including but not limited to California (CCPA/CPRA, CAADCA), Colorado (ColoPA), Connecticut (CTDPA), Virginia (VCDPA), Utah (UCPA), Oregon (OCPA), Montana (MCDPA), Texas (TDPSA, AGE APT Act), Florida (SB 1722, Digital Bill of Rights), Illinois (BIPA), Washington (My Health My Data Act), and all US territories (Puerto Rico, Guam, US Virgin Islands, Northern Mariana Islands, American Samoa).</p>
            <p className="mt-2">Residents of all US states and territories have the same rights to access, delete, correct, and opt-out as described in Section 16. To exercise your rights, email <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a>.</p>
          </section>

          {/* Final Acknowledgment */}
          <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-sm text-yellow-400 text-center">
              By creating an account, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service, including the arbitration agreement, class action waiver, limitation of liability, assumption of risk, indemnification, force majeure, and no refund policy. You further acknowledge that you are located within the United States of America (including its territories) and are at least 18 years old.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}