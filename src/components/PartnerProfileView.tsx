 <div className="text-center">
              🔔 Once @{partnerUsername} approves, you'll be able to chat and coordinate your session.
            </p>
            <p className="text-xs text-red-400 text-center mt-2">
              ⚠️ Meet only in public. Report bad behavior.
            </p>
          </div>
        </div>

        {/* Image Lightbox */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 cursor-pointer" onClick={() => setSelectedImage(null)}>
            <img src={selectedImage} alt="Full size" className="max-w-full max-h-full object-contain" />
            <button className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20" onClick={() => setSelectedImage(null)}>
              <X className="w-6 h-6" />
            </button>
          </div>
        )}
      </>
    );
  }

  // SCREEN 2: REVIEW & CONFIRM
  if (screen === 'review') {
    // Safety check - if selectedTimeSlot is undefined, go back to form
    if (!selectedTimeSlot) {
      setScreen('form');
      return null;
    }
    
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="sticky top-0 bg-black/90 z-10 pb-4 flex justify-between items-center">
            <button onClick={handleBackToForm} className="p-2 hover:bg-white/10 rounded-full">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-white/10 rounded-full">
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-full">
                <Flag className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full mx-auto overflow-hidden bg-red-500/20 mb-3">
              {partner.live_photo_url ? (
                <img src={partner.live_photo_url} alt={partnerUsername} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">📷</div>
              )}
            </div>
            <h2 className="text-xl font-bold text-white">REVIEW YOUR REQUEST</h2>
          </div>

          {/* Session Details */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-5">
            <h3 className="font-semibold text-white mb-3">SESSION DETAILS</h3>
            <div className="space-y-2">
              <p className="text-white">🧘 {selectedActivity} with @{partnerUsername}</p>
              <p className="text-gray-300 text-sm">⏱️ {formatDuration(selectedTimeSlot.durationMinutes)}</p>
              <p className="text-gray-300 text-sm">📅 {formatDateDisplay(selectedDate)} · {formatTimeDisplay(selectedTimeSlot.startTime)} - {formatTimeDisplay(selectedTimeSlot.endTime)}</p>
              <p className="text-gray-300 text-sm">📍 {selectedLocation} ({getLocationDistance(selectedLocation)} miles)</p>
              <p className="text-gray-300 text-sm">💰 Total: ${totalContribution.toFixed(2)}</p>
              <p className="text-xs text-yellow-400 mt-2">💬 You'll be able to chat with @{partnerUsername} ONLY after they approve your request.</p>
            </div>
          </div>

          {/* Your Contact Info */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-5">
            <h3 className="font-semibold text-white mb-3">YOUR CONTACT INFO</h3>
            <div className="space-y-1">
              <p className="text-gray-300">{firstName} {lastName}</p>
              <p className="text-gray-300">{contactEmail}</p>
              <p className="text-gray-300">{contactPhone}</p>
            </div>
          </div>

          {/* Payment Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-5">
            <p className="text-yellow-400 text-sm font-semibold mb-2">⚠️ YOUR CARD WILL BE AUTHORIZED FOR ${totalContribution.toFixed(2)}</p>
            <p className="text-xs text-gray-300">You will ONLY be charged after the session is completed together.</p>
            <div className="mt-3 pt-3 border-t border-yellow-500/30">
              <p className="text-xs text-gray-400">✓ Cancel within 24 hours → Full refund</p>
              <p className="text-xs text-gray-400">✓ Cancel within 12 hours → 50% refund</p>
              <p className="text-xs text-gray-400">✓ No show → No refund</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={handleBackToForm}
              className="flex-1 py-3 rounded-xl font-semibold text-white transition-all bg-white/10 hover:bg-white/20 border border-white/20"
            >
              CANCEL
            </button>
            <button
              onClick={handleConfirmAndAuthorize}
              className="flex-1 py-3 rounded-xl font-semibold text-white transition-all transform hover:scale-105 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              CONFIRM & AUTHORIZE ${totalContribution.toFixed(2)}
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center">↳ Back to form ↳ Authorizes card & sends request</p>
        </div>
      </div>
    );
  }

  // SCREEN 3: PROCESSING
  if (screen === 'processing') {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-500"></div>
          </div>
          <p className="text-white text-lg font-semibold">AUTHORIZING YOUR CARD...</p>
          <p className="text-gray-400 text-sm mt-2">Please don't close</p>
        </div>
      </div>
    );
  }

  // SCREEN 4: SUCCESS
  if (screen === 'success') {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="sticky top-0 bg-black/90 z-10 pb-4 flex justify-between items-center">
            <div></div>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-white/10 rounded-full">
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-full">
                <Flag className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full mx-auto bg-green-500/20 flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">REQUEST SENT!</h2>
            <p className="text-gray-300 mt-2">Your request has been sent to @{partnerUsername}</p>
          </div>

          {/* What Happens Next */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-5">
            <h3 className="font-semibold text-white mb-3">WHAT HAPPENS NEXT?</h3>
            <div className="space-y-3">
              <p className="text-gray-300 text-sm">🔔 @{partnerUsername} will review your request</p>
              <p className="text-gray-300 text-sm">📧 You'll get an email when they respond</p>
              <p className="text-gray-300 text-sm">💳 Your card has been authorized for ${totalContribution.toFixed(2)}</p>
              <p className="text-gray-300 text-sm">💬 Once @{partnerUsername} approves, you'll be able to chat through the app to coordinate.</p>
              <p className="text-gray-300 text-sm">📍 The exact meetup spot will be shared ONLY after approval and before your session.</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => {
                onClose();
                window.location.href = '/requests';
              }}
              className="flex-1 py-3 rounded-xl font-semibold text-white transition-all bg-white/10 hover:bg-white/20 border border-white/20"
            >
              VIEW REQUESTS
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold text-white transition-all bg-gradient-to-r from-red-600 to-orange-600 hover:scale-105"
            >
              CLOSE
            </button>
          </div>

          <p className="text-xs text-red-400 text-center mt-2">⚠️ Meet only in public. Report bad behavior.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Checkout Screen */}
      {showCheckout && (
        <CheckoutScreen
          partner={partner}
          selectedActivity={selectedActivity}
          selectedDuration={selectedDuration!}
          selectedDate={selectedDate}
          selectedTimeSlot={selectedTimeSlot!}
          selectedLocation={selectedLocation}
          locationLat={serviceAreas.find(a => a.name === selectedLocation)?.lat || undefined}
          locationLng={serviceAreas.find(a => a.name === selectedLocation)?.lng || undefined}
          contactEmail={contactEmail}
          contactPhone={contactPhone}
          totalContribution={totalContribution}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            setShowCheckout(false);
            setScreen('success');
          }}
        />
      )}
    </>
  );
}