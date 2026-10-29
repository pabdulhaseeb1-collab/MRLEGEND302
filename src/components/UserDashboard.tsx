import React, { useState } from 'react';
import {
  Crown,
  Sparkles,
  MessageSquare,
  Users,
  Compass,
  Download,
  Search,
  Clock,
  Send,
  PhoneCall,
  Video,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  Activity,
  Flame,
} from 'lucide-react';
import { User } from '../types';
import { sound } from '../utils/audio';
import { getTimeUntilReset } from '../utils/rules';

interface UserDashboardProps {
  user: User;
  usage: any;
  setActiveTab: (tab: string) => void;
  onOpenSearch: () => void;
  onStartCallWithId?: (userId: string, type: 'voice' | 'video') => void;
  onOpenConversationWith?: (user: User) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  user,
  usage,
  setActiveTab,
  onOpenSearch,
}) => {
  const isPremium = user.membership === 'monthly' || user.membership === 'lifetime';
  const resetCountdown = getTimeUntilReset();

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto px-3 sm:px-6 pt-4">
      {/* 1. Royal Profile Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#16082c] via-[#100420] to-[#080210] border border-purple-500/30 p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Avatar with status indicator */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl p-[2px] bg-gradient-to-tr from-amber-400 via-purple-500 to-indigo-500 shadow-[0_0_25px_rgba(168,85,247,0.4)]">
                <img
                  src={user.avatarUrl}
                  alt={user.firstName}
                  className="w-full h-full object-cover rounded-3xl bg-[#090214]"
                />
              </div>
              <span
                className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#090214] shadow-[0_0_8px_#10b981]"
                title="Online"
              />
            </div>

            {/* User credentials */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                  {user.firstName}
                </h2>
                <div
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                    user.membership === 'lifetime'
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50'
                      : user.membership === 'monthly'
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-400/50'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>
                    {user.membership === 'lifetime'
                      ? 'Royal VIP Lifetime'
                      : user.membership === 'monthly'
                      ? 'VIP Monthly'
                      : 'Free Member'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-purple-300/80 font-mono">
                <span>@{user.username}</span>
                <span className="text-purple-600">•</span>
                <span className="bg-purple-950/70 px-2 py-0.5 rounded border border-purple-800/40 text-amber-300 font-bold">
                  ID: {user.numericId}
                </span>
              </div>

              {/* Membership Expiry Info */}
              {user.membership === 'monthly' && user.membershipExpiresAt && (
                <p className="text-[11px] text-amber-300/80 flex items-center gap-1 pt-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Expires on: {new Date(user.membershipExpiresAt).toLocaleDateString()}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Quick Upgrade / Search Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => {
                sound.playButtonClick();
                onOpenSearch();
              }}
              className="flex-1 md:flex-none px-4 py-3 rounded-2xl bg-purple-950/60 border border-purple-700/40 hover:bg-purple-900/60 text-purple-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Search className="w-4 h-4 text-purple-300" />
              <span>Search User</span>
            </button>

            {!isPremium ? (
              <button
                onClick={() => {
                  sound.playButtonClick();
                  setActiveTab('plans');
                }}
                className="flex-1 md:flex-none px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black text-xs font-black flex items-center justify-center gap-2 hover:opacity-95 shadow-[0_0_20px_rgba(251,191,36,0.5)] transition cursor-pointer"
              >
                <Crown className="w-4 h-4" />
                <span>Upgrade to VIP</span>
              </button>
            ) : (
              <div className="px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Unlimited VIP Privileges Active</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Daily Limits & Usage Meters (Rolling 24-Hour Period) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Messages Meter */}
        <div className="p-5 rounded-3xl bg-[#110524]/80 border border-purple-500/20 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between text-xs text-purple-300/80">
            <span className="font-bold flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              Messages Sent Today
            </span>
            <span className="text-[10px] text-purple-400">Resets: {resetCountdown}</span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-white font-mono">
              {usage?.messagesUsed || 0}
              {!isPremium && <span className="text-sm text-purple-400/70 font-normal"> / 10</span>}
            </div>
            <span
              className={`text-xs font-bold ${
                isPremium || (usage?.messagesRemaining || 0) > 2 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {isPremium ? 'Unlimited' : `${usage?.messagesRemaining || 0} left`}
            </span>
          </div>

          {/* Progress bar */}
          {!isPremium && (
            <div className="w-full h-2 bg-purple-950 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  (usage?.messagesUsed || 0) >= 10 ? 'bg-rose-500' : 'bg-gradient-to-r from-purple-500 to-amber-400'
                }`}
                style={{ width: `${Math.min(100, ((usage?.messagesUsed || 0) / 10) * 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Video Downloads Meter */}
        <div className="p-5 rounded-3xl bg-[#110524]/80 border border-purple-500/20 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between text-xs text-purple-300/80">
            <span className="font-bold flex items-center gap-1.5">
              <Download className="w-4 h-4 text-cyan-400" />
              Social Video Downloads
            </span>
            <span className="text-[10px] text-cyan-400">Daily Cap</span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-white font-mono">
              {usage?.downloadsUsed || 0}
              {!isPremium && <span className="text-sm text-purple-400/70 font-normal"> / 2</span>}
            </div>
            <span
              className={`text-xs font-bold ${
                isPremium || (usage?.downloadsRemaining || 0) > 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPremium ? 'Unlimited' : `${usage?.downloadsRemaining || 0} left`}
            </span>
          </div>

          {!isPremium && (
            <div className="w-full h-2 bg-purple-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                style={{ width: `${Math.min(100, ((usage?.downloadsUsed || 0) / 2) * 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Call Duration Cap */}
        <div className="p-5 rounded-3xl bg-[#110524]/80 border border-purple-500/20 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between text-xs text-purple-300/80">
            <span className="font-bold flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              Call Session Limit
            </span>
            <span className="text-[10px] text-emerald-400">WebRTC</span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-white font-mono">
              {isPremium ? 'Unlimited' : '1 Min'}
            </div>
            <span className="text-xs font-bold text-purple-300">
              {isPremium ? 'Crystal Audio/Video' : 'Free Cap'}
            </span>
          </div>

          <p className="text-[10px] text-purple-400/70">
            {isPremium
              ? 'Enjoy endless high definition voice & video calls.'
              : 'Upgrade to VIP for unlimited calling with no 1-minute cutoffs.'}
          </p>
        </div>

        {/* 24h Status Meter */}
        <div className="p-5 rounded-3xl bg-[#110524]/80 border border-purple-500/20 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between text-xs text-purple-300/80">
            <span className="font-bold flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-400" />
              Daily Statuses
            </span>
            <span className="text-[10px] text-amber-400">24h Lifetime</span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-white font-mono">
              {usage?.statusUsed || 0}
              {!isPremium && <span className="text-sm text-purple-400/70 font-normal"> / 1</span>}
            </div>
            <span className="text-xs font-bold text-amber-300">
              {isPremium ? '100+ Allowed' : `${usage?.statusRemaining || 0} left`}
            </span>
          </div>

          <p className="text-[10px] text-purple-400/70">
            Auto-expires 24 hours after publication.
          </p>
        </div>
      </div>

      {/* 3. Quick Action Hub */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-purple-300 font-['Cinzel'] flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400" />
          Quick Navigation Hub
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { id: 'chats', title: 'Private Chats', desc: 'Secure direct messaging', icon: MessageSquare, color: 'from-purple-600 to-indigo-600' },
            { id: 'groups', title: 'Group Lounge', desc: 'Communities & audio rooms', icon: Users, color: 'from-indigo-600 to-blue-600' },
            { id: 'status', title: 'Status Feed', desc: 'WhatsApp-style 24h feed', icon: Compass, color: 'from-emerald-600 to-teal-600' },
            { id: 'downloader', title: 'Video Saver', desc: 'Insta, TikTok, YouTube, Snap', icon: Download, color: 'from-cyan-600 to-blue-600' },
            { id: 'plans', title: 'VIP Plans', desc: 'Monthly & Lifetime keys', icon: Sparkles, color: 'from-amber-500 to-yellow-600' },
            { id: 'profile', title: 'My Profile', desc: 'Account credentials & ID', icon: Crown, color: 'from-pink-600 to-purple-600' },
          ].map((act) => {
            const Icon = act.icon;
            return (
              <div
                key={act.id}
                onClick={() => {
                  sound.playButtonClick();
                  setActiveTab(act.id);
                }}
                className="group p-4 rounded-3xl bg-[#100524]/70 border border-purple-500/20 hover:border-purple-400/60 hover:bg-purple-950/40 transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${act.color} flex items-center justify-center text-white mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                    {act.title}
                  </h4>
                  <p className="text-[10px] text-purple-300/60 mt-0.5 line-clamp-1">
                    {act.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
