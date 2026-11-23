import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  Loader2,
  Volume2,
  VolumeX,
  Volume1,
  Heart,
  Share2,
  Radio,
  Signal,
  Sparkles,
  Disc3,
  Check,
  Info,
  RadioTower,
  Sliders,
  ListMusic
} from 'lucide-react';
import { JAPAN_STATIONS, type RadioStation, type TrackItem } from '../services/radioStations';

export interface NowPlayingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStation: RadioStation | null;
  currentTrack: TrackItem | null;
  isPlaying: boolean;
  isBuffering?: boolean;
  onTogglePlay: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  volume?: number; // 0 to 100
  onChangeVolume?: (volume: number) => void;
  onSelectStation: (station: RadioStation) => void;
  stations?: RadioStation[];
  isLiked?: boolean;
  onLikeTrack?: (track: {
    title: string;
    artist: string;
    stationName: string;
    city: string;
  }) => void;
  onShareStation?: (station: RadioStation) => void;
  songHistory?: TrackItem[];
}

interface StationTheme {
  accent: string;
  glow: string;
  gradient: string;
  coverImage: string;
  frequency: string;
  callsign: string;
}

const STATION_THEMES: Record<string, StationTheme> = {
  'fm-setagaya': {
    accent: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.3)',
    gradient: 'from-amber-600/30 via-orange-600/10 to-transparent',
    coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&q=80',
    frequency: '83.4 MHz FM',
    callsign: 'JOZZ3BA-FM',
  },
  'jpop-powerplay': {
    accent: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.3)',
    gradient: 'from-pink-600/30 via-purple-600/10 to-transparent',
    coverImage: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
    frequency: 'Trending Hits',
    callsign: 'KANSAI-NET',
  },
  'asia-dream-japan': {
    accent: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.3)',
    gradient: 'from-purple-600/30 via-indigo-600/10 to-transparent',
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
    frequency: '80s-2000s City Hits',
    callsign: 'SHIBUYA-FM',
  },
  'gensokyo-radio-1': {
    accent: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.3)',
    gradient: 'from-red-600/30 via-rose-600/10 to-transparent',
    coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80',
    frequency: 'Touhou Doujin Live',
    callsign: 'KYOTO-AIR',
  },
  'gensokyo-radio-3': {
    accent: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.3)',
    gradient: 'from-cyan-600/30 via-blue-600/10 to-transparent',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
    frequency: '256kbps Hi-Res',
    callsign: 'KYOTO-HD',
  },
};

const DEFAULT_THEME: StationTheme = {
  accent: '#a855f7',
  glow: 'rgba(168, 85, 247, 0.3)',
  gradient: 'from-purple-600/30 via-violet-600/10 to-transparent',
  coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80',
  frequency: 'Live Terrestrial FM',
  callsign: 'JAPAN-FM',
};

export function NowPlayingModal({
  isOpen,
  onClose,
  currentStation,
  currentTrack,
  isPlaying,
  isBuffering = false,
  onTogglePlay,
  isMuted,
  onToggleMute,
  volume = 80,
  onChangeVolume,
  onSelectStation,
  stations = JAPAN_STATIONS,
  isLiked = false,
  onLikeTrack,
  onShareStation,
  songHistory = [],
}: NowPlayingModalProps) {
  const [localVolume, setLocalVolume] = useState<number>(volume);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [showHistorySheet, setShowHistorySheet] = useState<boolean>(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState<boolean>(false);
  const stationListRef = useRef<HTMLDivElement>(null);

  // Sync external volume
  useEffect(() => {
    if (volume !== undefined) {
      setLocalVolume(volume);
    }
  }, [volume]);

  // Keyboard accessibility: ESC closes modal, Space toggles play/pause
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        onTogglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onTogglePlay]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const activeStation = currentStation || stations[0];
  const stationTheme = (activeStation && STATION_THEMES[activeStation.id]) || DEFAULT_THEME;

  const displayTitle = currentTrack?.title || activeStation?.name || 'Live Broadcast';
  const displayArtist =
    currentTrack?.artist && currentTrack.artist !== activeStation?.name
      ? currentTrack.artist
      : activeStation?.genre || 'Japanese Terrestrial FM';
  const displayLocation = activeStation
    ? `${activeStation.city} · ${activeStation.region}`
    : 'Tokyo, Japan';

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setLocalVolume(val);
    if (onChangeVolume) {
      onChangeVolume(val);
    }
  };

  const handleHeartClick = () => {
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 500);

    if (onLikeTrack && activeStation) {
      onLikeTrack({
        title: displayTitle,
        artist: displayArtist,
        stationName: activeStation.name,
        city: activeStation.city,
      });
    }
  };

  const handleShare = async () => {
    if (!activeStation) return;

    if (onShareStation) {
      onShareStation(activeStation);
      return;
    }

    const shareData = {
      title: `${activeStation.name} - OtakuGMT Radio`,
      text: `Listening to ${displayTitle} by ${displayArtist} live on ${activeStation.name} (${activeStation.city}) via OtakuGMT!`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(
        `${shareData.text} 📻 ${window.location.href}`
      );
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    } catch {
      // Ignored
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center items-center bg-black/85 backdrop-blur-3xl animate-in fade-in duration-300 select-none">
      
      {/* Background click dismiss for desktop modal mode */}
      <div 
        onClick={onClose} 
        className="hidden md:block absolute inset-0 -z-10"
        aria-hidden="true" 
      />

      {/* Main Full-Screen Player Sheet Container */}
      <div 
        className="relative w-full h-[100dvh] md:h-[92vh] md:max-h-[860px] md:max-w-lg md:rounded-[40px] flex flex-col justify-between overflow-hidden bg-[#0a0a0f] text-white shadow-[0_0_80px_rgba(0,0,0,0.9)] border-t md:border border-white/10 animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Now Playing Full Screen"
      >
        
        {/* Dynamic Ambient Background Glows */}
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-700 opacity-60 overflow-hidden -z-10"
          style={{
            background: `radial-gradient(circle at 50% 15%, ${stationTheme.accent}33 0%, rgba(10, 10, 15, 0.95) 70%)`
          }}
        >
          {/* Animated Ambient Pulsing Orbs */}
          <div 
            className={`absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[90px] transition-transform duration-1000 ${
              isPlaying ? 'scale-125 opacity-70 animate-pulse' : 'scale-90 opacity-30'
            }`}
            style={{ backgroundColor: stationTheme.accent }}
          />
          <div 
            className="absolute bottom-10 right-0 w-80 h-80 rounded-full blur-[100px] opacity-20 pointer-events-none"
            style={{ backgroundColor: stationTheme.accent }}
          />
        </div>

        {/* TOP BAR: Collapse Chevron, Station Header, Share/History buttons */}
        <header className="flex-shrink-0 pt-3 px-4 sm:px-6 pb-2 flex flex-col gap-1.5 z-10">
          
          {/* Mobile Swipe-down indicator pill */}
          <button
            onClick={onClose}
            className="w-12 h-1 bg-white/25 hover:bg-white/50 rounded-full mx-auto mb-1 md:hidden cursor-pointer transition-colors"
            title="Slide down to close"
            aria-label="Slide down to close"
          />

          <div className="flex items-center justify-between">
            {/* Collapse Button */}
            <button
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/20"
              title="Collapse Player"
              aria-label="Collapse Player"
            >
              <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Station Title & Live Frequency Center Header */}
            <div className="flex flex-col items-center text-center px-2 min-w-0 max-w-[65%]">
              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                PLAYING FROM RADIO
              </span>
              <h2 className="text-xs sm:text-sm font-bold text-slate-100 truncate w-full tracking-tight">
                {activeStation?.name || 'Tokyo Radio'}
              </h2>
              <span className="text-[10px] text-purple-300/80 font-mono truncate">
                {stationTheme.frequency} · {activeStation?.city}
              </span>
            </div>

            {/* Top Right Actions: Share & History Toggle */}
            <div className="flex items-center gap-1">
              {songHistory.length > 0 && (
                <button
                  onClick={() => setShowHistorySheet(!showHistorySheet)}
                  className={`p-2 sm:p-2.5 rounded-full transition-all focus:outline-none ${
                    showHistorySheet
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
                  }`}
                  title="Station Playlist History"
                  aria-label="Station Playlist History"
                >
                  <ListMusic className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              <button
                onClick={handleShare}
                className="relative p-2 sm:p-2.5 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/20"
                title="Share Station & Track"
                aria-label="Share Station & Track"
              >
                {copiedShare ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                ) : (
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                )}

                {/* Copied tooltip popup */}
                {copiedShare && (
                  <span className="absolute -bottom-8 right-0 text-[10px] bg-emerald-500 text-black font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap animate-in fade-in">
                    Copied!
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* HERO CENTER: Large Stylized Vinyl Record / Visualizer */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-2 relative min-h-0">
          
          {/* Vinyl Container */}
          <div className="relative flex items-center justify-center w-full max-w-[270px] sm:max-w-[310px] aspect-square">
            
            {/* Ambient Halo behind vinyl */}
            <div 
              className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 pointer-events-none ${
                isPlaying ? 'scale-110 opacity-70' : 'scale-95 opacity-20'
              }`}
              style={{
                boxShadow: `0 0 70px ${stationTheme.accent}40`,
                backgroundColor: `${stationTheme.accent}20`
              }}
            />

            {/* Glowing Outer Boundary Ring */}
            <div className="absolute inset-[-4px] rounded-full border border-white/10 pointer-events-none" />

            {/* Realistic Vinyl Disc */}
            <div 
              onClick={onTogglePlay}
              className="relative w-full h-full rounded-full cursor-pointer shadow-[0_15px_45px_rgba(0,0,0,0.85)] flex items-center justify-center overflow-hidden transition-transform duration-300 active:scale-95 group"
              style={{
                background: 'radial-gradient(circle, #1a1a24 0%, #0d0d12 45%, #050508 100%)',
              }}
              title={isPlaying ? 'Tap to pause' : 'Tap to play'}
            >
              {/* Concentric Grooves (Micro Vinyl Texture) */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none opacity-40"
                style={{
                  background: 'repeating-radial-gradient(circle, transparent, transparent 3px, rgba(255,255,255,0.06) 4px, rgba(0,0,0,0.3) 5px)',
                }}
              />

              {/* Gloss Vinyl Sheen / Light Reflection Overlay */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none opacity-35"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%, rgba(255,255,255,0.2) 100%)',
                }}
              />

              {/* Rotating Record Assembly: Label + Artwork */}
              <div 
                className="relative w-full h-full rounded-full flex items-center justify-center transition-transform"
                style={{
                  animation: 'spin 18s linear infinite',
                  animationPlayState: isPlaying ? 'running' : 'paused',
                }}
              >
                {/* Vinyl Tone Rings */}
                <div className="absolute inset-6 rounded-full border border-white/5 pointer-events-none" />
                <div className="absolute inset-12 rounded-full border border-white/5 pointer-events-none" />
                <div className="absolute inset-20 rounded-full border border-white/10 pointer-events-none" />

                {/* Center Label Circle with Station Cover */}
                <div 
                  className="relative w-[48%] h-[48%] rounded-full overflow-hidden shadow-inner border-2 border-[#12131b] flex items-center justify-center"
                  style={{
                    backgroundColor: stationTheme.accent,
                  }}
                >
                  <img
                    src={stationTheme.coverImage}
                    alt={activeStation?.name || 'Radio Artwork'}
                    className="w-full h-full object-cover filter brightness-90 group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  
                  {/* Circular Station Badge Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col items-center justify-end pb-2">
                    <span className="text-[8px] font-black uppercase tracking-wider text-white font-mono drop-shadow-md">
                      {stationTheme.callsign}
                    </span>
                  </div>

                  {/* Center Spindle Hole */}
                  <div className="absolute w-5 h-5 rounded-full bg-black border-2 border-slate-300 shadow-md flex items-center justify-center z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  </div>
                </div>

              </div>

              {/* Center Play Overlay Icon on Hover or Paused */}
              {(!isPlaying || isBuffering) && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-full flex items-center justify-center transition-opacity">
                  <div className="w-14 h-14 rounded-full bg-white/95 text-black flex items-center justify-center shadow-2xl shadow-black/80 hover:scale-110 transition-transform">
                    {isBuffering ? (
                      <Loader2 className="w-6 h-6 text-black animate-spin" />
                    ) : (
                      <Play className="w-6 h-6 fill-black ml-1 text-black" />
                    )}
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Quick Real-Time Broadcast Status Pill */}
          <div className="mt-4 flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              <span className="text-[11px] font-mono font-medium text-slate-300">
                {isBuffering ? 'Buffering Live Stream...' : isPlaying ? 'On-Air Terrestrial Stream' : 'Live Broadcast Paused'}
              </span>
              <span className="text-[9px] text-purple-300 font-mono font-bold bg-purple-500/20 px-1.5 py-0.2 rounded border border-purple-500/30">
                {activeStation?.bitrate ? `${activeStation.bitrate}k` : '128k'}
              </span>
            </div>
          </div>

        </div>

        {/* SONG HISTORY DRAWER OVERLAY (Optional Drawer within modal) */}
        {showHistorySheet && songHistory.length > 0 && (
          <div className="absolute inset-x-0 bottom-0 top-16 bg-[#0e0f18]/95 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl z-30 p-5 flex flex-col gap-3 animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Recent Tracks on {activeStation?.name}
                </h3>
              </div>
              <button
                onClick={() => setShowHistorySheet(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {songHistory.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.title}</p>
                    <p className="text-[11px] text-purple-300 truncate">{item.artist}</p>
                  </div>
                  {item.startedAt && (
                    <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                      {new Date(item.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TRACK METADATA & AUDIO WAVE BARS */}
        <div className="flex-shrink-0 px-6 sm:px-8 py-2 flex flex-col gap-1.5 z-10">
          
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Prominent Track Title */}
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug line-clamp-2">
                {displayTitle}
              </h1>

              {/* Artist Name & Station Details */}
              <p className="text-sm sm:text-base font-semibold text-purple-300 truncate mt-0.5">
                {displayArtist}
              </p>

              {/* City / Genre Location Tag */}
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
                <RadioTower className="w-3.5 h-3.5 text-purple-400" />
                <span className="truncate">{displayLocation}</span>
                <span>·</span>
                <span className="text-purple-400 font-semibold">{activeStation?.genre}</span>
              </p>
            </div>

            {/* Heart / Bookmark Button */}
            <button
              onClick={handleHeartClick}
              className={`p-3 rounded-2xl flex items-center justify-center transition-all active:scale-75 ${
                isLiked
                  ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40 shadow-lg shadow-rose-500/20'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
              } ${isLikeAnimating ? 'scale-125' : ''}`}
              title={isLiked ? 'Liked Track' : 'Like / Bookmark Track'}
              aria-label={isLiked ? 'Liked Track' : 'Like / Bookmark Track'}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-rose-500' : ''}`} />
            </button>
          </div>

          {/* Animated Equalizer Wave Bars */}
          <div className="flex items-center gap-1 h-5 mt-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mr-1.5">
              Signal:
            </span>
            {[
              { height: 'h-4', delay: '0ms' },
              { height: 'h-2', delay: '120ms' },
              { height: 'h-5', delay: '240ms' },
              { height: 'h-3', delay: '80ms' },
              { height: 'h-5', delay: '180ms' },
              { height: 'h-2.5', delay: '300ms' },
              { height: 'h-4', delay: '150ms' },
              { height: 'h-3', delay: '210ms' },
            ].map((bar, idx) => (
              <span
                key={idx}
                className={`w-1 rounded-full transition-all duration-300 ${
                  isPlaying
                    ? 'bg-gradient-to-t from-purple-500 to-pink-400 animate-pulse'
                    : 'bg-slate-700 h-1.5'
                } ${isPlaying ? bar.height : ''}`}
                style={{
                  animationDelay: bar.delay,
                  animationDuration: isPlaying ? '0.7s' : undefined,
                }}
              />
            ))}
            <span className="text-[10px] font-mono text-purple-400/80 ml-2">
              {isPlaying ? 'ACTIVE' : 'IDLE'}
            </span>
          </div>

        </div>

        {/* CONTROLS BAR: Mute, Big Spotify Play/Pause, Volume Slider */}
        <div className="flex-shrink-0 px-6 sm:px-8 pt-2 pb-3 flex flex-col gap-4 z-10">
          
          {/* Main Controls Row */}
          <div className="flex items-center justify-between px-2">
            
            {/* Audio Mute/Unmute toggle */}
            <button
              onClick={onToggleMute}
              className={`p-3 rounded-full transition-all active:scale-95 ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
              aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-rose-400" />
              ) : localVolume > 50 ? (
                <Volume2 className="w-5 h-5" />
              ) : localVolume > 0 ? (
                <Volume1 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>

            {/* Large Spotify Play / Pause Center Button */}
            <button
              onClick={onTogglePlay}
              disabled={isBuffering && !isPlaying}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white hover:bg-slate-100 active:scale-95 text-black flex items-center justify-center shadow-[0_8px_30px_rgba(255,255,255,0.25)] hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-purple-400/40 disabled:opacity-75 cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play Live Radio'}
              aria-label={isPlaying ? 'Pause Live Radio' : 'Play Live Radio'}
            >
              {isBuffering ? (
                <Loader2 className="w-7 h-7 text-black animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-7 h-7 fill-black text-black" />
              ) : (
                <Play className="w-7 h-7 fill-black text-black ml-1" />
              )}
            </button>

            {/* Station Info Quick Button */}
            <div className="relative group">
              <button
                onClick={handleShare}
                className="p-3 rounded-full bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                title="Share Station"
                aria-label="Share Station"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

          </div>

          {/* Interactive Volume Slider Bar */}
          <div className="flex items-center gap-3 px-2">
            <button
              onClick={onToggleMute}
              className="text-slate-400 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || localVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-slate-500" />
              ) : (
                <Volume1 className="w-4 h-4" />
              )}
            </button>

            {/* Custom Styled Slider */}
            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : localVolume}
                onChange={handleVolumeChange}
                className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all focus:outline-none"
                aria-label="Volume Slider"
              />
            </div>

            <Volume2 className="w-4 h-4 text-slate-400" />
            <span className="text-[11px] font-mono text-slate-400 w-8 text-right">
              {isMuted ? '0%' : `${localVolume}%`}
            </span>
          </div>

        </div>

        {/* QUICK STATION SWITCHER: Dropdown / Pill Row */}
        <div className="flex-shrink-0 bg-[#07070a]/90 backdrop-blur-xl border-t border-white/5 px-4 sm:px-6 py-3 z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
              <Radio className="w-3.5 h-3.5 text-purple-400" />
              Quick Station Switcher
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {stations.length} Available Channels
            </span>
          </div>

          {/* Horizontal Scrollable Pill Row */}
          <div
            ref={stationListRef}
            className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {stations.map((st) => {
              const isSelected = activeStation?.id === st.id;
              const theme = STATION_THEMES[st.id] || DEFAULT_THEME;

              return (
                <button
                  key={st.id}
                  onClick={() => onSelectStation(st)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-2xl flex-shrink-0 transition-all duration-200 border text-left ${
                    isSelected
                      ? 'bg-purple-600/30 border-purple-500/60 text-white shadow-lg shadow-purple-600/20'
                      : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-300 hover:text-white'
                  }`}
                  title={`${st.name} (${st.city})`}
                >
                  {/* Station Mini Thumbnail or Status Dot */}
                  <div
                    className="w-6 h-6 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-white/10"
                    style={{ backgroundColor: theme.accent }}
                  >
                    <img
                      src={theme.coverImage}
                      alt={st.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="truncate max-w-[120px] sm:max-w-[150px]">
                    <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                      {st.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {st.city}
                    </p>
                  </div>

                  {/* Active playing indicator badge */}
                  {isSelected && (
                    <div className="flex items-center gap-0.5 ml-1">
                      <span className="w-1 h-3 bg-purple-400 rounded-full animate-pulse" />
                      <span className="w-1 h-2 bg-purple-400 rounded-full animate-pulse delay-75" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}

export default NowPlayingModal;
