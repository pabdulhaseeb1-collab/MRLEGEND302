import React, { useState, useEffect } from 'react';
import {
  Crown,
  Sparkles,
  Check,
  MessageCircle,
  Key,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
  Flame,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { User } from '../types';
import { api } from '../utils/api';
import { sound } from '../utils/audio';
import { formatPKR } from '../utils/rules';

interface BuyPlansViewProps {
  currentUser: User;
  onPlanActivated: (user: User, usage: any) => void;
}

export const BuyPlansView: React.FC<BuyPlansViewProps> = ({ currentUser, onPlanActivated }) => {
  const [plansData, setPlansData] = useState<any>(null);
  const [inputKey, setInputKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<'monthly' | 'lifetime'>('monthly');

  useEffect(() => {
    api.getPlans().then(setPlansData).catch(console.error);
  }, []);

  const monthlyPrice = plansData?.plans?.find((p: any) => p.id === 'monthly')?.price || 500;
  const lifetimePrice = plansData?.plans?.find((p: any) => p.id === 'lifetime')?.price || 2500;

  const handleContactAdmin = (planName: string) => {
    sound.playButtonClick();
    const msg = `Assalam-o-Alaikum MR Legend 302!

I would like to purchase a Premium Activation Key for the MR Legend 302 website.

My Username: ${currentUser.username}

My Registered Email: ${currentUser.email}

Selected Plan: ${planName}

Please share your payment details. After payment confirmation, kindly generate my Premium Activation Key.

Thank you!`;

    const url = `https://wa.me/923288516325?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleActivateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    setActivating(true);
    setActivationError(null);
    setActivationSuccess(null);

    try {
      const res = await api.activateKey(inputKey.trim());
      sound.playPremiumActivation();
      setActivationSuccess(res.message); // "Welcome to MR Legend 302 Premium Version!"
      setInputKey('');
      onPlanActivated(res.user, res.usage);
    } catch (err: any) {
      sound.playIncorrectPasswordError();
      setActivationError(err.message || 'Key activation failed. Please check your key.');
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-8">
      {/* Top Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-purple-600/20 to-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
          <Crown className="w-4 h-4 text-amber-400" />
          MR LEGEND 302 ROYAL MEMBERSHIP
        </div>

        <h2 className="text-3xl sm:text-5xl font-black text-white font-['Cinzel'] tracking-wide">
          Upgrade to VIP Elite
        </h2>

        <p className="text-xs sm:text-sm text-purple-300/80 max-w-xl mx-auto leading-relaxed">
          Unlock unlimited private messaging, infinite voice/video calling sessions, custom group creation, 100+ daily statuses, and high-speed watermark-free video downloads.
        </p>
      </div>

      {/* Activation Success Dialog / Banner */}
      {activationSuccess && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/20 via-purple-900/40 to-amber-500/20 border-2 border-amber-400 text-center space-y-2 shadow-[0_0_35px_rgba(251,191,36,0.5)] animate-bounce">
          <Crown className="w-8 h-8 text-amber-400 mx-auto" />
          <h3 className="text-lg font-black text-amber-300 font-['Cinzel']">
            {activationSuccess}
          </h3>
          <p className="text-xs text-purple-200">
            All premium restrictions have been lifted from your account!
          </p>
        </div>
      )}

      {/* Enter Premium Key Card */}
      <div className="max-w-xl mx-auto p-6 sm:p-7 rounded-3xl bg-[#120626]/90 border border-purple-500/40 shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-white">
              Have an Activation Key?
            </h3>
            <p className="text-[11px] text-purple-300/70">
              Enter your cryptographically validated server key to unlock instant VIP status.
            </p>
          </div>
        </div>

        {activationError && (
          <div className="mb-3 p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{activationError}</span>
          </div>
        )}

        <form onSubmit={handleActivateKey} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="e.g. MRL-302-GOLD-LUCK or MRL-302-LIFE-VIP1"
              className="w-full bg-[#0a0314] border border-purple-800/60 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white font-mono placeholder-purple-400/40 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
          </div>

          <button
            type="submit"
            disabled={activating || !inputKey.trim()}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:opacity-95 text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(251,191,36,0.5)] transition cursor-pointer disabled:opacity-40"
          >
            <Sparkles className="w-4 h-4" />
            <span>{activating ? 'Validating Key with Server...' : 'Activate Premium Membership'}</span>
          </button>
        </form>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plan 1: Monthly Premium */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-[#16082c] via-[#100420] to-[#080210] border border-purple-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.7)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-950/80 px-3 py-1 rounded-full border border-purple-700/40">
                Monthly Pass
              </span>
              <span className="text-xs font-mono text-purple-400">30 Days Duration</span>
            </div>

            <h3 className="text-2xl font-black text-white font-['Cinzel']">
              Monthly Premium
            </h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-mono">
                {formatPKR(monthlyPrice)}
              </span>
              <span className="text-xs text-purple-400">/ 30 days</span>
            </div>

            <ul className="mt-6 space-y-3 text-xs text-purple-200">
              {[
                'Unlimited text messaging (no 10 msg/day limit)',
                'Unlimited eligible photo and video file sharing',
                'Unlimited voice and video call duration (no 1-min limit)',
                'Permission to create & manage your own groups',
                'Publish more than 100 daily 24h statuses',
                'Unlimited supported social video downloads',
                'VIP Gold Crown emblem badge on profile',
                'Exclusive access to Royal Audio broadcasts',
              ].map((feat, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-purple-900/40">
            <button
              onClick={() => handleContactAdmin('Monthly Premium')}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:opacity-95 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Contact Admin to Buy Key (03288516325)</span>
            </button>
          </div>
        </div>

        {/* Plan 2: Lifetime Premium (Recommended) */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-[#210c40] via-[#15062c] to-[#0a0316] border-2 border-amber-400/60 shadow-[0_15px_50px_rgba(251,191,36,0.3)] flex flex-col justify-between">
          <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-amber-400 to-amber-600 text-black text-[10px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
            Best Value • Never Expires
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-400/40 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                Royal VIP Lifetime
              </span>
              <span className="text-xs font-mono text-amber-300">Lifetime Validity</span>
            </div>

            <h3 className="text-2xl font-black text-white font-['Cinzel']">
              Lifetime Premium
            </h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-amber-300 font-mono">
                {formatPKR(lifetimePrice)}
              </span>
              <span className="text-xs text-amber-300/80">/ one-time</span>
            </div>

            <ul className="mt-6 space-y-3 text-xs text-purple-100">
              {[
                'Permanent membership — never expires automatically',
                'All Monthly Premium benefits forever',
                'Highest priority download processing (1080p & HDR)',
                'Host unlimited group audio rooms for community',
                'Exclusive Royal VIP badge & animated luxury crown',
                'Direct administrator VIP support line',
                'Zero ads or limits on messages, calls, and statuses',
              ].map((feat, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="font-medium">{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-purple-900/40">
            <button
              onClick={() => handleContactAdmin('Lifetime Premium')}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:opacity-95 text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(251,191,36,0.6)] transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-black" />
              <span>Contact Admin for Lifetime Key</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
