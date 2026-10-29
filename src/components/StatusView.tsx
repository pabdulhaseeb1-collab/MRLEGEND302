import React, { useState, useEffect } from 'react';
import {
  Compass,
  Plus,
  Eye,
  Trash2,
  Clock,
  Sparkles,
  Crown,
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
  Type,
  CheckCircle2,
} from 'lucide-react';
import { User, StatusItem } from '../types';
import { api } from '../utils/api';
import { sound } from '../utils/audio';

interface StatusViewProps {
  currentUser: User;
  onOpenPlans: () => void;
}

export const StatusView: React.FC<StatusViewProps> = ({ currentUser, onOpenPlans }) => {
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);

  // Create state
  const [statusType, setStatusType] = useState<'text' | 'image'>('text');
  const [textContent, setTextContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [selectedBg, setSelectedBg] = useState('from-purple-900 to-indigo-950');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isPremium = currentUser.membership === 'monthly' || currentUser.membership === 'lifetime';

  const bgGradients = [
    'from-purple-900 to-indigo-950',
    'from-amber-700 to-purple-950',
    'from-emerald-900 to-teal-950',
    'from-rose-900 to-purple-950',
    'from-blue-900 to-cyan-950',
  ];

  const loadStatuses = async () => {
    try {
      const res = await api.getStatuses();
      setStatuses(res.statuses);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadStatuses();
    const interval = setInterval(loadStatuses, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent.trim() && !mediaUrl) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await api.createStatus({
        type: statusType,
        text: textContent.trim(),
        content: textContent.trim(),
        bgColor: selectedBg,
        mediaUrl: statusType === 'image' ? mediaUrl : undefined,
      });

      sound.playTingTing();
      setCreateModalOpen(false);
      setTextContent('');
      setMediaUrl('');
      loadStatuses();
    } catch (err: any) {
      if (err.code === 'STATUS_LIMIT_REACHED') {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(err.message || 'Failed to post status.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStatus = async (statusId: string) => {
    if (!confirm('Are you sure you want to delete your status?')) return;
    try {
      await api.deleteStatus(statusId);
      sound.playTingTing();
      loadStatuses();
      if (activeStoryIdx !== null) setActiveStoryIdx(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete status');
    }
  };

  const handleOpenStory = (idx: number) => {
    sound.playButtonClick();
    setActiveStoryIdx(idx);
    const story = statuses[idx];
    if (story) {
      api.viewStatus(story.id).catch(() => {});
    }
  };

  const handleNextStory = () => {
    if (activeStoryIdx !== null && activeStoryIdx < statuses.length - 1) {
      handleOpenStory(activeStoryIdx + 1);
    } else {
      setActiveStoryIdx(null);
    }
  };

  const handlePrevStory = () => {
    if (activeStoryIdx !== null && activeStoryIdx > 0) {
      handleOpenStory(activeStoryIdx - 1);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        try {
          const res = await api.uploadFile(reader.result, file.name);
          setMediaUrl(res.url);
          setStatusType('image');
        } catch (err) {
          alert('Upload failed.');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const myStatuses = statuses.filter((s) => s.userId === currentUser.id);
  const otherStatuses = statuses.filter((s) => s.userId !== currentUser.id);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 rounded-3xl bg-[#110524]/80 border border-purple-500/30 backdrop-blur-md">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Cinzel'] flex items-center gap-2">
            <Compass className="w-6 h-6 text-amber-400" />
            24-Hour WhatsApp-Style Status Feed
          </h2>
          <p className="text-xs text-purple-300/70 mt-0.5">
            Statuses disappear after 24 hours. Free users can publish 1 status/24h. Premium VIP members can publish over 100 statuses.
          </p>
        </div>

        <button
          onClick={() => {
            sound.playButtonClick();
            setCreateModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-black flex items-center gap-2 hover:opacity-95 shadow-[0_0_20px_rgba(251,191,36,0.4)] transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Status</span>
        </button>
      </div>

      {/* Story Tray Avatars */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300/80 px-1">
          Recent Status Updates
        </h3>

        <div className="flex items-center gap-4 overflow-x-auto pb-3 pt-1">
          {/* Add My Status Button */}
          <div
            onClick={() => {
              sound.playButtonClick();
              setCreateModalOpen(true);
            }}
            className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group"
          >
            <div className="relative w-16 h-16 rounded-full p-[2px] border-2 border-dashed border-amber-400/80 flex items-center justify-center bg-purple-950/60 group-hover:scale-105 transition">
              <img
                src={currentUser.avatarUrl}
                alt="Me"
                className="w-full h-full object-cover rounded-full"
              />
              <span className="absolute bottom-0 right-0 p-1 rounded-full bg-amber-400 text-black shadow">
                <Plus className="w-3 h-3 font-bold" />
              </span>
            </div>
            <span className="text-[11px] font-semibold text-purple-200">My Status</span>
          </div>

          {/* List all statuses */}
          {statuses.map((stat, idx) => (
            <div
              key={stat.id}
              onClick={() => handleOpenStory(idx)}
              className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group"
            >
              <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-400 via-purple-500 to-indigo-500 shadow group-hover:scale-105 transition">
                <img
                  src={stat.user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={stat.user?.firstName || 'User'}
                  className="w-full h-full object-cover rounded-full border border-black"
                />
              </div>
              <span className="text-[11px] font-semibold text-purple-200 truncate max-w-[70px]">
                {stat.user?.id === currentUser.id ? 'You' : stat.user?.firstName || 'User'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Statuses Grid Showcase */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statuses.map((s, idx) => {
          const isMine = s.userId === currentUser.id;
          return (
            <div
              key={s.id}
              onClick={() => handleOpenStory(idx)}
              className={`relative overflow-hidden rounded-3xl p-5 min-h-[180px] flex flex-col justify-between cursor-pointer border border-purple-500/30 bg-gradient-to-br ${
                s.bgColor || 'from-purple-900 to-indigo-950'
              } shadow-lg hover:scale-[1.02] transition`}
            >
              {s.mediaUrl && (
                <img
                  src={s.mediaUrl}
                  alt="Story background"
                  className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
                />
              )}

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={s.user?.avatarUrl}
                    alt={s.user?.firstName}
                    className="w-8 h-8 rounded-full object-cover border border-amber-300"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">
                      {s.user?.firstName}
                    </h4>
                    <span className="text-[9px] text-purple-300/80 font-mono">
                      {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {isMine && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStatus(s.id);
                    }}
                    className="p-1.5 rounded-lg bg-black/40 text-rose-300 hover:text-rose-100"
                    title="Delete status"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="relative z-10 my-3">
                <p className="text-sm font-bold text-white drop-shadow line-clamp-3">
                  {s.content || s.text}
                </p>
              </div>

              <div className="relative z-10 flex items-center justify-between text-[10px] text-purple-200/90 font-mono">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-amber-300" />
                  {s.viewerIds?.length || 0} Viewers
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-purple-300" />
                  Expires in 24h
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Story Full Screen Modal */}
      {activeStoryIdx !== null && statuses[activeStoryIdx] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-2 sm:p-4">
          <div className="relative w-full max-w-md h-[80vh] max-h-[700px] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-6 bg-gradient-to-b from-purple-950 via-indigo-950 to-black border border-purple-500/40">
            {/* Story Top Progress Bar */}
            <div className="w-full flex items-center gap-1 mb-4">
              <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 w-full animate-pulse" />
              </div>
            </div>

            {/* Author Info & Close */}
            <div className="flex items-center justify-between text-white z-10">
              <div className="flex items-center gap-3">
                <img
                  src={statuses[activeStoryIdx].user?.avatarUrl}
                  alt="Author"
                  className="w-10 h-10 rounded-full object-cover border-2 border-amber-400"
                />
                <div>
                  <h4 className="text-xs font-bold">{statuses[activeStoryIdx].user?.firstName}</h4>
                  <span className="text-[10px] text-purple-300/80">
                    {new Date(statuses[activeStoryIdx].createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveStoryIdx(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Content View */}
            <div className="my-auto text-center p-4 z-10">
              {statuses[activeStoryIdx].mediaUrl && (
                <img
                  src={statuses[activeStoryIdx].mediaUrl}
                  alt="Status"
                  className="max-h-72 w-full object-contain rounded-2xl mb-4 shadow"
                />
              )}
              <p className="text-lg sm:text-xl font-bold text-white drop-shadow-md leading-relaxed">
                {statuses[activeStoryIdx].content || statuses[activeStoryIdx].text}
              </p>
            </div>

            {/* Bottom Nav arrows */}
            <div className="flex items-center justify-between text-white/80 z-10">
              <button
                onClick={handlePrevStory}
                disabled={activeStoryIdx === 0}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="text-xs font-mono text-purple-300">
                {activeStoryIdx + 1} of {statuses.length}
              </span>

              <button
                onClick={handleNextStory}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Status Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#130628] border border-purple-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-purple-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-5">
              <h3 className="text-xl font-black text-white font-['Cinzel']">
                Publish 24h Status
              </h3>
              <p className="text-xs text-purple-300/70 mt-1">
                Share text, thought, or photo with your network
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs">
                {errorMsg}
                {!isPremium && (
                  <button
                    onClick={() => {
                      setCreateModalOpen(false);
                      onOpenPlans();
                    }}
                    className="block text-amber-300 font-bold underline mt-1"
                  >
                    Upgrade to VIP for 100+ daily statuses
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleCreateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-purple-300 mb-1">
                  Status Message / Caption
                </label>
                <textarea
                  rows={3}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="What's happening? Type your status here..."
                  className="w-full bg-[#0a0314] border border-purple-800/60 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-purple-400/40 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Photo Upload Option */}
              <div>
                <label className="block text-xs font-bold text-purple-300 mb-1">
                  Optional Photo Attachment
                </label>
                <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-purple-700/60 hover:border-amber-400 text-purple-300 hover:text-white cursor-pointer bg-purple-950/30">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span className="text-xs">
                    {mediaUrl ? 'Photo Uploaded (Click to change)' : 'Upload Photo'}
                  </span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {/* Color Gradient Theme for Text Status */}
              <div>
                <label className="block text-xs font-bold text-purple-300 mb-1.5">
                  Card Background Theme
                </label>
                <div className="flex gap-2">
                  {bgGradients.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setSelectedBg(bg)}
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${bg} border-2 ${
                        selectedBg === bg ? 'border-amber-400 scale-110' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || (!textContent.trim() && !mediaUrl)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:opacity-95 text-white font-extrabold text-xs shadow-lg transition cursor-pointer disabled:opacity-40"
              >
                {submitting ? 'Publishing Status...' : 'Publish Status (24h Active)'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
