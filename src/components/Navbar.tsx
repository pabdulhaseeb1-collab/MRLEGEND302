import React, { useState } from 'react';
import {
  Crown,
  Volume2,
  VolumeX,
  Lock,
  Bell,
  MessageSquare,
  Users,
  Compass,
  Download,
  Sparkles,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { User } from '../types';
import { sound } from '../utils/audio';

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAdminModal: () => void;
  onOpenNotifications: () => void;
  onOpenSoundSettings: () => void;
  onLogout: () => void;
  unreadNotificationsCount?: number;
  remainingMessages?: number;
  broadcastActive?: boolean;
  onOpenBroadcast?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenAdminModal,
  onOpenNotifications,
  onOpenSoundSettings,
  onLogout,
  unreadNotificationsCount = 0,
  remainingMessages,
  broadcastActive = false,
  onOpenBroadcast,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(sound.getSettings().master);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setMaster(next);
    sound.playButtonClick();
  };

  const navItems = [
    { id: 'chats', label: 'Chats', icon: MessageSquare },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'status', label: 'Status', icon: Compass },
    { id: 'downloader', label: 'Downloader', icon: Download },
    { id: 'plans', label: 'Buy Plans', icon: Sparkles },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#090314]/80 border-b border-purple-900/30 shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
      {/* Royal Admin Audio Broadcast Banner if active */}
      {broadcastActive && (
        <div
          onClick={onOpenBroadcast}
          className="bg-gradient-to-r from-amber-600 via-purple-600 to-indigo-600 px-4 py-1.5 text-xs font-semibold text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg animate-pulse"
        >
          <Radio className="w-3.5 h-3.5 animate-spin text-amber-200" />
          <span>ROYAL AUDIO BROADCAST LIVE: Administrator is streaming an audio message to VIP members</span>
          <span className="underline ml-1">Tune In</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
        {/* Brand Logo / Emblem */}
        <div
          onClick={() => {
            sound.playButtonClick();
            setActiveTab('dashboard');
          }}
          className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group select-none"
        >
          <div className="relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-amber-500 p-[1.5px] shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:shadow-[0_0_30px_rgba(168,85,247,0.7)] transition-all duration-300">
              <div className="w-full h-full bg-[#0a0416] rounded-xl flex items-center justify-center relative overflow-hidden">
                <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.6)]" />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 to-transparent pointer-events-none" />
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-amber-600 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full border border-amber-300/40 shadow-sm">
              302
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-xl font-extrabold tracking-wider bg-gradient-to-r from-purple-200 via-purple-300 to-amber-300 bg-clip-text text-transparent font-['Cinzel']">
                MR LEGEND
              </h1>
              <span className="text-xs sm:text-sm font-black px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30">
                302
              </span>
            </div>
            <p className="text-[10px] text-purple-400/70 font-medium tracking-widest hidden sm:block">
              LUXURY SOCIAL PLATFORM
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-purple-950/40 p-1.5 rounded-2xl border border-purple-800/30 backdrop-blur-md">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sound.playButtonClick();
                  setActiveTab(item.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_16px_rgba(168,85,247,0.4)]'
                    : 'text-purple-300/80 hover:text-white hover:bg-purple-900/30'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-purple-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Icons & User Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser && (
            <>
              {/* Membership Status Badge */}
              <div
                onClick={() => {
                  sound.playButtonClick();
                  setActiveTab('plans');
                }}
                className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all ${
                  currentUser.membership === 'lifetime'
                    ? 'bg-gradient-to-r from-amber-500/20 to-yellow-600/20 border border-amber-400/40 text-amber-300 hover:border-amber-300'
                    : currentUser.membership === 'monthly'
                    ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-400/40 text-purple-300 hover:border-purple-300'
                    : 'bg-slate-800/60 border border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                <Crown
                  className={`w-3.5 h-3.5 ${
                    currentUser.membership !== 'free' ? 'text-amber-400' : 'text-slate-400'
                  }`}
                />
                <span className="capitalize">
                  {currentUser.membership === 'lifetime'
                    ? 'Royal VIP'
                    : currentUser.membership === 'monthly'
                    ? 'Monthly VIP'
                    : `Free (${remainingMessages !== undefined ? `${remainingMessages} msg left` : '10 msg/day'})`}
                </span>
              </div>

              {/* Notifications Button */}
              <button
                onClick={() => {
                  sound.playButtonClick();
                  onOpenNotifications();
                }}
                className="relative p-2 rounded-xl bg-purple-950/40 border border-purple-800/30 text-purple-300 hover:text-white hover:bg-purple-900/50 transition cursor-pointer"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>
            </>
          )}

          {/* Sound Toggle Button */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              soundEnabled
                ? 'bg-purple-950/40 border-purple-700/40 text-purple-300 hover:text-white'
                : 'bg-red-950/30 border-red-800/40 text-red-400 hover:text-red-300'
            }`}
            title={soundEnabled ? 'Sound is Enabled (Click to Mute)' : 'Sound is Muted (Click to Unmute)'}
            aria-label="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Elegant 🔒 Admin Lock Icon */}
          <button
            onClick={() => {
              sound.playButtonClick();
              onOpenAdminModal();
            }}
            className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500/15 via-purple-600/20 to-amber-500/15 border border-amber-400/40 text-amber-300 hover:border-amber-300 hover:shadow-[0_0_18px_rgba(251,191,36,0.5)] transition duration-200 cursor-pointer flex items-center gap-1.5"
            title="Administrator Control Center (Secret Key Protected)"
            aria-label="Admin Access Lock"
          >
            <Lock className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-300" />
            <span className="text-[11px] font-bold tracking-wider hidden xl:inline text-amber-200">
              ADMIN
            </span>
          </button>

          {/* Logout / User Avatar */}
          {currentUser && (
            <button
              onClick={() => {
                sound.playButtonClick();
                onLogout();
              }}
              className="p-2 rounded-xl bg-purple-950/40 border border-purple-800/30 text-rose-300/80 hover:text-rose-200 hover:bg-rose-950/30 transition cursor-pointer"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
