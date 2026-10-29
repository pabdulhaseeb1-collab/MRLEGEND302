import React, { useState } from 'react';
import { Volume2, VolumeX, X, Mic, Phone, Bell, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';

interface SoundSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SoundSettingsModal: React.FC<SoundSettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState(sound.getSettings());

  if (!isOpen) return null;

  const handleToggle = (key: 'master' | 'voice' | 'ui' | 'call') => {
    sound.playButtonClick();
    if (key === 'master') {
      const next = !settings.master;
      sound.setMaster(next);
      setSettings((s) => ({ ...s, master: next }));
    } else if (key === 'voice') {
      const next = !settings.voice;
      sound.setVoice(next);
      setSettings((s) => ({ ...s, voice: next }));
    } else if (key === 'ui') {
      const next = !settings.ui;
      sound.setUiSound(next);
      setSettings((s) => ({ ...s, ui: next }));
    } else if (key === 'call') {
      const next = !settings.call;
      sound.setCallSound(next);
      setSettings((s) => ({ ...s, call: next }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#120626] border border-purple-500/40 rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-purple-900/40">
          <div className="flex items-center gap-2 text-white">
            <Volume2 className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black font-['Cinzel']">Sound & Voice Settings</h3>
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

        <p className="text-xs text-purple-300/70">
          Manage Web Audio synthesized chimes and Web Speech Urdu announcements.
        </p>

        <div className="space-y-3">
          {/* Master Sound */}
          <div className="p-3.5 rounded-2xl bg-[#0a0314] border border-purple-800/40 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white">Master Sound Audio</h4>
              <p className="text-[10px] text-purple-400">Enable or disable all platform audio</p>
            </div>
            <button
              onClick={() => handleToggle('master')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                settings.master ? 'bg-amber-400 text-black' : 'bg-purple-950 text-purple-400'
              }`}
            >
              {settings.master ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Welcome Voice (Urdu Teen Sau Do) */}
          <div className="p-3.5 rounded-2xl bg-[#0a0314] border border-purple-800/40 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white">Speech Voice Announcements</h4>
              <p className="text-[10px] text-purple-400">Urdu "تین سو دو" and voice prompts</p>
            </div>
            <button
              onClick={() => handleToggle('voice')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                settings.voice ? 'bg-purple-600 text-white' : 'bg-purple-950 text-purple-400'
              }`}
            >
              {settings.voice ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* UI Chimes (Ting Ting) */}
          <div className="p-3.5 rounded-2xl bg-[#0a0314] border border-purple-800/40 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white">"Ting Ting" Chimes & Effects</h4>
              <p className="text-[10px] text-purple-400">Message send, click and fanfares</p>
            </div>
            <button
              onClick={() => handleToggle('ui')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                settings.ui ? 'bg-purple-600 text-white' : 'bg-purple-950 text-purple-400'
              }`}
            >
              {settings.ui ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Call Ringtone */}
          <div className="p-3.5 rounded-2xl bg-[#0a0314] border border-purple-800/40 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white">Call Ringtones</h4>
              <p className="text-[10px] text-purple-400">Incoming and outgoing call melodies</p>
            </div>
            <button
              onClick={() => handleToggle('call')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                settings.call ? 'bg-purple-600 text-white' : 'bg-purple-950 text-purple-400'
              }`}
            >
              {settings.call ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Audio Test button */}
        <button
          onClick={() => {
            sound.unlockAudio();
            sound.playTingTing();
          }}
          className="w-full py-2.5 rounded-xl bg-purple-950/80 border border-purple-700/50 text-purple-200 text-xs font-bold hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Test "Ting Ting" Chime Audio</span>
        </button>
      </div>
    </div>
  );
};
