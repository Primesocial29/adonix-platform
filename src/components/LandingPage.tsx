interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Top Nav Bar */}
      <nav className="flex justify-between items-center px-5 py-4 z-50 relative">
        <span
          className="font-black tracking-[0.18em] text-white"
          style={{ fontSize: '1.25rem', letterSpacing: '0.18em' }}
        >
          ADONIX
        </span>
        <button
          onClick={onSignIn}
          className="text-xs font-semibold tracking-widest uppercase text-gray-300 hover:text-white transition-colors"
          style={{ letterSpacing: '0.12em' }}
        >
          LOGIN / SETUP
        </button>
      </nav>

      {/* Hero Area — image background with all overlays */}
      <div className="relative flex-1 flex flex-col" style={{ minHeight: '82vh' }}>
        {/* Background hero image */}
        <img
          src="/.bolt/girl_image_backgroundinterface.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ filter: 'grayscale(100%) brightness(0.38)' }}
        />

        {/* Crimson halo behind logo icon */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '18%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '280px',
            height: '280px',
            background:
              'radial-gradient(ellipse at center, rgba(200,30,0,0.55) 0%, rgba(160,0,0,0.28) 38%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Content layer */}
        <div className="relative z-10 flex flex-col flex-1">
          {/* Centered Logo Icon */}
          <div className="flex justify-center pt-10 pb-2">
            <img
              src="/adonixlogo.png"
              alt="Adonix"
              className="w-auto object-contain drop-shadow-lg"
              style={{ height: '100px' }}
            />
          </div>

          {/* Right-aligned tagline */}
          <div className="flex justify-end px-6 mt-4">
            <p
              className="text-right text-white font-semibold leading-snug max-w-[50%]"
              style={{ fontSize: '0.95rem', lineHeight: 1.4 }}
            >
              Verified Public<br />Meetups |<br />Real-World<br />Connections.
            </p>
          </div>

          {/* Spacer pushes text block down */}
          <div className="flex-1" />

          {/* Bottom text block */}
          <div className="px-5 pb-6">
            <h1
              className="font-black uppercase text-white leading-none mb-3"
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: 'clamp(2rem, 7vw, 2.6rem)',
                letterSpacing: '-0.01em',
                lineHeight: 1.05,
                textShadow: '0 2px 16px rgba(0,0,0,0.8)',
              }}
            >
              AUTHENTICITY<br />EXCELLENCE
            </h1>
            <p
              className="text-gray-300 font-medium"
              style={{ fontSize: '0.9rem', lineHeight: 1.5 }}
            >
              Curated Meetups.<br />High-Standard<br />Community
            </p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={onGetStarted}
        className="w-full py-5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black tracking-[0.22em] uppercase transition-colors"
        style={{ fontSize: '1rem', letterSpacing: '0.22em' }}
      >
        EXPLORE CURATION
      </button>
    </div>
  );
}
