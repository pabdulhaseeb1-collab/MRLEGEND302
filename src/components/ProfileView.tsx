import React, { useState } from 'react';
import {
  Crown,
  User as UserIcon,
  Mail,
  Hash,
  AtSign,
  ShieldCheck,
  Clock,
  Sparkles,
  LogOut,
  Camera,
  MessageCircle,
} from 'lucide-react';
import { User } from '../types';
import { sound } from '../utils/audio';

interface ProfileViewProps {
  currentUser: User;
  onLogout: () => void;
  onOpenPlans: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onLogout,
  onOpenPlans,
}) => {
  const isPremium = currentUser.membership === 'monthly' || currentUser.membership === 'lifetime';

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Profile Card */}
      <div className="rounded-3xl bg-gradient-to-br from-[#16082c] via-[#0f0420] to-[#080210] border border-purple-500/30 p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.7)] text-center relative overflow-hidden">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.firstName}
            className="w-full h-full object-cover rounded-3xl border-2 border-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.4)]"
          />
          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-purple-600 text-white shadow">
            <Crown className="w-3.5 h-3.5 text-amber-300" />
          </div>
        </div>

        <h2 className="text-2xl font-black text-white font-['Outfit']">
          {currentUser.firstName}
        </h2>
        <p className="text-xs text-purple-300/70 font-mono mt-0.5">@{currentUser.username}</p>

        <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-amber-300 text-xs font-bold">
          <Crown className="w-4 h-4 text-amber-400" />
          <span className="uppercase">
            {currentUser.membership === 'lifetime'
              ? 'Royal VIP Lifetime'
              : currentUser.membership === 'monthly'
              ? 'Monthly VIP Member'
              : 'Free Account'}
          </span>
        </div>
      </div>

      {/* Account Details Information */}
      <div className="p-6 rounded-3xl bg-[#110524]/80 border border-purple-500/20 backdrop-blur-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">
          Account Credentials & Identity
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#0a0314] border border-purple-800/40 flex items-center justify-between">
            <span className="text-purple-400 flex items-center gap-2">
              <Hash className="w-4 h-4 text-amber-400" />
              Unique Numeric ID
            </span>
            <span className="font-mono font-bold text-white bg-purple-950 px-2 py-0.5 rounded">
              {currentUser.numericId}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0a0314] border border-purple-800/40 flex items-center justify-between">
            <span className="text-purple-400 flex items-center gap-2">
              <AtSign className="w-4 h-4 text-purple-400" />
              Username
            </span>
            <span className="font-mono text-purple-200">@{currentUser.username}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0a0314] border border-purple-800/40 flex items-center justify-between">
            <span className="text-purple-400 flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-400" />
              Registered Email
            </span>
            <span className="font-mono text-purple-200">{currentUser.email}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0a0314] border border-purple-800/40 flex items-center justify-between">
            <span className="text-purple-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              Member Since
            </span>
            <span className="font-mono text-purple-200">
              {new Date(currentUser.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Upgrade / WhatsApp Support actions */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          {!isPremium && (
            <button
              onClick={() => {
                sound.playButtonClick();
                onOpenPlans();
              }}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow cursor-pointer"
            >
              <Crown className="w-4 h-4" />
              <span>Upgrade to VIP (Remove All Limits)</span>
            </button>
          )}

          <a
            href="https://wa.me/923288516325"
            target="_blank"
            rel="noreferrer"
            className="flex-1 py-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-900/80 transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Official WhatsApp Support: 03288516325</span>
          </a>

          <button
            onClick={() => {
              sound.playButtonClick();
              onLogout();
            }}
            className="px-5 py-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-900/60 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
