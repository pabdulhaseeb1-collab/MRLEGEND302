import React, { useState } from 'react';
import { Search, X, User, Crown, MessageSquare, Phone, Video } from 'lucide-react';
import { User as UserType } from '../types';
import { api } from '../utils/api';
import { sound } from '../utils/audio';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: UserType) => void;
  onStartCall: (user: UserType, type: 'voice' | 'video') => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectUser,
  onStartCall,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await api.searchUsers(query.trim());
      setResults(res.users);
      if (res.users.length === 0) {
        sound.playUserNotFoundError();
      } else {
        sound.playTingTing();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#120626] border border-purple-500/40 rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-purple-900/40">
          <div className="flex items-center gap-2 text-white">
            <Search className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black font-['Cinzel']">Search MR LEGEND 302 Members</h3>
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

        <form onSubmit={handleSearch} className="my-4">
          <div className="relative">
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by exact Numeric ID (e.g. 2002) or username..."
              className="w-full bg-[#0a0314] border border-purple-800/60 rounded-2xl pl-10 pr-24 py-3 text-xs sm:text-sm text-white placeholder-purple-400/40 focus:outline-none focus:border-amber-400"
            />
            <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 top-2 bottom-2 px-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold flex items-center gap-1 hover:opacity-95 cursor-pointer disabled:opacity-40"
            >
              <span>{loading ? 'Searching...' : 'Search'}</span>
            </button>
          </div>
        </form>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {results.length > 0 ? (
            results.map((usr) => (
              <div
                key={usr.id}
                className="p-3.5 rounded-2xl bg-[#090214] border border-purple-800/40 flex items-center justify-between hover:border-purple-600/50 transition"
              >
                <div
                  onClick={() => {
                    sound.playButtonClick();
                    onSelectUser(usr);
                    onClose();
                  }}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                >
                  <img
                    src={usr.avatarUrl}
                    alt={usr.firstName}
                    className="w-11 h-11 rounded-xl object-cover border border-purple-500/40"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {usr.firstName}
                      </span>
                      <span className="text-[10px] font-mono text-amber-300 bg-purple-950 px-1.5 rounded">
                        #{usr.numericId}
                      </span>
                    </div>
                    <p className="text-[10px] text-purple-300/60 truncate">@{usr.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    onClick={() => {
                      sound.playButtonClick();
                      onSelectUser(usr);
                      onClose();
                    }}
                    className="p-2 rounded-xl bg-purple-950/80 border border-purple-700/50 text-purple-300 hover:text-white"
                    title="Open Chat"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      sound.playButtonClick();
                      onStartCall(usr, 'voice');
                      onClose();
                    }}
                    className="p-2 rounded-xl bg-purple-950/80 border border-purple-700/50 text-emerald-300 hover:text-white"
                    title="Voice Call"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      sound.playButtonClick();
                      onStartCall(usr, 'video');
                      onClose();
                    }}
                    className="p-2 rounded-xl bg-purple-950/80 border border-purple-700/50 text-cyan-300 hover:text-white"
                    title="Video Call"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : searched ? (
            <div className="text-center py-10 text-purple-400/60">
              <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No users found matching "{query}".</p>
              <p className="text-[10px] mt-0.5">Please check numeric ID or username spelling.</p>
            </div>
          ) : (
            <div className="text-center py-8 text-purple-400/50 text-xs">
              Search by exact user ID (e.g. 1001, 2002, 3003) or username to chat and call.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
