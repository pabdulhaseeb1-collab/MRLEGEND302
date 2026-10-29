import React, { useState, useEffect } from 'react';
import {
  Lock,
  ShieldCheck,
  Users,
  Crown,
  Key,
  Radio,
  Settings,
  X,
  Search,
  Check,
  AlertTriangle,
  RefreshCw,
  Plus,
  Play,
  Square,
  Ban,
  Trash2,
  DollarSign,
  Activity,
  Volume2,
} from 'lucide-react';
import { api, setStoredAdminToken, getStoredAdminToken } from '../utils/api';
import { sound } from '../utils/audio';
import { User, AdminSettings, ActivationKey } from '../types';
import { formatPKR } from '../utils/rules';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, onSettingsUpdated }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'keys' | 'groups' | 'broadcast' | 'settings'>('overview');

  // Dashboard Data
  const [overview, setOverview] = useState<any>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Key Gen Form
  const [newKeyPlan, setNewKeyPlan] = useState<'monthly' | 'lifetime'>('monthly');
  const [newKeyEmail, setNewKeyEmail] = useState('');
  const [generatedKey, setGeneratedKey] = useState<ActivationKey | null>(null);

  // Broadcast Form
  const [broadcastActive, setBroadcastActive] = useState(false);
  const [broadcastUrl, setBroadcastUrl] = useState('');
  const [broadcastTitle, setBroadcastTitle] = useState('MR Legend 302 Official Royal Broadcast');

  // Website Settings Form
  const [settingsForm, setSettingsForm] = useState<AdminSettings | null>(null);

  useEffect(() => {
    if (isOpen && getStoredAdminToken()) {
      setIsAuthenticated(true);
      fetchAdminData();
    }
  }, [isOpen]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);

    try {
      const res = await api.adminLogin(adminKeyInput.trim());
      setStoredAdminToken(res.adminToken);
      setIsAuthenticated(true);
      sound.playSuccessSound();
      fetchAdminData();
    } catch (err: any) {
      sound.playIncorrectPasswordError();
      setAuthError(err.message || 'Invalid Administrator Key');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      const [ov, usrs, st] = await Promise.all([
        api.adminGetOverview(),
        api.adminGetUsers(),
        api.adminGetSettings(),
      ]);
      setOverview(ov);
      setUsersList(usrs.users);
      setSettingsForm(st.settings);
      setBroadcastActive(st.settings.audioBroadcastActive);
      setBroadcastUrl(st.settings.broadcastSourceUrl);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUserStatus = async (userId: string, updates: any) => {
    try {
      await api.adminUpdateUser(userId, updates);
      sound.playTingTing();
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.adminGenerateKey(newKeyPlan, newKeyEmail);
      sound.playSuccessSound();
      setGeneratedKey(res.key);
      setNewKeyEmail('');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to generate key');
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      await api.adminRevokeKey(keyId);
      sound.playTingTing();
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke key');
    }
  };

  const handleToggleBroadcast = async (active: boolean) => {
    try {
      await api.adminBroadcastAudio(active, broadcastUrl, broadcastTitle);
      sound.playTingTing();
      setBroadcastActive(active);
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to update audio broadcast');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm) return;
    try {
      await api.adminSaveSettings(settingsForm);
      sound.playSuccessSound();
      alert('Administrator Website Settings successfully updated!');
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#0f041e] border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.95)] my-6">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playButtonClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-xl text-purple-400 hover:text-white bg-purple-950/60"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. ADMIN AUTHENTICATION DIALOG (If not yet authenticated) */}
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto text-center py-6 space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border-2 border-amber-400/50 flex items-center justify-center text-amber-300 mx-auto shadow-[0_0_25px_rgba(251,191,36,0.3)]">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white font-['Cinzel'] tracking-wide">
                Administrator Access
              </h2>
              <p className="text-xs text-purple-300/70 mt-1">
                Enter your secret Administrator Key to access MR LEGEND 302 control center.
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs">
                {authError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input
                type="password"
                required
                value={adminKeyInput}
                onChange={(e) => setAdminKeyInput(e.target.value)}
                placeholder="Enter Admin Panel Key (Placeholder: MRLEGEND302ADMIN)"
                className="w-full bg-[#080212] border border-purple-800/60 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white font-mono placeholder-purple-400/40 focus:outline-none focus:border-amber-400"
              />

              <button
                type="submit"
                disabled={loading || !adminKeyInput.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(251,191,36,0.5)] cursor-pointer disabled:opacity-40"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{loading ? 'Verifying Key...' : 'Unlock Admin Dashboard'}</span>
              </button>
            </form>
          </div>
        ) : (
          /* 2. PROTECTED ADMIN DASHBOARD */
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-purple-900/40 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white font-['Cinzel']">
                    MR LEGEND 302 Admin Control Center
                  </h2>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/40">
                    AUTHORIZED
                  </span>
                </div>
                <p className="text-xs text-purple-300/60 mt-0.5">
                  Full control over users, premium keys, pricing, audio broadcasts, and security rules.
                </p>
              </div>

              {/* Sub-tabs */}
              <div className="flex flex-wrap gap-1 bg-[#0a0314] p-1 rounded-2xl border border-purple-800/40">
                {[
                  { id: 'overview', label: 'Overview', icon: Activity },
                  { id: 'users', label: 'Users', icon: Users },
                  { id: 'keys', label: 'VIP Keys', icon: Key },
                  { id: 'broadcast', label: 'Broadcast', icon: Radio },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        sound.playButtonClick();
                        setActiveTab(tab.id as any);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow'
                          : 'text-purple-300/80 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TAB 1: OVERVIEW METRICS */}
            {activeTab === 'overview' && overview && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-[#090214] border border-purple-800/40">
                    <span className="text-[10px] uppercase font-bold text-purple-400">Total Users</span>
                    <p className="text-2xl font-black text-white font-mono mt-1">
                      {overview.stats.totalUsers}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#090214] border border-purple-800/40">
                    <span className="text-[10px] uppercase font-bold text-emerald-400">Online Now</span>
                    <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
                      {overview.stats.onlineUsers}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#090214] border border-purple-800/40">
                    <span className="text-[10px] uppercase font-bold text-amber-400">Monthly VIP</span>
                    <p className="text-2xl font-black text-amber-300 font-mono mt-1">
                      {overview.stats.monthlyUsers}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#090214] border border-purple-800/40">
                    <span className="text-[10px] uppercase font-bold text-yellow-400">Lifetime VIP</span>
                    <p className="text-2xl font-black text-yellow-400 font-mono mt-1">
                      {overview.stats.lifetimeUsers}
                    </p>
                  </div>
                </div>

                {/* Audit Logs */}
                <div className="p-5 rounded-2xl bg-[#0a0216] border border-purple-900/40 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                    Recent Platform Audit Trails
                  </h4>
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {overview.auditLogs?.map((log: any) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/30 text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-amber-300 mr-2">[{log.action}]</span>
                          <span className="text-purple-200">{log.details}</span>
                        </div>
                        <span className="text-[10px] text-purple-400/70 font-mono shrink-0 ml-2">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: USER MANAGEMENT */}
            {activeTab === 'users' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="relative">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search registered users by ID, username, or email..."
                    className="w-full bg-[#0a0314] border border-purple-800/60 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-amber-400"
                  />
                  <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {usersList
                    .filter(
                      (u) =>
                        !userSearch ||
                        u.numericId.includes(userSearch) ||
                        u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.email.toLowerCase().includes(userSearch.toLowerCase())
                    )
                    .map((usr) => (
                      <div
                        key={usr.id}
                        className="p-3.5 rounded-2xl bg-[#090214] border border-purple-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={usr.avatarUrl}
                            alt={usr.firstName}
                            className="w-10 h-10 rounded-xl object-cover border border-purple-500/40"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white">{usr.firstName}</span>
                              <span className="text-[10px] font-mono text-amber-300 bg-purple-950 px-1 rounded">
                                ID: {usr.numericId}
                              </span>
                            </div>
                            <p className="text-[10px] text-purple-300/70">
                              @{usr.username} • {usr.email}
                            </p>
                          </div>
                        </div>

                        {/* Status Controls */}
                        <div className="flex items-center gap-2">
                          <select
                            value={usr.membership}
                            onChange={(e) =>
                              handleUpdateUserStatus(usr.id, { membership: e.target.value })
                            }
                            className="bg-[#140628] border border-purple-700/60 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-bold focus:outline-none"
                          >
                            <option value="free">Free</option>
                            <option value="monthly">Monthly VIP</option>
                            <option value="lifetime">Lifetime VIP</option>
                          </select>

                          <button
                            onClick={() =>
                              handleUpdateUserStatus(usr.id, { isBlocked: !usr.isBlocked })
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                              usr.isBlocked
                                ? 'bg-emerald-950 border border-emerald-500 text-emerald-300'
                                : 'bg-rose-950/80 border border-rose-800 text-rose-300'
                            }`}
                          >
                            {usr.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* TAB 3: PREMIUM KEYS GENERATOR */}
            {activeTab === 'keys' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="p-5 rounded-3xl bg-[#0c0318] border border-purple-800/40 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Generate Cryptographic Single-Use Premium Key
                  </h4>

                  <form onSubmit={handleGenerateKey} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select
                      value={newKeyPlan}
                      onChange={(e) => setNewKeyPlan(e.target.value as any)}
                      className="bg-[#080212] border border-purple-700/60 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none"
                    >
                      <option value="monthly">Monthly VIP (30 Days)</option>
                      <option value="lifetime">Lifetime VIP</option>
                    </select>

                    <input
                      type="email"
                      value={newKeyEmail}
                      onChange={(e) => setNewKeyEmail(e.target.value)}
                      placeholder="Restrict to email (Optional)"
                      className="bg-[#080212] border border-purple-700/60 rounded-2xl px-3 py-2.5 text-xs text-white placeholder-purple-400/40 focus:outline-none"
                    />

                    <button
                      type="submit"
                      className="py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-black text-xs flex items-center justify-center gap-1.5 hover:opacity-95 cursor-pointer shadow"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Generate Key</span>
                    </button>
                  </form>

                  {generatedKey && (
                    <div className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/40 text-xs flex items-center justify-between text-amber-300">
                      <div>
                        <span>New Key: </span>
                        <strong className="font-mono text-sm tracking-wider text-white">
                          {generatedKey.key}
                        </strong>
                        <span className="ml-2 text-[10px] text-amber-400 uppercase">
                          ({generatedKey.plan})
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedKey.key);
                          sound.playTingTing();
                          alert('Key copied to clipboard!');
                        }}
                        className="px-3 py-1 rounded-xl bg-amber-400 text-black font-bold text-xs cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  )}
                </div>

                {/* Recent Keys List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                    Key Activation Registry
                  </h4>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {overview?.recentKeys?.map((k: ActivationKey) => (
                      <div
                        key={k.id}
                        className="p-3 rounded-2xl bg-[#090214] border border-purple-800/40 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-white mr-2">{k.key}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              k.status === 'unused'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : k.status === 'activated'
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {k.status}
                          </span>
                          <span className="text-[10px] text-purple-400 ml-2">
                            {k.plan.toUpperCase()}
                          </span>
                        </div>

                        {k.status === 'unused' && (
                          <button
                            onClick={() => handleRevokeKey(k.id)}
                            className="text-xs text-rose-400 hover:text-rose-200 underline cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: AUDIO BROADCAST */}
            {activeTab === 'broadcast' && (
              <div className="p-6 rounded-3xl bg-[#0c0318] border border-purple-800/40 space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 text-amber-400">
                  <Radio className="w-5 h-5" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    Administrator Live Audio Broadcast to All Active VIPs
                  </h3>
                </div>

                <p className="text-xs text-purple-300/80 leading-relaxed">
                  Broadcast high quality audio announcements or streaming channels directly to active Monthly & Lifetime Premium members across the website.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-purple-300 mb-1">
                      Broadcast Title
                    </label>
                    <input
                      type="text"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="e.g. MR Legend 302 Royal Audio Broadcast"
                      className="w-full bg-[#080212] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-purple-300 mb-1">
                      Audio Source URL (MP3 / Audio Stream)
                    </label>
                    <input
                      type="text"
                      value={broadcastUrl}
                      onChange={(e) => setBroadcastUrl(e.target.value)}
                      placeholder="e.g. https://actions.google.com/sounds/v1/ambiences/outdoor_ambience.ogg"
                      className="w-full bg-[#080212] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleToggleBroadcast(true)}
                      className={`flex-1 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow ${
                        broadcastActive
                          ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                          : 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{broadcastActive ? 'Broadcasting Live' : 'Start Live Broadcast'}</span>
                    </button>

                    <button
                      onClick={() => handleToggleBroadcast(false)}
                      className="flex-1 py-3 rounded-2xl bg-rose-950/80 border border-rose-800/60 text-rose-300 hover:bg-rose-900 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>Stop Broadcast</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: WEBSITE SETTINGS */}
            {activeTab === 'settings' && settingsForm && (
              <form onSubmit={handleSaveSettings} className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-purple-300 mb-1">
                      Monthly Plan Price (PKR)
                    </label>
                    <input
                      type="number"
                      value={settingsForm.monthlyPricePKR}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, monthlyPricePKR: Number(e.target.value) })
                      }
                      className="w-full bg-[#080212] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-purple-300 mb-1">
                      Lifetime Plan Price (PKR)
                    </label>
                    <input
                      type="number"
                      value={settingsForm.lifetimePricePKR}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, lifetimePricePKR: Number(e.target.value) })
                      }
                      className="w-full bg-[#080212] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-purple-300 mb-1">
                      Free User Daily Messages Cap
                    </label>
                    <input
                      type="number"
                      value={settingsForm.freeDailyMessages}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          freeDailyMessages: Number(e.target.value),
                        })
                      }
                      className="w-full bg-[#080212] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-purple-300 mb-1">
                      Free User Daily Video Downloads Cap
                    </label>
                    <input
                      type="number"
                      value={settingsForm.freeDailyDownloads}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          freeDailyDownloads: Number(e.target.value),
                        })
                      }
                      className="w-full bg-[#080212] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-lg transition cursor-pointer mt-4"
                >
                  Save Platform Configuration
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
