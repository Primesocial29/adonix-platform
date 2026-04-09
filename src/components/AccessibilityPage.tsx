// src/components/AccessibilityPage.tsx
import React from 'react';

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Accessibility Statement</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: April 9, 2026</p>

        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Our Commitment</h2>
            <p>
              Adonix Fit is committed to ensuring digital accessibility for people with disabilities. 
              We are continually improving the user experience for everyone and applying relevant accessibility standards.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Conformance Status</h2>
            <p>
              We strive to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. 
              These guidelines explain how to make web content more accessible for people with disabilities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Accessibility Features</h2>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>High contrast color scheme for better readability</li>
              <li>Keyboard navigable interface</li>
              <li>Screen reader compatible text</li>
              <li>Resizable text (up to 200% without loss of content)</li>
              <li>Alternative text for images</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Feedback and Support</h2>
            <p>
              We welcome your feedback on the accessibility of Adonix Fit. If you encounter any accessibility barriers 
              or have suggestions for improvement, please contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong> <a href="mailto:primesocial@primesocial.xyz" className="text-red-500 hover:underline">primesocial@primesocial.xyz</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Limitations and Alternatives</h2>
            <p>
              Despite our best efforts to ensure accessibility, some pages or features may not be fully accessible. 
              If you need assistance accessing any content, please contact us and we will provide an alternative.
            </p>
          </section>

          <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-sm text-yellow-400 text-center">
              We are actively working to improve accessibility. If you experience any issues, please contact us immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}