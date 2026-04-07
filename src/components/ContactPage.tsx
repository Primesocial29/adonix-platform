export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-8">
        <h1 className="text-4xl font-bold mb-2 text-white">Contact Us</h1>
        <p className="text-gray-400 mb-8 text-base">Have questions? We're here to help.</p>
        
        <div className="space-y-6">
          <div className="p-6 bg-white/5 rounded-xl border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">Email Us</h2>
            <a href="mailto:support@adonixfit.com" className="text-red-500 hover:text-red-400">
              support@adonixfit.com
            </a>
          </div>
          
          <div className="p-6 bg-white/5 rounded-xl border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">Business Inquiries</h2>
            <a href="mailto:partners@adonixfit.com" className="text-red-500 hover:text-red-400">
              partners@adonixfit.com
            </a>
          </div>
          
          <div className="p-6 bg-white/5 rounded-xl border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">Legal & Privacy</h2>
            <a href="mailto:legal@adonixfit.com" className="text-red-500 hover:text-red-400">
              legal@adonixfit.com
            </a>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-white/10 text-center text-gray-500 text-sm">
          <p>© 2026 Adonix Fit. All rights reserved. 18+ Only.</p>
        </div>
      </div>
    </div>
  );
}