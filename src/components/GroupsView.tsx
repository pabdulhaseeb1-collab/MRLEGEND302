import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Radio,
  Volume2,
  VolumeX,
  Crown,
  ShieldCheck,
  Check,
  X,
  MessageSquare,
  Lock,
  Sparkles,
  Play,
  Square,
  AlertCircle,
} from 'lucide-react';
import { User, Group } from '../types';
import { api } from '../utils/api';
import { sound } from '../utils/audio';

interface GroupsViewProps {
  currentUser: User;
  onOpenPlans: () => void;
}

export const GroupsView: React.FC<GroupsViewProps> = ({ currentUser, onOpenPlans }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupAvatar, setGroupAvatar] = useState(
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80'
  );
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isPremium = currentUser.membership === 'monthly' || currentUser.membership === 'lifetime';

  const loadGroups = async () => {
    try {
      const res = await api.getGroups();
      setGroups(res.groups);
      if (!selectedGroup && res.groups.length > 0) {
        setSelectedGroup(res.groups[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadGroups();
    const interval = setInterval(loadGroups, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPremium) {
      onOpenPlans();
      return;
    }
    if (!groupName.trim()) return;

    try {
      const res = await api.createGroup({
        name: groupName.trim(),
        description: groupDesc.trim(),
        avatarUrl: groupAvatar,
      });

      sound.playSuccessSound();
      setGroups((prev) => [...prev, res.group]);
      setSelectedGroup(res.group);
      setCreateModalOpen(false);
      setGroupName('');
      setGroupDesc('');
    } catch (err: any) {
      alert(err.message || 'Failed to create group');
    }
  };

  const handleJoinRequest = async (groupId: string) => {
    try {
      await api.joinGroup(groupId);
      sound.playTingTing();
      setFeedback('Join request submitted to group administrator!');
      setTimeout(() => setFeedback(null), 3000);
      loadGroups();
    } catch (err: any) {
      alert(err.message || 'Failed to join group');
    }
  };

  const handleToggleGroupAudio = async (active: boolean) => {
    if (!selectedGroup) return;
    try {
      await api.updateGroupAudio(selectedGroup.id, active, audioUrl);
      setIsPlayingAudio(active);
      sound.playTingTing();
      loadGroups();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle group audio broadcast');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-3xl bg-[#110524]/80 border border-purple-500/30 backdrop-blur-md">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Cinzel'] flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            MR LEGEND 302 Groups & Lounges
          </h2>
          <p className="text-xs text-purple-300/70 mt-0.5">
            Participate in VIP communities. Active Premium members can create custom groups and broadcast live audio streams.
          </p>
        </div>

        <button
          onClick={() => {
            sound.playButtonClick();
            if (!isPremium) {
              onOpenPlans();
            } else {
              setCreateModalOpen(true);
            }
          }}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-lg ${
            isPremium
              ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 text-white hover:opacity-90'
              : 'bg-purple-950/80 border border-amber-400/40 text-amber-300 hover:border-amber-300'
          }`}
        >
          {isPremium ? <Plus className="w-4 h-4" /> : <Crown className="w-4 h-4 text-amber-400" />}
          <span>{isPremium ? 'Create New Group' : 'Unlock Group Creation (VIP)'}</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main Grid: Groups List & Selected Group Details */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left: Groups List */}
        <div className="md:col-span-5 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-300/80 px-1">
            Available Communities ({groups.length})
          </h3>

          <div className="space-y-2">
            {groups.map((grp) => {
              const isSelected = selectedGroup?.id === grp.id;
              const isMember = grp.memberIds.includes(currentUser.id);
              const isPending = grp.pendingRequestIds.includes(currentUser.id);
              const isOwner = grp.ownerId === currentUser.id;

              return (
                <div
                  key={grp.id}
                  onClick={() => {
                    sound.playButtonClick();
                    setSelectedGroup(grp);
                  }}
                  className={`p-4 rounded-3xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                      : 'bg-[#0f0420]/70 border-purple-800/30 hover:border-purple-600/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={grp.avatarUrl}
                      alt={grp.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-purple-500/40"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {grp.name}
                        </h4>
                        {isOwner && (
                          <span className="bg-amber-400/20 text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-400/40">
                            OWNER
                          </span>
                        )}
                        {grp.audioStreamActive && (
                          <span className="flex items-center gap-1 bg-rose-500/20 text-rose-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-rose-500/40 animate-pulse">
                            <Radio className="w-2.5 h-2.5" /> LIVE AUDIO
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-purple-300/60 line-clamp-1 mt-0.5">
                        {grp.description || 'Exclusive MR Legend 302 community.'}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-purple-400/70 mt-1 font-mono">
                        <span>{grp.memberIds.length} Members</span>
                        <span>•</span>
                        <span>
                          {isMember ? 'Joined' : isPending ? 'Pending Approval' : 'Public'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Group Info & Live Audio Stream */}
        <div className="md:col-span-7">
          {selectedGroup ? (
            <div className="p-6 rounded-3xl bg-[#100524]/90 border border-purple-500/30 backdrop-blur-2xl space-y-5">
              <div className="flex items-start gap-4">
                <img
                  src={selectedGroup.avatarUrl}
                  alt={selectedGroup.name}
                  className="w-16 h-16 rounded-3xl object-cover border-2 border-amber-400/50 shadow"
                />
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-black text-white font-['Cinzel']">
                    {selectedGroup.name}
                  </h3>
                  <p className="text-xs text-purple-300/80 mt-1 leading-relaxed">
                    {selectedGroup.description}
                  </p>
                  <p className="text-[11px] font-mono text-amber-300/80 mt-1.5">
                    Total Active Members: {selectedGroup.memberIds.length}
                  </p>
                </div>
              </div>

              {/* Group Join / Status button */}
              <div>
                {!selectedGroup.memberIds.includes(currentUser.id) ? (
                  <button
                    onClick={() => handleJoinRequest(selectedGroup.id)}
                    disabled={selectedGroup.pendingRequestIds.includes(currentUser.id)}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs hover:opacity-95 shadow transition cursor-pointer disabled:opacity-50"
                  >
                    {selectedGroup.pendingRequestIds.includes(currentUser.id)
                      ? 'Join Request Pending Admin Approval'
                      : 'Request to Join Group'}
                  </button>
                ) : (
                  <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      You are an authorized member of this group
                    </span>
                    <span className="text-[10px] text-purple-400">Access Granted</span>
                  </div>
                )}
              </div>

              {/* Live Group Audio Streaming Feature (Section 9) */}
              <div className="p-4 rounded-2xl bg-[#0c0318] border border-purple-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className={`w-4 h-4 ${selectedGroup.audioStreamActive ? 'text-rose-400 animate-spin' : 'text-purple-400'}`} />
                    <span className="text-xs font-bold text-purple-200">
                      Group Audio Broadcast Room
                    </span>
                  </div>
                  {selectedGroup.audioStreamActive && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                      BROADCASTING NOW
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-purple-300/70">
                  When the group owner starts an audio stream, all members currently in this room can listen live.
                </p>

                {/* Owner Audio Controls */}
                {selectedGroup.ownerId === currentUser.id && (
                  <div className="space-y-2 pt-2 border-t border-purple-900/40">
                    <label className="block text-[10px] font-bold text-purple-300">
                      Audio Source URL (MP3 / Stream / Authorized Broadcast)
                    </label>
                    <input
                      type="text"
                      value={audioUrl}
                      onChange={(e) => setAudioUrl(e.target.value)}
                      placeholder="e.g. https://example.com/live_audio.mp3"
                      className="w-full bg-[#140628] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-amber-400"
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleGroupAudio(true)}
                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Start Audio Stream</span>
                      </button>
                      <button
                        onClick={() => handleToggleGroupAudio(false)}
                        className="flex-1 py-2 rounded-xl bg-rose-950/80 border border-rose-800/60 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5 fill-rose-300" />
                        <span>Stop Audio Stream</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Member Listen Status */}
                {selectedGroup.audioStreamActive && (
                  <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-700/50 flex items-center justify-between text-xs text-purple-200">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-amber-400 animate-bounce" />
                      <span>Live Audio Stream in Progress</span>
                    </div>
                    <button
                      onClick={() => {
                        sound.playTingTing();
                        setIsPlayingAudio(!isPlayingAudio);
                      }}
                      className="px-3 py-1 rounded-lg bg-amber-400 text-black text-[11px] font-bold cursor-pointer"
                    >
                      {isPlayingAudio ? 'Mute Audio' : 'Listen Live'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-purple-400/60 rounded-3xl bg-[#100524]/50 border border-purple-900/30">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-xs">Select a group to view details and audio streams.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal (Restricted to Premium Users) */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#130628] border border-purple-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-purple-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold mb-2">
                <Crown className="w-3.5 h-3.5" />
                VIP Group Creation
              </div>
              <h3 className="text-xl font-black text-white font-['Cinzel']">
                Create Exclusive Community
              </h3>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-purple-300 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. MR Legend Elite Traders"
                  className="w-full bg-[#0a0314] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="Describe your community rules and topics..."
                  className="w-full bg-[#0a0314] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:opacity-95 text-white font-extrabold text-xs shadow-lg transition cursor-pointer mt-2"
              >
                Create Group Now
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
