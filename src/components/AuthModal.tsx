usernameAvailable === true
                        ? 'border-green-500 focus:border-green-500'
                        : usernameAvailable === false
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-white/10 focus:border-red-500'
                    }`}
                    placeholder="jess_fit"
                  />
                  {checkingUsername && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                    </div>
                  )}
                  {usernameAvailable === true && !checkingUsername && username.length >= 3 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                  {usernameAvailable === false && !checkingUsername && username.length >= 3 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  3-20 characters • letters, numbers, underscore (_), period (.) only
                </p>
                {usernameAvailable === false && (
                  <p className="text-xs text-red-400 mt-1">Username already taken</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2 text-white">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none text-white placeholder-gray-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none text-white placeholder-gray-500"
                placeholder="••••••••"
              />
            </div>

            {!isLogin && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-white">
                  Birth Date <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-red-500 focus:outline-none"
                  >
                    <option value="">Month</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>

                  <select
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-red-500 focus:outline-none"
                  >
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>

                  <select
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-red-500 focus:outline-none"
                  >
                    <option value="">Year</option>
                    {Array.from({ length: 107 }, (_, i) => 2026 - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <p className="text-xs text-gray-500">
                  Used only to verify you are 18+. Deleted immediately after confirmation.
                </p>

                <div className="flex items-start gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="ageVerifyConsent"
                    checked={ageVerifyConsent}
                    onChange={(e) => setAgeVerifyConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 bg-white/5 border border-white/10 rounded focus:ring-red-500"
                  />
                  <label htmlFor="ageVerifyConsent" className="text-xs text-gray-400">
                    I consent to age verification using my birth date. This data is used only to confirm I am 18+ and is not retained.
                  </label>
                </div>

                <div className="flex items-start gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="facialAgeConsent"
                    checked={facialAgeConsent}
                    onChange={(e) => setFacialAgeConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 bg-white/5 border border-white/10 rounded focus:ring-red-500"
                  />
                  <label htmlFor="facialAgeConsent" className="text-xs text-gray-400">
                    I consent to facial age estimation (optional). My image will be used only for age verification and deleted immediately.
                  </label>
                </div>
              </div>
            )}

            {!isLogin && (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    disabled={!hasReadTerms || !hasReadPrivacy}
                    className="mt-1 w-4 h-4 bg-white/5 border border-white/10 rounded focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-300">
                    I have read and agree to the{' '}
                    <button 
                      type="button"
                      onClick={() => setShowTermsModal('terms')} 
                      className="text-red-500 hover:underline"
                    >
                      Terms of Service
                    </button>{' '}
                    and{' '}
                    <button 
                      type="button"
                      onClick={() => setShowTermsModal('privacy')} 
                      className="text-red-500 hover:underline"
                    >
                      Privacy Policy
                    </button>.
                  </label>
                </div>
                {(!hasReadTerms || !hasReadPrivacy) && (
                  <p className="text-xs text-yellow-400 mt-1">
                    ⚠️ You must read and agree to both the Terms of Service and Privacy Policy before checking this box.
                  </p>
                )}
                {hasReadTerms && hasReadPrivacy && !acceptedTerms && (
                  <p className="text-xs text-green-400 mt-1">
                    ✓ You have read both documents. Check the box to agree.
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!isLogin && (!birthMonth || !birthDay || !birthYear || !ageVerifyConsent || !acceptedTerms || !usernameAvailable))}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 rounded-xl font-semibold transition-all transform hover:scale-105 text-white"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>

            {isLogin && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSignUpClick}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Don't have an account? <span className="text-red-500">Sign up</span>
                </button>
              </div>
            )}

            {/* Cancel Button - Bottom of the form */}
            <div className="text-center pt-4 border-t border-white/10 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="text-gray-500 hover:text-red-400 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <TermsModal
        isOpen={showTermsModal === 'terms'}
        onClose={() => setShowTermsModal(null)}
        title="Terms of Service"
        content={fullTermsContent}
        onAgree={handleTermsAgreed}
      />
      
      <TermsModal
        isOpen={showTermsModal === 'privacy'}
        onClose={() => setShowTermsModal(null)}
        title="Privacy Policy"
        content={fullPrivacyContent}
        onAgree={handlePrivacyAgreed}
      />
    </>
  );
}