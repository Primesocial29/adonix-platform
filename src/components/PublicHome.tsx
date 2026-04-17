{/* Hero Section */}
<div className="relative min-h-screen flex">
  {/* Left Side - Solid Black Background (covers 60% = 10% more than half) */}
  <div className="relative w-3/5 bg-black flex flex-col justify-center">
    {/* Radial Gradient Glow - Crimson Red halo */}
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{
        background: 'radial-gradient(circle at center, rgba(220,20,60,0.15) 0%, rgba(0,0,0,0) 70%)'
      }}
    />
    
    <div className="relative z-10 max-w-2xl ml-auto mr-0 px-8">
      {/* Logo */}
      <div className="mb-6">
        <img 
          src="/adonixlogo.png?t=9" 
          alt="Adonix Logo" 
          className="h-60 w-auto object-contain" 
          style={{ background: 'transparent' }}
          onError={(e) => {
            console.error('Logo failed to load');
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
      
      {/* Subheadline */}
      <div className="mb-8">
        <p className="text-3xl md:text-4xl font-light text-white leading-tight">
          Verified Public
        </p>
        <p className="text-3xl md:text-4xl font-light text-red-500 leading-tight mt-1">
          Meetups<span className="text-white">|</span>
        </p>
        <p className="text-2xl md:text-3xl font-light text-white leading-tight mt-4">
          Real-World Connections.
        </p>
      </div>
      
      {/* Text lines */}
      <div className="space-y-1 mb-10">
        <p className="text-sm text-gray-400 tracking-wider">AUTHENTICITY EXCELLENCE</p>
        <p className="text-sm text-gray-400 tracking-wider">Curated Meetups.</p>
        <p className="text-sm text-gray-400 tracking-wider">High-Standard Community</p>
      </div>
      
      {/* CTA Button */}
      <button
        onClick={() => setShowAuthModal(true)}
        className="px-10 py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-full font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-red-500/30"
      >
        EXPLORE CURATION
      </button>
    </div>
  </div>
  
  {/* Right Side - Girl Image (covers remaining 40%) */}
  <div className="relative w-2/5 overflow-hidden">
    <img 
      src="/girl_image_backgroundinterface.jpg" 
      alt="Female runner"
      className="absolute inset-0 w-full h-full object-cover"
      style={{
        filter: 'grayscale(100%) brightness(70%)'
      }}
    />
    
    {/* Black gradient overlay on the right panel edge for blending */}
    <div className="absolute inset-0 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
  </div>
</div>