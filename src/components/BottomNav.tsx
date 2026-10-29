import React from 'react';
import { MessageSquare, Users, Compass, Download, Sparkles, User as UserIcon } from 'lucide-react';
import { sound } from '../utils/audio';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadChatsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  unreadChatsCount = 0,
}) => {
  const tabs = [
    { id: 'chats', label: 'Chats', icon: MessageSquare, badge: unreadChatsCount },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'status', label: 'Status', icon: Compass },
    { id: 'downloader', label: 'Downloader', icon: Download },
    { id: 'plans', label: 'VIP Plans', icon: Sparkles },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-2xl bg-[#090314]/90 border-t border-purple-900/40 pb-[env(safe-area-inset-bottom,8px)] px-2 pt-2">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sound.playButtonClick();
                setActiveTab(tab.id);
              }}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 relative cursor-pointer ${
                isActive ? 'text-amber-300 scale-105' : 'text-purple-300/60 hover:text-purple-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]' : ''}`} />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-black px-1 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium tracking-tight mt-1 ${isActive ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-0.5 shadow-[0_0_6px_#fbbf24]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
