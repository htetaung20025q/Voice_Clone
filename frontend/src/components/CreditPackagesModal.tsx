import React, { useState, useEffect } from 'react';
import { X, Check, Zap, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';
import { VoiceStudioAPI } from '../services/api';
import type { CreditPackage } from '../services/api';
import { AuthService } from '../services/auth';
import type { Language } from '../services/i18n';
import { translations } from '../services/i18n';

interface CreditPackagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onRequireAuth?: () => void;
  onSuccess?: () => void;
}

export const CreditPackagesModal: React.FC<CreditPackagesModalProps> = ({
  isOpen,
  onClose,
  language,
  onRequireAuth,
  onSuccess,
}) => {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = translations[language].credits;

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMessage(null);
      setLoading(true);
      VoiceStudioAPI.getPackages()
        .then((pkgs) => setPackages(pkgs))
        .catch(() => {
          // Fallback static packages if offline
          setPackages([
            {
              id: 'starter',
              name: 'Starter',
              credits: 100,
              price_mmk: 5000,
              price_usd: 2.99,
              badge: 'Starter Pack',
              features: [
                '100 Credits (~100,000 characters)',
                '1 Credit per 1,000 Myanmar chars',
                'Unlocks All Premium Voice Personas',
                'Lossless 24kHz WAV Downloads'
              ],
              unlocks_premium: true
            },
            {
              id: 'creator',
              name: 'Creator',
              credits: 500,
              price_mmk: 20000,
              price_usd: 9.99,
              popular: true,
              badge: 'Most Popular',
              features: [
                '500 Credits (~500,000 characters)',
                '1 Credit per 1,000 Myanmar chars',
                'Unlocks All 16 Premium Voice Personas',
                'Football, Education & Entertainment',
                'Priority Synthesis Queue'
              ],
              unlocks_premium: true
            },
            {
              id: 'pro',
              name: 'Pro Studio',
              credits: 1500,
              price_mmk: 50000,
              price_usd: 24.99,
              badge: 'Best Value',
              features: [
                '1,500 Credits (~1,500,000 characters)',
                'Maximum value & lowest cost per credit',
                'Unlocks All Premium Voice Personas',
                'Commercial Broadcasting Rights',
                'Dedicated High-Speed Queue'
              ],
              unlocks_premium: true
            }
          ]);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePurchase = async (pkg: CreditPackage) => {
    const token = AuthService.getToken();
    if (!token) {
      if (onRequireAuth) {
        onClose();
        onRequireAuth();
      }
      return;
    }

    setProcessingId(pkg.id);
    setError(null);

    try {
      // 1. Checkout
      const checkoutRes = await VoiceStudioAPI.checkoutPackage(pkg.id, token);
      
      // 2. Server-side verification (instant sandbox / idempotent confirmation)
      const verifyRes = await VoiceStudioAPI.verifyPayment(checkoutRes.payment_reference, token);
      
      // 3. Update state
      AuthService.updateCredits(verifyRes.new_balance);
      await AuthService.refresh();
      
      setSuccessMessage(`${t.purchaseSuccess} (+${pkg.credits} Credits)`);
      if (onSuccess) onSuccess();
      
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Payment processing failed.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Bar */}
        <div className="h-1.5 w-full bg-shwe-ruby-line" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-10 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-200 text-amber-900 text-xs font-bold font-burmese shadow-2xs">
              <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>{t.freeCreditsTag}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 font-burmese tracking-tight">
              {t.packagesModalTitle}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 font-burmese">
              {t.packagesModalSubtitle}
            </p>
          </div>

          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold font-burmese text-center flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-burmese text-center">
              {error}
            </div>
          )}

          {/* Pricing Grid */}
          {loading ? (
            <div className="py-12 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-myanmar-red" />
              <span className="text-xs font-burmese">Loading packages...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {packages.map((pkg) => {
                const isPopular = !!pkg.popular;
                const isProcessing = processingId === pkg.id;

                return (
                  <div
                    key={pkg.id}
                    className={`relative rounded-2xl p-6 flex flex-col justify-between transition-all ${
                      isPopular
                        ? 'border-2 border-myanmar-red bg-gradient-to-b from-amber-50/40 via-white to-white shadow-lg shadow-myanmar-red/10 scale-[1.02]'
                        : 'border border-zinc-200 bg-white hover:border-zinc-300 shadow-xs'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-myanmar-red text-white text-[11px] font-bold font-burmese shadow-sm">
                        {pkg.badge || 'Most Popular'}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900 font-burmese">
                          {pkg.name}
                        </h3>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-3xl font-black text-zinc-900">
                            {pkg.credits.toLocaleString()}
                          </span>
                          <span className="text-xs font-bold text-zinc-500 font-burmese">
                            Credits
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-amber-700 font-burmese mt-1">
                          {pkg.price_mmk.toLocaleString()} MMK <span className="text-zinc-400">(${pkg.price_usd})</span>
                        </div>
                      </div>

                      <div className="h-px w-full bg-zinc-100" />

                      <ul className="space-y-2.5 text-xs text-zinc-600 font-burmese">
                        {pkg.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-6">
                      <button
                        type="button"
                        disabled={!!processingId}
                        onClick={() => handlePurchase(pkg)}
                        className={`w-full py-3 rounded-xl text-xs sm:text-sm font-bold font-burmese transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] ${
                          isPopular
                            ? 'bg-myanmar-red hover:bg-myanmar-red-hover text-white shadow-myanmar-red/20'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                        }`}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            <span>{t.paySimulateBtn}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Security & Guarantee Footer */}
          <div className="pt-2 text-center text-xs text-zinc-500 font-burmese flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
            <span>Server-side verified & Instant credit replenishment</span>
          </div>
        </div>
      </div>
    </div>
  );
};
