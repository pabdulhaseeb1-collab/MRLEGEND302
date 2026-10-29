import React, { useState } from 'react';
import {
  Download,
  Play,
  Sparkles,
  Crown,
  Instagram,
  Youtube,
  Share2,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  Info,
  Loader2,
} from 'lucide-react';
import { User } from '../types';
import { api } from '../utils/api';
import { sound } from '../utils/audio';

interface VideoDownloaderViewProps {
  currentUser: User;
  onOpenPlans: () => void;
  onUsageUpdated?: (usage: any) => void;
}

export const VideoDownloaderView: React.FC<VideoDownloaderViewProps> = ({
  currentUser,
  onOpenPlans,
  onUsageUpdated,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram');
  const [inputUrl, setInputUrl] = useState('');
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [selectedQuality, setSelectedQuality] = useState('1080p');
  const [downloading, setDownloading] = useState(false);
  const [downloadResult, setDownloadResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isPremium = currentUser.membership === 'monthly' || currentUser.membership === 'lifetime';

  const platforms = [
    {
      id: 'instagram',
      name: 'Instagram / Reels',
      color: 'from-pink-600 via-rose-500 to-amber-500',
      icon: Instagram,
      placeholder: 'https://www.instagram.com/reel/...',
      badge: 'Reels & Posts',
    },
    {
      id: 'youtube',
      name: 'YouTube Shorts & 4K',
      color: 'from-red-600 via-rose-600 to-red-700',
      icon: Youtube,
      placeholder: 'https://www.youtube.com/watch?v=... or shorts/...',
      badge: '4K & 1080p',
    },
    {
      id: 'tiktok',
      name: 'TikTok HD',
      color: 'from-cyan-500 via-teal-500 to-pink-500',
      icon: FileVideo,
      placeholder: 'https://www.tiktok.com/@user/video/...',
      badge: 'No Watermark',
    },
    {
      id: 'snapchat',
      name: 'Snapchat Spotlight',
      color: 'from-amber-400 via-yellow-400 to-amber-500 text-black',
      icon: Share2,
      placeholder: 'https://www.snapchat.com/spotlight/...',
      badge: 'Spotlight & Stories',
    },
  ];

  const handleSelectPlatform = (platId: string) => {
    sound.playTingTing(); // "A short optional 'ting ting' sound when selected"
    setSelectedPlatform(platId);
    setVideoInfo(null);
    setDownloadResult(null);
    setErrorMsg(null);
  };

  const handleFetchInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setLoadingInfo(true);
    setErrorMsg(null);
    setDownloadResult(null);

    try {
      const data = await api.getVideoInfo(inputUrl.trim(), selectedPlatform);
      sound.playTingTing();
      setVideoInfo(data);
    } catch (err: any) {
      sound.playUserNotFoundError();
      if (err.code === 'DOWNLOAD_LIMIT_REACHED') {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(err.message || 'Unable to retrieve media from this link.');
      }
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleTriggerDownload = async () => {
    if (!videoInfo) return;

    setDownloading(true);
    setErrorMsg(null);

    try {
      const res = await api.triggerDownload(videoInfo.url, selectedQuality, videoInfo.title);
      sound.playSuccessSound();
      setDownloadResult(res);

      if (onUsageUpdated && res.usage) {
        onUsageUpdated(res.usage);
      }

      // Automatically trigger browser file download
      const link = document.createElement('a');
      link.href = res.downloadUrl;
      link.download = res.fileName || 'MRLegend302_Video.mp4';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      sound.playUserNotFoundError();
      setErrorMsg(err.message || 'Download failed.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-8">
      {/* Top Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
          <Download className="w-4 h-4 text-cyan-400" />
          OFFICIAL HIGH-SPEED ENGINE
        </div>

        <h2 className="text-3xl sm:text-5xl font-black text-white font-['Cinzel'] tracking-wide">
          Download All Social Accounts Videos
        </h2>

        <p className="text-xs sm:text-sm text-purple-300/80 max-w-xl mx-auto">
          Fast, watermark-free high definition video downloads. Free users enjoy 2 daily downloads; VIP members receive unlimited downloads with 1080p & HDR support.
        </p>
      </div>

      {/* 4 Premium Platform Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {platforms.map((plat) => {
          const Icon = plat.icon;
          const isSelected = selectedPlatform === plat.id;

          return (
            <div
              key={plat.id}
              onClick={() => handleSelectPlatform(plat.id)}
              className={`p-5 rounded-3xl cursor-pointer transition-all duration-300 border flex flex-col justify-between min-h-[140px] relative overflow-hidden group ${
                isSelected
                  ? 'bg-[#15062c] border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.4)] scale-[1.03]'
                  : 'bg-[#0f0420]/70 border-purple-800/40 hover:border-purple-500/50 hover:bg-[#120626]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${plat.color} flex items-center justify-center text-white shadow group-hover:scale-110 transition`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-200 border border-purple-700/40">
                  {plat.badge}
                </span>
              </div>

              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white mt-3 group-hover:text-amber-300 transition">
                  {plat.name}
                </h3>
                <span className="text-[10px] text-purple-300/60 flex items-center gap-1 mt-0.5">
                  Tap to select (Ting-ting sound)
                </span>
              </div>

              {isSelected && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
              )}
            </div>
          );
        })}
      </div>

      {/* URL Input Form Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#120626]/90 border border-purple-500/30 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] space-y-5">
        <form onSubmit={handleFetchInfo} className="space-y-3">
          <label className="block text-xs font-bold text-purple-200 uppercase tracking-wider">
            Paste {platforms.find((p) => p.id === selectedPlatform)?.name} Video URL
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              required
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder={platforms.find((p) => p.id === selectedPlatform)?.placeholder}
              className="flex-1 bg-[#0a0314] border border-purple-800/60 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-purple-400/40 focus:outline-none focus:border-amber-400"
            />

            <button
              type="submit"
              disabled={loadingInfo || !inputUrl.trim()}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:opacity-95 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-40"
            >
              {loadingInfo ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing Video...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Fetch Video</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error message */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            {!isPremium && (
              <button
                onClick={() => {
                  sound.playButtonClick();
                  onOpenPlans();
                }}
                className="px-3 py-1 rounded-xl bg-amber-400 text-black text-xs font-bold shrink-0 cursor-pointer"
              >
                Upgrade to VIP
              </button>
            )}
          </div>
        )}

        {/* Video Preview & Download Quality Picker */}
        {videoInfo && (
          <div className="pt-4 border-t border-purple-900/40 space-y-5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-[#0a0314] border border-purple-800/40">
              <img
                src={videoInfo.thumbnail}
                alt="Preview"
                className="w-full sm:w-40 h-28 object-cover rounded-xl border border-purple-500/30"
              />
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Ready to download
                </span>
                <h4 className="text-sm font-bold text-white">{videoInfo.title}</h4>
                <p className="text-xs text-purple-300/70">{videoInfo.author}</p>
                <div className="flex items-center gap-2 text-[10px] text-purple-400 font-mono pt-1">
                  <span>Duration: {videoInfo.duration || '0:45'}</span>
                  <span>•</span>
                  <span className="text-emerald-400">Watermark-Free Eligible</span>
                </div>
              </div>
            </div>

            {/* Quality Selector */}
            <div>
              <label className="block text-xs font-bold text-purple-300 mb-2">
                Select Available Video Quality:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {videoInfo.qualities?.map((q: any) => {
                  const isQSelected = selectedQuality === q.id;
                  return (
                    <div
                      key={q.id}
                      onClick={() => {
                        sound.playTingTing();
                        setSelectedQuality(q.id);
                      }}
                      className={`p-3.5 rounded-2xl cursor-pointer border transition ${
                        isQSelected
                          ? 'bg-purple-950/80 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                          : 'bg-[#0a0314]/80 border-purple-900/50 hover:border-purple-600/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{q.label}</span>
                        <span className="text-[10px] font-mono text-purple-400">{q.size}</span>
                      </div>
                      <p className="text-[10px] text-emerald-400 mt-1">Watermark Free MP4</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={handleTriggerDownload}
              disabled={downloading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:opacity-95 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.5)] transition cursor-pointer disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Packaging Video File...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Download {selectedQuality.toUpperCase()} Video Now</span>
                </>
              )}
            </button>

            {/* iPhone Safari Photos Guidance */}
            <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-200/90 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>iPhone Safari Users Tip:</span>
              </div>
              <p>
                After tapping download, Safari will open the video. Tap the iOS <strong>Share</strong> button (square with arrow) and tap <strong>"Save Video"</strong> to save directly into your Camera Roll / Photos album.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
