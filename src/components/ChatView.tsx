import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MessageSquare,
  Send,
  Image,
  Paperclip,
  Phone,
  Video,
  Clock,
  Check,
  CheckCheck,
  Crown,
  Sparkles,
  AlertCircle,
  X,
  FileText,
} from 'lucide-react';
import { User, Conversation, Message } from '../types';
import { api } from '../utils/api';
import { sound } from '../utils/audio';
import { getTimeUntilReset } from '../utils/rules';

interface ChatViewProps {
  currentUser: User;
  onStartCall: (targetUser: User, type: 'voice' | 'video') => void;
  onOpenPlans: () => void;
  initialSelectedUser?: User | null;
  onUsageUpdated?: (usage: any) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  currentUser,
  onStartCall,
  onOpenPlans,
  initialSelectedUser = null,
  onUsageUpdated,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);

  // Attachment state
  const [attachment, setAttachment] = useState<{ url: string; type: 'image' | 'video' | 'file'; fileName: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isPremium = currentUser.membership === 'monthly' || currentUser.membership === 'lifetime';

  // Load conversations
  const loadConversations = async () => {
    try {
      const res = await api.getConversations();
      setConversations(res.conversations);

      if (!activeConv && res.conversations.length > 0) {
        selectConversation(res.conversations[0]);
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle initialSelectedUser
  useEffect(() => {
    if (initialSelectedUser) {
      handleOpenWithUser(initialSelectedUser);
    }
  }, [initialSelectedUser]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConv) return;
    const fetchMsgs = async () => {
      try {
        const res = await api.getMessages(activeConv.id);
        setMessages(res.messages);
        scrollToBottom();
      } catch (err) {
        console.error('Failed to fetch messages', err);
      }
    };
    fetchMsgs();
    const interval = setInterval(fetchMsgs, 3000);
    return () => clearInterval(interval);
  }, [activeConv?.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const selectConversation = (conv: Conversation) => {
    sound.playButtonClick();
    setActiveConv(conv);
    setSearchResults([]);
    setSearchQuery('');
  };

  // Search users by exact ID or username
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await api.searchUsers(searchQuery.trim());
      setSearchResults(res.users);
      if (res.users.length === 0) {
        sound.playUserNotFoundError();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  // Open conversation with selected user
  const handleOpenWithUser = async (targetUser: User) => {
    try {
      const res = await api.openConversation(targetUser.id);
      setActiveConv(res.conversation);
      setSearchResults([]);
      setSearchQuery('');
      loadConversations();
    } catch (err) {
      console.error(err);
    }
  };

  // File / Image Attachment handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Attachment size cannot exceed 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        try {
          const res = await api.uploadFile(reader.result, file.name);
          const type: 'image' | 'video' | 'file' = file.type.startsWith('image/')
            ? 'image'
            : file.type.startsWith('video/')
            ? 'video'
            : 'file';

          setAttachment({
            url: res.url,
            type,
            fileName: file.name,
          });
          sound.playTingTing();
        } catch (err) {
          console.error(err);
          alert('Upload failed.');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv) return;
    if (!messageInput.trim() && !attachment) return;

    setSending(true);
    setLimitError(null);

    try {
      const res = await api.sendMessage(activeConv.id, {
        text: messageInput.trim(),
        mediaUrl: attachment?.url,
        mediaType: attachment?.type,
        fileName: attachment?.fileName,
      });

      // Play "Ting Ting" message send sound
      sound.playTingTing();

      setMessages((prev) => [...prev, res.message]);
      setMessageInput('');
      setAttachment(null);
      scrollToBottom();

      if (onUsageUpdated && res.usage) {
        onUsageUpdated(res.usage);
      }
    } catch (err: any) {
      if (err.code === 'MESSAGE_LIMIT_REACHED') {
        setLimitError(err.message);
        setUpgradeModalOpen(true);
        sound.playUserNotFoundError();
      } else {
        alert(err.message || 'Failed to send message.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 h-[calc(100vh-140px)] flex flex-col">
      {/* 10 Messages Limit Bar for Free Accounts */}
      {!isPremium && (
        <div className="mb-3 px-4 py-2.5 rounded-2xl bg-purple-950/50 border border-purple-800/40 backdrop-blur-md flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-purple-200">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>
              Free Account Limit: Max 10 messages per 24 hours. Resets in{' '}
              <strong className="text-amber-300">{getTimeUntilReset()}</strong>.
            </span>
          </div>
          <button
            onClick={() => {
              sound.playButtonClick();
              onOpenPlans();
            }}
            className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-black text-[11px] font-extrabold hover:opacity-90 flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Get Unlimited</span>
          </button>
        </div>
      )}

      {/* Main Chat Grid (Sidebar + Active Conversation) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 rounded-3xl overflow-hidden border border-purple-500/30 bg-[#0e041c]/90 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
        {/* Left Column: Conversations List & Search (Hidden on mobile if conversation open) */}
        <div
          className={`md:col-span-4 border-r border-purple-900/40 flex flex-col ${
            activeConv ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* User Search Bar */}
          <div className="p-3.5 border-b border-purple-900/30 bg-[#0a0314]/60">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user by exact ID or username..."
                className="w-full bg-[#140628] border border-purple-800/50 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-amber-400"
              />
              <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>

          {/* Search Results Display */}
          {searchResults.length > 0 && (
            <div className="p-2 border-b border-purple-900/40 bg-purple-950/40">
              <p className="text-[10px] uppercase font-bold text-amber-300 px-2 py-1">
                Found Users ({searchResults.length})
              </p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {searchResults.map((usr) => (
                  <div
                    key={usr.id}
                    onClick={() => handleOpenWithUser(usr)}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-purple-900/40 cursor-pointer transition"
                  >
                    <img
                      src={usr.avatarUrl}
                      alt={usr.firstName}
                      className="w-9 h-9 rounded-xl object-cover border border-purple-500/30"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">
                          {usr.firstName}
                        </span>
                        <span className="text-[10px] font-mono text-amber-300 bg-purple-950 px-1 rounded">
                          #{usr.numericId}
                        </span>
                      </div>
                      <p className="text-[10px] text-purple-300/70 truncate">@{usr.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="text-center py-12 px-4 text-purple-400/60">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">No active conversations yet.</p>
                <p className="text-[10px] mt-1">Search an ID or username above to start chatting!</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = activeConv?.id === conv.id;
                const other = conv.otherUser;
                return (
                  <div
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition duration-150 ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-500/40 shadow'
                        : 'hover:bg-purple-950/40 border border-transparent'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={other?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                        alt={other?.firstName || 'User'}
                        className="w-12 h-12 rounded-2xl object-cover border border-purple-500/30"
                      />
                      {other?.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0e041c]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">
                          {other?.firstName || 'MR Legend Member'}
                        </span>
                        <span className="text-[10px] text-purple-400/60 font-mono">
                          {conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-purple-300/60 mt-0.5">
                        <p className="truncate pr-2">
                          {conv.lastMessage?.text || (conv.lastMessage?.mediaUrl ? '📎 Media attachment' : 'Start conversation...')}
                        </p>
                        {other?.numericId && (
                          <span className="text-[9px] font-mono text-amber-300/80 bg-purple-950/80 px-1 py-0.2 rounded border border-purple-800/40">
                            #{other.numericId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Messages & Composer */}
        <div
          className={`md:col-span-8 flex flex-col bg-[#0b0316] ${
            !activeConv ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConv && activeConv.otherUser ? (
            <>
              {/* Conversation Top Header */}
              <div className="p-3.5 border-b border-purple-900/40 bg-[#0d031c] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setActiveConv(null)}
                    className="md:hidden p-1.5 rounded-xl text-purple-400 hover:text-white bg-purple-950/60"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="relative">
                    <img
                      src={activeConv.otherUser.avatarUrl}
                      alt={activeConv.otherUser.firstName}
                      className="w-10 h-10 rounded-xl object-cover border border-purple-500/40"
                    />
                    {activeConv.otherUser.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0d031c]" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        {activeConv.otherUser.firstName}
                      </h4>
                      <span className="text-[10px] font-mono text-amber-300 bg-purple-950 px-1.5 rounded">
                        #{activeConv.otherUser.numericId}
                      </span>
                    </div>
                    <p className="text-[10px] text-purple-300/60">
                      {activeConv.otherUser.online ? (
                        <span className="text-emerald-400">Online</span>
                      ) : (
                        `@${activeConv.otherUser.username}`
                      )}
                    </p>
                  </div>
                </div>

                {/* Voice & Video Call Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      sound.playButtonClick();
                      onStartCall(activeConv.otherUser!, 'voice');
                    }}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl bg-purple-950/80 border border-purple-700/50 hover:bg-emerald-950/60 hover:border-emerald-500/50 text-purple-200 hover:text-emerald-300 transition cursor-pointer flex items-center gap-1.5"
                    title="Start Voice Call"
                    aria-label="Start Voice Call"
                  >
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold hidden sm:inline">Voice</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playButtonClick();
                      onStartCall(activeConv.otherUser!, 'video');
                    }}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl bg-purple-950/80 border border-purple-700/50 hover:bg-indigo-950/60 hover:border-indigo-500/50 text-purple-200 hover:text-indigo-300 transition cursor-pointer flex items-center gap-1.5"
                    title="Start Video Call"
                    aria-label="Start Video Call"
                  >
                    <Video className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold hidden sm:inline">Video</span>
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-16 text-purple-400/50">
                    <p className="text-xs">No messages yet. Say Assalam-o-Alaikum!</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMine = m.senderId === currentUser.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-md p-3.5 rounded-2xl text-xs sm:text-sm space-y-1.5 shadow-md ${
                            isMine
                              ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white rounded-br-none'
                              : 'bg-[#180930] text-purple-100 border border-purple-800/40 rounded-bl-none'
                          }`}
                        >
                          {/* Media attachments */}
                          {m.mediaUrl && m.mediaType === 'image' && (
                            <img
                              src={m.mediaUrl}
                              alt="Attachment"
                              className="rounded-xl max-h-60 w-full object-cover border border-purple-400/20 mb-1"
                            />
                          )}

                          {m.mediaUrl && m.mediaType === 'video' && (
                            <video
                              src={m.mediaUrl}
                              controls
                              className="rounded-xl max-h-60 w-full bg-black mb-1"
                            />
                          )}

                          {m.mediaUrl && m.mediaType === 'file' && (
                            <a
                              href={m.mediaUrl}
                              download
                              className="flex items-center gap-2 p-2 rounded-xl bg-purple-950/60 text-amber-300 hover:underline"
                            >
                              <FileText className="w-4 h-4 shrink-0" />
                              <span className="truncate">{m.fileName || 'Download Attachment'}</span>
                            </a>
                          )}

                          {m.text && <p className="leading-relaxed break-words">{m.text}</p>}

                          <div
                            className={`flex items-center justify-end gap-1 text-[9px] ${
                              isMine ? 'text-purple-200/80' : 'text-purple-400/70'
                            }`}
                          >
                            <span>
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMine && <CheckCheck className="w-3 h-3 text-amber-300" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Attachment Preview if selected */}
              {attachment && (
                <div className="px-4 py-2 bg-purple-950/70 border-t border-purple-900/40 flex items-center justify-between text-xs text-purple-200">
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span className="truncate">Attached: {attachment.fileName}</span>
                  </div>
                  <button
                    onClick={() => setAttachment(null)}
                    className="p-1 rounded text-purple-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-purple-900/40 bg-[#0d031c] flex items-center gap-2"
              >
                <label className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-700/50 text-purple-300 hover:text-white cursor-pointer transition">
                  <Paperclip className="w-4 h-4" />
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message (Send plays ting-ting chime)..."
                  className="flex-1 bg-[#140628] border border-purple-800/60 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-purple-400/40 focus:outline-none focus:border-amber-400"
                />

                <button
                  type="submit"
                  disabled={sending || (!messageInput.trim() && !attachment)}
                  className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 text-white font-bold text-xs flex items-center gap-1.5 hover:opacity-95 shadow transition cursor-pointer disabled:opacity-40"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-purple-400/60">
              <div className="w-16 h-16 rounded-3xl bg-purple-950/60 border border-purple-700/40 flex items-center justify-center text-amber-400 mb-4 shadow">
                <Crown className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-white font-['Cinzel']">
                MR LEGEND 302 Messenger
              </h3>
              <p className="text-xs text-purple-300/70 max-w-sm mt-1">
                Select a conversation from the left or search any registered user by numeric ID or username to begin private messaging.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Modal When Free Limit Reached */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#130628] border border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-center">
            <button
              onClick={() => setUpgradeModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-purple-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
              <Crown className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-white font-['Cinzel']">
              Free Daily Message Limit Reached
            </h3>

            <p className="text-xs text-purple-200/80 mt-2 leading-relaxed">
              {limitError || 'You have reached your 10 messages daily limit for Free accounts.'}
            </p>

            <div className="mt-5 space-y-2.5">
              <button
                onClick={() => {
                  sound.playButtonClick();
                  setUpgradeModalOpen(false);
                  onOpenPlans();
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(251,191,36,0.6)] cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Upgrade to Monthly or Lifetime VIP</span>
              </button>

              <button
                onClick={() => setUpgradeModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-purple-950/60 border border-purple-800/40 text-purple-300 text-xs font-semibold hover:text-white cursor-pointer"
              >
                Close & Wait For 24h Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
