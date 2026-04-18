import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function PublicHome() {
  const [loading, setLoading] = useState(true);

  // Force sign out on every load
  useEffect(() => {
    const forceSignOut = async () => {
      console.log('Forcing sign out...');
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      setLoading(false);
    };
    forceSignOut();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Simple Navbar */}
      <nav className="fixed top-0 w-full z-40">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <h1 className="text-4xl font-bold tracking-wide text-white uppercase">ADONIX</h1>
          <button
            onClick={async () => {
              const { supabase } = await import('../lib/supabase');
              await supabase.auth.signOut();
              localStorage.clear();
              window.location.reload();
            }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Clear & Reset
          </button>
        </div>
      </nav>

      <div className="fixed top-[72px] w-full h-px bg-white/30"></div>

      {/* Hero Section */}
      <div className="relative min-h-screen flex">
        <div className="relative w-3/5 bg-black flex flex-col justify-center">
          <div className="relative z-10 px-8">
            <div style={{ marginBottom: '120px', marginLeft: '-17px' }}>
              <img 
                src="/adonixlogo.png" 
                alt="Adonix Logo" 
                style={{ width: '190px', height: 'auto' }}
              />
            </div>
            
            <div className="mb-10" style={{ marginTop: '-68px' }}>
              <p className="text-gray-200 tracking-wider font-bold text-lg mb-2">AUTHENTICITY EXCELLENCE</p>
              <p className="text-gray-200 tracking-wider font-bold text-lg mb-2">Curated Meetups.</p>
              <p className="text-gray-200 tracking-wider font-bold text-lg">High-Standard Community</p>
            </div>
            
            <button
              onClick={async () => {
                // Clear everything and show auth modal
                localStorage.clear();
                sessionStorage.clear();
                await supabase.auth.signOut();
                window.location.href = '/?auth=open';
              }}
              className="px-12 py-4 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 rounded-lg font-bold text-white text-xl transition-all"
            >
              EXPLORE CURATION
            </button>
          </div>
        </div>
        
        <div className="relative w-2/5 flex items-center justify-center">
          <div style={{ width: '880px', height: '880px', position: 'relative', top: '-40' }}>
            <img 
              src="/girl_image_backgroundinterface.jpg" 
              alt="Female runner"
              className="w-full h-full object-cover"
              style={{ filter: 'grayscale(100%) brightness(70%)' }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xs text-gray-500">© 2026 ADONIX. All rights reserved.</div>
            <div className="text-center text-xs text-gray-600">
              Adonix is a social fitness network — not a professional service. Meet only at verified public locations.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}