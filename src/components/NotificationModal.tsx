import React, { useState, useEffect } from 'react';
import { Bell, X, Check, ShieldCheck, PhoneCall, Sparkles, MessageSquare, Radio } from 'lucide-react';
import { AppNotification } from '../types';
import { api } from '../utils/api';
import { sound } from '../utils/audio';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction?: (notif: AppNotification) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api
        .getNotifications()
        .then((res) => {
          setNotifications(res.notifications);
          api.markNotificationsRead().catch(() => {});
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#120626] border border-purple-500/40 rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-purple-900/40">
          <div className="flex items-center gap-2 text-white">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black font-['Cinzel']">Notifications</h3>
          </div>
          <button
            onClick={() => {
              sound.playButtonClick();
              onClose();
            }}
            className="p-1.5 rounded-xl text-purple-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-purple-400/60">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No notifications yet.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  sound.playButtonClick();
                  if (onSelectAction) onSelectAction(n);
                }}
                className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition ${
                  !n.read
                    ? 'bg-purple-950/60 border-amber-400/40 text-purple-100 shadow'
                    : 'bg-[#0a0314] border-purple-900/30 text-purple-300/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-amber-300">{n.title}</span>
                  <span className="text-[10px] text-purple-400/60 font-mono">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-purple-200/90">{n.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
