import React, { useState } from 'react';
import { X, MessageCircle, ShieldAlert, KeyRound, CheckCircle2, Copy } from 'lucide-react';
import { sound } from '../utils/audio';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const rawMessage = `Assalam-o-Alaikum MR Legend 302.

I need assistance recovering access to my MR Legend 302 website account.

My Username/ID: ${identifier.trim() || '[Enter your username or ID]'}

My Registered Email: ${email.trim() || '[Enter your registered email]'}

Please guide me through the account verification and password reset process.

Thank you.`;

  const whatsappUrl = `https://wa.me/923288516325?text=${encodeURIComponent(rawMessage)}`;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(rawMessage);
    setCopied(true);
    sound.playTingTing();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    sound.playButtonClick();
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#120626] border border-purple-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
        <button
          onClick={() => {
            sound.playButtonClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-xl text-purple-400 hover:text-white bg-purple-950/40 hover:bg-purple-900/50 transition cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-300">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white font-['Cinzel']">
            Password Recovery
          </h2>
          <p className="text-xs text-purple-300/70 mt-1">
            Official Account Verification & Support Desk
          </p>
        </div>

        {/* Security Notice & Fee */}
        <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200/90 text-xs space-y-2 mb-4">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Encrypted Account Security Protocol</span>
          </div>
          <p className="text-[11px] leading-relaxed text-purple-200/80">
            Passwords are encrypted using irreversible cryptographic hashing and are never stored in readable form.
            To protect users against unauthorized takeovers, identity ownership must be confirmed by the platform administrator.
          </p>
          <div className="pt-1.5 border-t border-amber-500/20 flex items-center justify-between text-xs font-bold">
            <span className="text-purple-300">Administrative Recovery Fee:</span>
            <span className="text-amber-400 font-extrabold text-sm">Rs. 300</span>
          </div>
          <p className="text-[10px] text-amber-400/70 italic">
            *Subject to confirmation by the administrator after ownership review.
          </p>
        </div>

        {/* User Input details */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-[11px] font-bold text-purple-300 mb-1">
              Your Username or Numeric ID
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. 302 or legend302"
              className="w-full bg-[#0a0314] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-purple-300 mb-1">
              Your Registered Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@example.com"
              className="w-full bg-[#0a0314] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* WhatsApp Official Support Button */}
        <div className="space-y-2.5">
          <button
            onClick={handleOpenWhatsApp}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 fill-white text-emerald-600" />
            <span>Open WhatsApp Support (03288516325)</span>
          </button>

          <button
            onClick={handleCopyMessage}
            className="w-full py-2.5 rounded-xl bg-purple-950/60 border border-purple-800/40 text-purple-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Prefilled Message Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Prefilled Message</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
