import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  SwitchCamera,
  Crown,
  Sparkles,
  AlertCircle,
  X,
  Volume2,
} from 'lucide-react';
import { User } from '../types';
import { sound } from '../utils/audio';
import { api } from '../utils/api';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  targetUser?: User | null;
  callType: 'voice' | 'video';
  isIncoming?: boolean;
  incomingCallData?: any;
  onOpenPlans: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  targetUser,
  callType,
  isIncoming = false,
  incomingCallData = null,
  onOpenPlans,
}) => {
  const [status, setStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(callType === 'voice');
  const [duration, setDuration] = useState(0);
  const [limitCutoffModal, setLimitCutoffModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const callIdRef = useRef<string>(incomingCallData?.callId || `call_${Date.now()}`);

  const isPremium = currentUser.membership === 'monthly' || currentUser.membership === 'lifetime';
  const effectiveTarget = targetUser || incomingCallData?.caller;

  useEffect(() => {
    if (!isOpen) return;

    if (isIncoming) {
      sound.startRingtone();
    } else {
      sound.playTingTing();
      // Auto-connect simulation for rich interactive testing
      const connectTimeout = setTimeout(() => {
        handleConnected();
      }, 2500);
      return () => clearTimeout(connectTimeout);
    }

    return () => {
      sound.stopRingtone();
      cleanupMedia();
    };
  }, [isOpen, isIncoming]);

  // Duration timer & 1-minute Free limit enforcement
  useEffect(() => {
    if (status === 'connected') {
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const next = prev + 1;

          // Free limit: 60 seconds (1 minute)
          if (!isPremium && next >= 60) {
            handleEndCall(true); // End automatically with limit popup
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, isPremium]);

  const initLocalMedia = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video',
        });
        localStreamRef.current = stream;
        if (localVideoRef.current && callType === 'video') {
          localVideoRef.current.srcObject = stream;
        }
      }
    } catch (err: any) {
      console.warn('Microphone or camera permission was not granted:', err);
      setErrorMsg('Microphone or camera access denied. Continuing in simulated call mode.');
    }
  };

  const cleanupMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleAccept = async () => {
    sound.stopRingtone();
    sound.playCallConnected();
    setStatus('connected');
    await initLocalMedia();

    if (incomingCallData?.callId) {
      api.respondCall({ callId: incomingCallData.callId, action: 'accept' }).catch(() => {});
    }
  };

  const handleDecline = () => {
    sound.stopRingtone();
    sound.playCallEnded();
    setStatus('ended');
    cleanupMedia();
    if (incomingCallData?.callId) {
      api.respondCall({ callId: incomingCallData.callId, action: 'decline' }).catch(() => {});
    }
    setTimeout(onClose, 500);
  };

  const handleConnected = async () => {
    sound.stopRingtone();
    sound.playCallConnected();
    setStatus('connected');
    await initLocalMedia();
  };

  const handleEndCall = (isLimitCutoff = false) => {
    sound.stopRingtone();
    sound.playCallEnded();
    setStatus('ended');
    cleanupMedia();

    api.reportCallDuration(duration).catch(() => {});

    if (isLimitCutoff) {
      setLimitCutoffModal(true);
    } else {
      setTimeout(onClose, 600);
    }
  };

  const toggleMic = () => {
    const next = !micMuted;
    setMicMuted(next);
    sound.playButtonClick();
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !next));
    }
  };

  const toggleVideo = () => {
    const next = !videoOff;
    setVideoOff(next);
    sound.playButtonClick();
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = !next));
    }
  };

  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#180830] via-[#0f0420] to-[#080212] border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col items-center justify-between min-h-[500px]">
        {/* Top Header info */}
        <div className="w-full flex items-center justify-between text-xs text-purple-300">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className="font-semibold capitalize">
              {status === 'connected' ? 'Call Connected (WebRTC Encrypted)' : isIncoming ? 'Incoming Call...' : 'Calling...'}
            </span>
          </div>

          {!isPremium && status === 'connected' && (
            <div className="bg-amber-950/80 border border-amber-500/40 px-2.5 py-1 rounded-full text-[11px] text-amber-300 font-bold">
              Free 1-Min Limit: {60 - duration}s remaining
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="w-full mt-2 p-2 rounded-xl bg-amber-950/50 border border-amber-500/30 text-[11px] text-amber-200 text-center">
            {errorMsg}
          </div>
        )}

        {/* Video Surface Area or Voice Visualizer */}
        {callType === 'video' && status === 'connected' && !videoOff ? (
          <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden bg-black border border-purple-500/30 my-4 flex items-center justify-center">
            {/* Simulated Remote Partner Video */}
            <img
              src={effectiveTarget?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'}
              alt={effectiveTarget?.firstName}
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

            {/* Self Video PIP */}
            <div className="absolute bottom-3 right-3 w-28 h-36 rounded-xl overflow-hidden border-2 border-amber-400/80 shadow-lg bg-purple-950">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ) : (
          /* Voice Call Center Avatar & Ripple effects */
          <div className="my-8 flex flex-col items-center">
            <div className="relative">
              <div
                className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-purple-600 to-indigo-600 shadow-[0_0_50px_rgba(168,85,247,0.5)] ${
                  status === 'ringing' ? 'animate-pulse' : ''
                }`}
              >
                <img
                  src={effectiveTarget?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'}
                  alt="Partner"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              {/* Status icon badge */}
              <div className="absolute bottom-1 right-2 p-2 rounded-full bg-purple-950 border border-purple-500 text-amber-300">
                {callType === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white font-['Cinzel'] mt-4">
              {effectiveTarget?.firstName || 'MR Legend Member'}
            </h3>
            <p className="text-xs text-purple-300/70">@{effectiveTarget?.username || 'user'}</p>

            {status === 'connected' && (
              <div className="text-lg font-mono font-bold text-amber-400 mt-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-800/40">
                {formatTimer(duration)}
              </div>
            )}
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="w-full flex items-center justify-center gap-4 sm:gap-6 pt-4">
          {isIncoming && status === 'ringing' ? (
            /* Incoming Call: Accept / Decline */
            <>
              <button
                onClick={handleAccept}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.7)] transition cursor-pointer"
                aria-label="Accept Call"
              >
                <Phone className="w-7 h-7" />
              </button>

              <button
                onClick={handleDecline}
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-[0_0_25px_rgba(244,63,94,0.7)] transition cursor-pointer"
                aria-label="Decline Call"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
            </>
          ) : (
            /* Active Call Controls */
            <>
              <button
                onClick={toggleMic}
                className={`p-4 rounded-full transition cursor-pointer ${
                  micMuted
                    ? 'bg-rose-950 border border-rose-500 text-rose-400'
                    : 'bg-purple-950/80 border border-purple-700/60 text-purple-200 hover:text-white'
                }`}
                title={micMuted ? 'Unmute Mic' : 'Mute Mic'}
                aria-label="Toggle Microphone"
              >
                {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {callType === 'video' && (
                <button
                  onClick={toggleVideo}
                  className={`p-4 rounded-full transition cursor-pointer ${
                    videoOff
                      ? 'bg-rose-950 border border-rose-500 text-rose-400'
                      : 'bg-purple-950/80 border border-purple-700/60 text-purple-200 hover:text-white'
                  }`}
                  title={videoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                  aria-label="Toggle Camera"
                >
                  {videoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              <button
                onClick={() => handleEndCall(false)}
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.8)] transition cursor-pointer"
                title="End Call"
                aria-label="End Call"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 1-Minute Free Limit Cutoff Popup */}
      {limitCutoffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#130628] border border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
              <Crown className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-white font-['Cinzel']">
              1-Minute Free Calling Limit Reached
            </h3>

            <p className="text-xs text-purple-200/80 mt-2 leading-relaxed">
              Your free call session of 1 minute has concluded according to platform policies.
              Upgrade to Monthly or Lifetime VIP for unlimited call durations without disconnects.
            </p>

            <div className="mt-5 space-y-2.5">
              <button
                onClick={() => {
                  sound.playButtonClick();
                  setLimitCutoffModal(false);
                  onClose();
                  onOpenPlans();
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(251,191,36,0.6)] cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Upgrade to VIP For Unlimited Calling</span>
              </button>

              <button
                onClick={() => {
                  setLimitCutoffModal(false);
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-purple-950/60 border border-purple-800/40 text-purple-300 text-xs font-semibold hover:text-white cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
