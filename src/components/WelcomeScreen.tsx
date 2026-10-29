import React, { useState } from 'react';
import { Crown, Volume2, Sparkles, ArrowRight, ShieldCheck, UserPlus, LogIn, KeyRound } from 'lucide-react';
import { sound } from '../utils/audio';

interface WelcomeScreenProps {
  onEnterWithId: (id: string) => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenForgotPassword: () => void;
  onEnterDirectly: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onEnterWithId,
  onOpenLogin,
  onOpenRegister,
  onOpenForgotPassword,
  onEnterDirectly,
}) => {
  const [quickId, setQuickId] = useState('');
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  const handleVoicePlay = () => {
    sound.unlockAudio();
    setAudioUnlocked(true);
    setIsPlayingVoice(true);
    sound.playWelcomeVoice();
    setTimeout(() => setIsPlayingVoice(false), 3500);
  };

  const handleQuickEnter = (e: React.FormEvent) => {
    e.preventDefault();
    sound.unlockAudio();
    if (quickId.trim()) {
      onEnterWithId(quickId.trim());
    } else {
      onEnterDirectly();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-gradient-to-b from-[#080312] via-[#0f0521] to-[#06020a]">
      {/* Ambient background glow orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl mx-auto z-10 text-center flex flex-col items-center">
        {/* Animated Brand Emblem */}
        <div className="relative mb-6 group">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-amber-400 via-purple-600 to-indigo-600 p-[2px] shadow-[0_0_40px_rgba(168,85,247,0.5)] animate-pulse">
            <div className="w-full h-full bg-[#0d041c] rounded-3xl flex flex-col items-center justify-center relative overflow-hidden">
              <Crown className="w-12 h-12 text-amber-400 drop-shadow-[0_4px_12px_rgba(251,191,36,0.7)]" />
              <span className="text-[11px] font-black tracking-widest text-purple-300 font-['Cinzel'] mt-1">
                ROYAL
              </span>
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-amber-400/20 pointer-events-none" />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-amber-600 text-black text-xs font-black px-3 py-0.5 rounded-full shadow-lg border border-amber-200">
            302
          </div>
        </div>

        {/* Welcome Headings */}
        <div className="space-y-3 mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-semibold tracking-wider uppercase backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Official Luxury Platform
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-wide font-['Cinzel'] text-transparent bg-clip-text bg-gradient-to-r from-purple-100 via-purple-300 to-amber-300 drop-shadow-md">
            WELCOME TO MR LEGEND 302 WEBSITE
          </h1>

          {/* Urdu Pronunciation callout */}
          <p className="text-amber-300/90 font-['Noto_Nastaliq_Urdu'] text-base sm:text-lg tracking-normal">
            MR Legend <span className="font-bold text-amber-400 text-xl">تین سو دو</span> ویب سائٹ میں خوش آمدید
          </p>

          <p className="text-purple-300/80 text-xs sm:text-sm max-w-md mx-auto">
            Next-generation private messaging, crystal clear WebRTC voice/video calls, exclusive groups, 24h statuses, and social video downloader.
          </p>
        </div>

        {/* Welcoming Voice Button with Sound Unlock */}
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full px-4">
          <button
            onClick={handleVoicePlay}
            className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg cursor-pointer ${
              isPlayingVoice
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-[0_0_25px_rgba(251,191,36,0.8)] scale-105'
                : 'bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 hover:text-white hover:border-amber-400'
            }`}
          >
            <Volume2 className={`w-4 h-4 ${isPlayingVoice ? 'animate-bounce text-black' : 'text-amber-400'}`} />
            <span>
              {isPlayingVoice ? 'Speaking Welcome (تین سو دو)...' : 'Play Welcome Voice (Urdu 302)'}
            </span>
          </button>
        </div>

        {/* Enter ID Here Card */}
        <div className="w-full max-w-md backdrop-blur-2xl bg-[#120626]/80 p-6 rounded-3xl border border-purple-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.7)] space-y-4">
          <form onSubmit={handleQuickEnter} className="space-y-3">
            <label className="block text-left text-xs font-bold text-purple-300/90 uppercase tracking-wider">
              Enter Numeric ID or Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={quickId}
                onChange={(e) => setQuickId(e.target.value)}
                placeholder="e.g. 302 or username"
                className="w-full bg-[#0a0314]/90 border border-purple-700/50 rounded-2xl px-4 py-3.5 text-white placeholder-purple-400/40 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 hover:from-purple-500 hover:to-indigo-500 transition cursor-pointer"
              >
                <span>Enter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Create Account & Login Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => {
                sound.unlockAudio();
                sound.playButtonClick();
                onOpenRegister();
              }}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white text-xs font-bold flex items-center justify-center gap-2 hover:opacity-95 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-amber-300" />
              <span>Create Account</span>
            </button>

            <button
              onClick={() => {
                sound.unlockAudio();
                sound.playButtonClick();
                onOpenLogin();
              }}
              className="px-4 py-3 rounded-2xl bg-purple-950/70 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center justify-center gap-2 hover:bg-purple-900/80 hover:text-white transition cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-purple-300" />
              <span>Login</span>
            </button>
          </div>

          {/* Forgot Password */}
          <div className="pt-2 flex items-center justify-between text-xs text-purple-400/80 border-t border-purple-900/40">
            <button
              onClick={() => {
                sound.playButtonClick();
                onOpenForgotPassword();
              }}
              className="hover:text-amber-300 transition flex items-center gap-1 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400/80" />
              <span>Forgot Password?</span>
            </button>

            <button
              onClick={() => {
                sound.playButtonClick();
                onEnterDirectly();
              }}
              className="hover:text-purple-200 transition underline cursor-pointer"
            >
              Explore as Guest
            </button>
          </div>
        </div>

        {/* Luxury Footer note */}
        <div className="mt-8 text-center text-xs text-purple-400/60 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>This website created on MR Legend 302</span>
        </div>
      </div>
    </div>
  );
};
