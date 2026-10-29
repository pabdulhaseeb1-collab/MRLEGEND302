import React, { useState, useEffect } from 'react';
import { BackgroundCanvas } from './components/BackgroundCanvas';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { WelcomeScreen } from './components/WelcomeScreen';
import { AuthModal } from './components/AuthModal';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { UserDashboard } from './components/UserDashboard';
import { ChatView } from './components/ChatView';
import { CallModal } from './components/CallModal';
import { GroupsView } from './components/GroupsView';
import { StatusView } from './components/StatusView';
import { BuyPlansView } from './components/BuyPlansView';
import { VideoDownloaderView } from './components/VideoDownloaderView';
import { ProfileView } from './components/ProfileView';
import { AdminPanel } from './components/AdminPanel';
import { NotificationModal } from './components/NotificationModal';
import { SoundSettingsModal } from './components/SoundSettingsModal';
import { SearchModal } from './components/SearchModal';
import { User } from './types';
import { api, getStoredToken, setStoredToken } from './utils/api';
import { sound } from './utils/audio';
import { ShieldCheck, MessageCircle } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userUsage, setUserUsage] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authIdentifier, setAuthIdentifier] = useState('');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [soundSettingsOpen, setSoundSettingsOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Calling state
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [callTargetUser, setCallTargetUser] = useState<User | null>(null);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState<any>(null);

  // Group / Broadcast banner state
  const [broadcastActive, setBroadcastActive] = useState(false);
  const [chatSelectedUser, setChatSelectedUser] = useState<User | null>(null);

  // Check URL query parameters (e.g. autostart=1 skips intro)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setShowWelcome(false);
    }
  }, []);

  // Fetch current user if token exists
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      api
        .getMe()
        .then((res) => {
          setCurrentUser(res.user);
          setUserUsage(res.usage);
          if (res.adminSettings) {
            setBroadcastActive(res.adminSettings.audioBroadcastActive);
          }
          setShowWelcome(false);
        })
        .catch(() => {
          setStoredToken(null);
        })
        .finally(() => {
          setInitialLoading(false);
        });
    } else {
      setInitialLoading(false);
    }
  }, []);

  // Poll for incoming calls when user is logged in
  useEffect(() => {
    if (!currentUser) return;

    const pollInterval = setInterval(() => {
      api
        .pollCalls()
        .then((res) => {
          if (res.incomingCall && !callModalOpen) {
            setIsIncomingCall(true);
            setIncomingCallData(res.incomingCall);
            setCallType(res.incomingCall.type || 'voice');
            setCallTargetUser(res.incomingCall.caller);
            setCallModalOpen(true);
          }
        })
        .catch(() => {});
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [currentUser, callModalOpen]);

  // Auth Success Handler
  const handleAuthSuccess = (user: User, usage: any) => {
    setCurrentUser(user);
    setUserUsage(usage);
    setShowWelcome(false);
    setActiveTab('dashboard');
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {}
    setStoredToken(null);
    setCurrentUser(null);
    setUserUsage(null);
    setShowWelcome(true);
    setActiveTab('dashboard');
  };

  // Launch Call
  const handleStartCall = (target: User, type: 'voice' | 'video') => {
    setCallTargetUser(target);
    setCallType(type);
    setIsIncomingCall(false);
    setIncomingCallData(null);
    setCallModalOpen(true);

    api.initiateCall(target.id, type).catch(console.error);
  };

  // Start chat with user
  const handleSelectUserForChat = (target: User) => {
    setChatSelectedUser(target);
    setActiveTab('chats');
  };

  return (
    <div className="min-h-screen bg-[#07030e] text-slate-100 flex flex-col relative selection:bg-purple-600 selection:text-white">
      {/* Background Animated Luxury Canvas */}
      <BackgroundCanvas />

      {/* Welcome Screen (Show if visitor hasn't entered or logged in yet) */}
      {showWelcome && !currentUser ? (
        <WelcomeScreen
          onEnterWithId={(id) => {
            setAuthIdentifier(id);
            setAuthMode('login');
            setAuthModalOpen(true);
          }}
          onOpenLogin={() => {
            setAuthIdentifier('');
            setAuthMode('login');
            setAuthModalOpen(true);
          }}
          onOpenRegister={() => {
            setAuthMode('register');
            setAuthModalOpen(true);
          }}
          onOpenForgotPassword={() => setForgotPasswordOpen(true)}
          onEnterDirectly={() => setShowWelcome(false)}
        />
      ) : (
        <>
          {/* Top Navbar */}
          <Navbar
            currentUser={currentUser}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenAdminModal={() => setAdminModalOpen(true)}
            onOpenNotifications={() => setNotificationsOpen(true)}
            onOpenSoundSettings={() => setSoundSettingsOpen(true)}
            onLogout={handleLogout}
            remainingMessages={userUsage?.messagesRemaining}
            broadcastActive={broadcastActive}
            onOpenBroadcast={() => setActiveTab('groups')}
          />

          {/* Main Body View Switching */}
          <main className="flex-1 relative z-10">
            {activeTab === 'dashboard' && currentUser && (
              <UserDashboard
                user={currentUser}
                usage={userUsage}
                setActiveTab={setActiveTab}
                onOpenSearch={() => setSearchModalOpen(true)}
              />
            )}

            {activeTab === 'dashboard' && !currentUser && (
              <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white font-['Cinzel']">
                  MR LEGEND 302 Platform
                </h2>
                <p className="text-sm text-purple-300/80 max-w-md mx-auto">
                  Experience elite communication, private encryption, real-time calling, and VIP media downloads.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      sound.playButtonClick();
                      setAuthMode('login');
                      setAuthModalOpen(true);
                    }}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs cursor-pointer shadow-lg"
                  >
                    Login with ID
                  </button>
                  <button
                    onClick={() => {
                      sound.playButtonClick();
                      setAuthMode('register');
                      setAuthModalOpen(true);
                    }}
                    className="px-6 py-3 rounded-2xl bg-purple-950/70 border border-purple-700/50 text-purple-200 font-bold text-xs hover:text-white cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'chats' && (
              currentUser ? (
                <ChatView
                  currentUser={currentUser}
                  onStartCall={handleStartCall}
                  onOpenPlans={() => setActiveTab('plans')}
                  initialSelectedUser={chatSelectedUser}
                  onUsageUpdated={(usage) => setUserUsage(usage)}
                />
              ) : (
                <div className="text-center py-20">
                  <p className="text-purple-300">Please sign in to access private chats.</p>
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setAuthModalOpen(true);
                    }}
                    className="mt-3 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
                  >
                    Login Now
                  </button>
                </div>
              )
            )}

            {activeTab === 'groups' && (
              currentUser ? (
                <GroupsView
                  currentUser={currentUser}
                  onOpenPlans={() => setActiveTab('plans')}
                />
              ) : (
                <div className="text-center py-20">
                  <p className="text-purple-300">Please sign in to view and join groups.</p>
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setAuthModalOpen(true);
                    }}
                    className="mt-3 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
                  >
                    Login Now
                  </button>
                </div>
              )
            )}

            {activeTab === 'status' && (
              currentUser ? (
                <StatusView
                  currentUser={currentUser}
                  onOpenPlans={() => setActiveTab('plans')}
                />
              ) : (
                <div className="text-center py-20">
                  <p className="text-purple-300">Please sign in to view status stories.</p>
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setAuthModalOpen(true);
                    }}
                    className="mt-3 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
                  >
                    Login Now
                  </button>
                </div>
              )
            )}

            {activeTab === 'downloader' && (
              currentUser ? (
                <VideoDownloaderView
                  currentUser={currentUser}
                  onOpenPlans={() => setActiveTab('plans')}
                  onUsageUpdated={(usage) => setUserUsage(usage)}
                />
              ) : (
                <div className="text-center py-20">
                  <p className="text-purple-300">Please sign in to use the social video downloader.</p>
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setAuthModalOpen(true);
                    }}
                    className="mt-3 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
                  >
                    Login Now
                  </button>
                </div>
              )
            )}

            {activeTab === 'plans' && (
              <BuyPlansView
                currentUser={currentUser || ({} as any)}
                onPlanActivated={(user, usage) => {
                  setCurrentUser(user);
                  setUserUsage(usage);
                }}
              />
            )}

            {activeTab === 'profile' && currentUser && (
              <ProfileView
                currentUser={currentUser}
                onLogout={handleLogout}
                onOpenPlans={() => setActiveTab('plans')}
              />
            )}
          </main>

          {/* Mobile Bottom Navigation Bar */}
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Official Footer Branding */}
          <footer className="relative z-20 border-t border-purple-900/40 bg-[#06020c]/90 py-6 px-4 text-center space-y-2 pb-24 md:pb-8">
            <p className="text-xs sm:text-sm font-semibold text-purple-300/80 tracking-wide">
              This website created on MR Legend 302
            </p>
            <div className="flex items-center justify-center gap-4 text-[11px] text-purple-400/60 flex-wrap">
              <a
                href="https://wa.me/923288516325"
                target="_blank"
                rel="noreferrer"
                className="hover:text-amber-300 flex items-center gap-1 transition"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp: 03288516325</span>
              </a>
              <span>•</span>
              <span>Currency: PKR (Pakistani Rupees)</span>
              <span>•</span>
              <button
                onClick={() => setAdminModalOpen(true)}
                className="hover:text-amber-300 underline"
              >
                Admin Panel (🔒)
              </button>
            </div>
          </footer>
        </>
      )}

      {/* All Modal Windows */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
        initialIdentifier={authIdentifier}
        onSuccess={handleAuthSuccess}
        onOpenForgotPassword={() => {
          setAuthModalOpen(false);
          setForgotPasswordOpen(true);
        }}
      />

      <ForgotPasswordModal
        isOpen={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
      />

      {currentUser && (
        <CallModal
          isOpen={callModalOpen}
          onClose={() => setCallModalOpen(false)}
          currentUser={currentUser}
          targetUser={callTargetUser}
          callType={callType}
          isIncoming={isIncomingCall}
          incomingCallData={incomingCallData}
          onOpenPlans={() => {
            setCallModalOpen(false);
            setActiveTab('plans');
          }}
        />
      )}

      <AdminPanel
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onSettingsUpdated={() => {
          api.getMe().then((res) => {
            if (res.adminSettings) setBroadcastActive(res.adminSettings.audioBroadcastActive);
          }).catch(() => {});
        }}
      />

      <NotificationModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      <SoundSettingsModal
        isOpen={soundSettingsOpen}
        onClose={() => setSoundSettingsOpen(false)}
      />

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectUser={handleSelectUserForChat}
        onStartCall={handleStartCall}
      />
    </div>
  );
}
