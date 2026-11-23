import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  Bell, 
  Calendar, 
  ExternalLink,
  Search,
  X,
  User,
  LogOut
} from 'lucide-react';
import { fetchWeeklyAiringAnime, type AiringScheduleItem } from './services/anilist';
import { 
  JAPAN_STATIONS, 
  fetchCurrentTrack, 
  fetchSongHistory, 
  type RadioStation, 
  type TrackItem 
} from './services/radioStations';
import { getSavedProfile, saveProfile, type UserProfile } from './services/authService';
import RadioView from './components/RadioView';
import BottomNav, { type NavTab } from './components/BottomNav';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';

// Helper component for live ticking mini countdown on cards
function CardCountdown({ airingAt }: { airingAt: number }) {
  const [remaining, setRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = Math.max(0, airingAt - now);
      setRemaining({
        hours: Math.floor(diff / 3600),
        minutes: Math.floor((diff % 3600) / 60),
        seconds: diff % 60,
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [airingAt]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-1 font-mono text-[11px] font-semibold text-purple-300 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded-md">
      <Clock className="w-3 h-3 text-purple-400 flex-shrink-0 animate-pulse" />
      <span>
        {remaining.hours > 24 
          ? `${Math.floor(remaining.hours / 24)}d ${remaining.hours % 24}h` 
          : `${pad(remaining.hours)}:${pad(remaining.minutes)}:${pad(remaining.seconds)}`}
      </span>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('schedule');
  const [scheduleList, setScheduleList] = useState<AiringScheduleItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<AiringScheduleItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [gmtTime, setGmtTime] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [reminded, setReminded] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // User Profile & Auth
  const [userProfile, setUserProfile] = useState<UserProfile>(getSavedProfile());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [pendingLikedTrack, setPendingLikedTrack] = useState<{
    title: string;
    artist: string;
    stationName: string;
    city: string;
  } | null>(null);

  // Radio Audio Player State & Live Track Tracking
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(JAPAN_STATIONS[0]);
  const [currentTrack, setCurrentTrack] = useState<TrackItem | null>(null);
  const [songHistory, setSongHistory] = useState<TrackItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldPlayRef = useRef<boolean>(false);
  const currentStationRef = useRef<RadioStation | null>(JAPAN_STATIONS[0]);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stallTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTimeRef = useRef<number>(0);
  const frozenCountRef = useRef<number>(0);

  // Keep station ref in sync
  useEffect(() => {
    currentStationRef.current = currentStation;
  }, [currentStation]);

  // Robust live stream playback connector
  const connectAndPlay = (station: RadioStation) => {
    if (!station) return;
    shouldPlayRef.current = true;
    setIsBuffering(true);

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (stallTimeoutRef.current) {
      clearTimeout(stallTimeoutRef.current);
      stallTimeoutRef.current = null;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'none';
    }

    const audio = audioRef.current;
    audio.pause();
    // Unique live query parameter busts proxy/browser socket caches for a fresh live pipe
    audio.src = `${station.streamUrl}?live=${Date.now()}`;
    audio.load();
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        setIsBuffering(false);
        frozenCountRef.current = 0;
        lastTimeRef.current = 0;
      })
      .catch((err) => {
        console.warn('[OtakuGMT Audio] Playback deferred or interrupted:', err);
        if (shouldPlayRef.current) {
          scheduleReconnect('Initial connection failed');
        }
      });
  };

  // Scheduled reconnection with debouncing
  const scheduleReconnect = (reason: string) => {
    if (!shouldPlayRef.current || !currentStationRef.current) return;
    console.warn(`[OtakuGMT Watchdog] Triggering auto-reconnect: ${reason}`);
    setIsBuffering(true);

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      if (shouldPlayRef.current && currentStationRef.current) {
        connectAndPlay(currentStationRef.current);
      }
    }, 1200);
  };

  // Initialize Audio & Attach Watchdog Event Listeners
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audioRef.current = audio;

    const onPlay = () => {
      setIsPlaying(true);
      setIsBuffering(false);
      frozenCountRef.current = 0;
    };

    const onPlaying = () => {
      setIsPlaying(true);
      setIsBuffering(false);
      frozenCountRef.current = 0;
    };

    const onPause = () => {
      if (!shouldPlayRef.current) {
        setIsPlaying(false);
        setIsBuffering(false);
      }
    };

    const onWaiting = () => {
      if (shouldPlayRef.current) {
        setIsBuffering(true);
      }
    };

    const onStalled = () => {
      if (shouldPlayRef.current) {
        setIsBuffering(true);
        if (!stallTimeoutRef.current) {
          stallTimeoutRef.current = setTimeout(() => {
            stallTimeoutRef.current = null;
            if (shouldPlayRef.current) {
              scheduleReconnect('Stream stalled');
            }
          }, 3500);
        }
      }
    };

    const onError = () => {
      if (shouldPlayRef.current) {
        scheduleReconnect('Socket/Network error');
      } else {
        setIsPlaying(false);
        setIsBuffering(false);
      }
    };

    const onEnded = () => {
      if (shouldPlayRef.current) {
        scheduleReconnect('Server closed live stream');
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('stalled', onStalled);
    audio.addEventListener('error', onError);
    audio.addEventListener('ended', onEnded);

    // Stream Freeze / Silence Watchdog Interval (every 3.5s)
    const watchdogInterval = setInterval(() => {
      if (!shouldPlayRef.current || !audioRef.current) return;
      const curTime = audioRef.current.currentTime;
      const isPaused = audioRef.current.paused;

      if (isPaused) {
        scheduleReconnect('Audio unexpectedly paused');
      } else if (curTime > 0 && Math.abs(curTime - lastTimeRef.current) < 0.05) {
        frozenCountRef.current++;
        if (frozenCountRef.current >= 2) {
          frozenCountRef.current = 0;
          scheduleReconnect('Stream buffer frozen');
        }
      } else {
        frozenCountRef.current = 0;
        lastTimeRef.current = curTime;
      }
    }, 3500);

    return () => {
      clearInterval(watchdogInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      audio.pause();
      audio.src = '';
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('stalled', onStalled);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  // MediaSession API Integration for uninterrupted background playback
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentStation) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack?.title || currentStation.name,
        artist: currentTrack?.artist !== currentStation.name ? currentTrack?.artist : currentStation.genre,
        album: `OtakuGMT • ${currentStation.city}`,
        artwork: [
          { src: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=512&q=80', sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      navigator.mediaSession.setActionHandler('play', () => {
        if (!isPlaying && currentStationRef.current) {
          connectAndPlay(currentStationRef.current);
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        shouldPlayRef.current = false;
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        shouldPlayRef.current = false;
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
        setIsPlaying(false);
      });
    } catch (err) {
      console.warn('MediaSession notice:', err);
    }
  }, [currentStation, currentTrack, isPlaying]);

  // Poll current track metadata for the active station globally
  useEffect(() => {
    let isMounted = true;
    if (!currentStation) return;

    const syncTrack = async () => {
      setLoadingHistory(true);
      const [track, history] = await Promise.all([
        fetchCurrentTrack(currentStation),
        fetchSongHistory(currentStation),
      ]);
      if (isMounted) {
        setCurrentTrack(track);
        setSongHistory(history);
        setLoadingHistory(false);
      }
    };

    syncTrack();
    const interval = setInterval(syncTrack, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentStation]);

  // Update Audio source when station changes
  const handleSelectStation = (station: RadioStation) => {
    setCurrentStation(station);
    connectAndPlay(station);
  };

  const handleTogglePlay = () => {
    if (!currentStation) return;
    if (isPlaying || shouldPlayRef.current) {
      shouldPlayRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setIsPlaying(false);
      setIsBuffering(false);
    } else {
      connectAndPlay(currentStation);
    }
  };

  const handleToggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Like Track Handler
  const handleLikeTrack = (track: { title: string; artist: string; stationName: string; city: string }) => {
    if (!userProfile.isLoggedIn) {
      setPendingLikedTrack(track);
      setIsAuthOpen(true);
      return;
    }

    const exists = userProfile.likedTracks.some(
      t => t.title === track.title
    );

    let updatedList = [];
    if (exists) {
      updatedList = userProfile.likedTracks.filter(
        t => t.title !== track.title
      );
    } else {
      updatedList = [
        {
          id: Date.now(),
          title: track.title,
          artist: track.artist,
          stationName: track.stationName,
          city: track.city,
          savedAt: new Date().toISOString(),
        },
        ...userProfile.likedTracks,
      ];
    }

    const updatedProfile = { ...userProfile, likedTracks: updatedList };
    setUserProfile(updatedProfile);
    saveProfile(updatedProfile);
  };

  // Remove single liked track
  const handleRemoveLikedTrack = (id: string | number) => {
    const updated = {
      ...userProfile,
      likedTracks: userProfile.likedTracks.filter(t => t.id !== id),
    };
    setUserProfile(updated);
    saveProfile(updated);
  };

  // Complete Auth success (auto-saves pending track if any)
  const handleAuthSuccess = (username: string) => {
    let initialTracks = userProfile.likedTracks;
    if (pendingLikedTrack) {
      initialTracks = [
        {
          id: Date.now(),
          title: pendingLikedTrack.title,
          artist: pendingLikedTrack.artist,
          stationName: pendingLikedTrack.stationName,
          city: pendingLikedTrack.city,
          savedAt: new Date().toISOString(),
        },
        ...initialTracks,
      ];
    }

    const newProfile: UserProfile = {
      id: `usr_${Date.now()}`,
      username,
      avatarSeed: username,
      isLoggedIn: true,
      likedTracks: initialTracks,
    };

    setUserProfile(newProfile);
    saveProfile(newProfile);
    setPendingLikedTrack(null);
  };

  const handleLogout = () => {
    const guest: UserProfile = {
      id: 'guest',
      username: 'Guest Otaku',
      avatarSeed: 'Spike',
      isLoggedIn: false,
      likedTracks: [],
    };
    setUserProfile(guest);
    saveProfile(guest);
  };

  // Focus input when search bar opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Real-time GMT Master Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setGmtTime(
        now.toLocaleTimeString('en-GB', {
          timeZone: 'UTC',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch full weekly airing schedule
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchWeeklyAiringAnime();
      setScheduleList(data);
      if (data.length > 0) {
        setSelectedItem(data[0]);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // Live countdown for the Big Hero timer
  useEffect(() => {
    if (!selectedItem) return;

    const targetUnix = selectedItem.airingAt;

    const updateCountdown = () => {
      const nowUnix = Math.floor(Date.now() / 1000);
      const diff = Math.max(0, targetUnix - nowUnix);

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [selectedItem]);

  // Format GMT timestamp for badges
  const formatGmtDate = (unixSeconds: number) => {
    const date = new Date(unixSeconds * 1000);
    return date.toLocaleDateString('en-GB', {
      timeZone: 'UTC',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' GMT';
  };

  // Filter list by search keyword
  const filteredList = scheduleList.filter(item => {
    const title = (item.media.title.english || item.media.title.romaji || '').toLowerCase();
    return title.includes(searchFilter.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#08090C] text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white pb-36">
      
      {/* Background Ambience / Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/4 -right-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-[140px]" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#08090C]/90 border-b border-white/5 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Local Region Badge */}
          <div 
            onClick={() => setActiveTab('schedule')}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-[1px] flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
              <div className="w-full h-full bg-[#0d0e12] rounded-[11px] flex items-center justify-center">
                <span className="font-extrabold text-base tracking-tighter bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Ω</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white font-['Space_Grotesk'] whitespace-nowrap">Otaku<span className="text-purple-400">GMT</span></span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-white/5 border border-white/10 text-slate-300 whitespace-nowrap">GH · AF</span>
              </div>
            </div>
          </div>

          {/* Center: Live GMT Clock */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs flex-shrink-0">
            <span className="text-slate-400 font-medium">LIVE GMT:</span>
            <span className="font-mono font-bold text-emerald-400">{gmtTime || '00:00:00'}</span>
          </div>

          {/* Right Action: Search + User Profile Action */}
          <div className="flex items-center gap-2.5">
            {activeTab === 'schedule' && (
              <button
                onClick={() => {
                  if (isSearchOpen) {
                    setSearchFilter('');
                    setIsSearchOpen(false);
                  } else {
                    setIsSearchOpen(true);
                  }
                }}
                className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
                  isSearchOpen 
                    ? 'bg-purple-600/20 border-purple-500/50 text-purple-300' 
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
                }`}
                title={isSearchOpen ? 'Close search' : 'Search anime'}
              >
                {isSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              </button>
            )}

            {/* Profile Avatar / Login Button */}
            {userProfile.isLoggedIn ? (
              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 pl-2.5 pr-2.5 py-1.5 rounded-xl transition-colors"
                title="Open Profile"
              >
                <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                  {userProfile.username[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-xs font-semibold text-purple-300 max-w-[90px] truncate">
                  {userProfile.username}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-md shadow-purple-600/25"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>

        </div>

        {/* Dedicated Search Drawer Under Header */}
        {isSearchOpen && activeTab === 'schedule' && (
          <div className="max-w-7xl mx-auto pt-3 pb-1 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="relative flex items-center bg-[#0d0e14] border border-purple-500/40 rounded-2xl px-3.5 py-2.5 shadow-xl shadow-purple-950/30">
              <Search className="w-4 h-4 text-purple-400 mr-2.5 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search airing anime this week..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors mr-1 flex-shrink-0 text-xs"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => {
                  setSearchFilter('');
                  setIsSearchOpen(false);
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors flex-shrink-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 flex-1 w-full flex flex-col gap-6 relative z-10">
        
        {/* VIEW 1: RADIO RADAR VIEW (Shifted Up Cleanly) */}
        {activeTab === 'radio' && (
          <RadioView 
            currentStation={currentStation}
            isPlaying={isPlaying}
            onSelectStation={handleSelectStation}
          />
        )}

        {/* VIEW 2: SCHEDULE VIEW */}
        {activeTab === 'schedule' && (
          <>
            {/* HERO: The Auto-Selected Closest Anime Airing */}
            {loading ? (
              <div className="w-full h-80 rounded-3xl bg-white/5 animate-pulse border border-white/5 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400">Loading this week's airing schedule from AniList...</p>
                </div>
              </div>
            ) : selectedItem ? (
              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0e1017]">
                {/* Background Artwork */}
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-30 transform scale-105 transition-all duration-700 blur-[2px]"
                  style={{
                    backgroundImage: `url(${selectedItem.media.bannerImage || selectedItem.media.coverImage.extraLarge})`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-[#08090C]/85 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#08090C] via-[#08090C]/90 to-transparent" />

                <div className="relative p-6 sm:p-10 lg:p-12 flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
                  
                  {/* Left Column: Details */}
                  <div className="flex-1 max-w-2xl">
                    
                    {/* Status Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 border border-purple-500/30 text-purple-300">
                        NEXT AIRING EPISODE
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">
                        Ep {selectedItem.episode}
                      </span>
                      {selectedItem.media.averageScore && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-emerald-300">
                          ★ {selectedItem.media.averageScore}%
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight font-['Space_Grotesk'] mb-2">
                      {selectedItem.media.title.english || selectedItem.media.title.romaji}
                    </h1>
                    
                    {selectedItem.media.title.english && (
                      <p className="text-sm sm:text-base text-slate-400 font-medium mb-4">
                        {selectedItem.media.title.romaji}
                      </p>
                    )}

                    {/* Genres */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {selectedItem.media.genres.map(genre => (
                        <span key={genre} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-slate-300 font-medium">
                          {genre}
                        </span>
                      ))}
                    </div>

                    {/* Exact GMT Airing Target */}
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 bg-white/5 border border-white/5 px-3.5 py-2 rounded-xl w-fit mb-6">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <span>Drops:</span>
                      <strong className="text-slate-200">
                        {formatGmtDate(selectedItem.airingAt)}
                      </strong>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                      <button 
                        onClick={() => setReminded(!reminded)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg ${
                          reminded 
                            ? 'bg-emerald-500 text-black shadow-emerald-500/25' 
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/25'
                        }`}
                      >
                        <Bell className="w-4 h-4" />
                        {reminded ? 'Set' : 'Notify'}
                      </button>

                      <a 
                        href={`https://anilist.co/anime/${selectedItem.media.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-colors"
                      >
                        <span>AniList Page</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                  </div>

                  {/* Right Column: Big Countdown Display */}
                  <div className="w-full lg:w-auto flex-shrink-0">
                    <div className="p-6 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 flex flex-col items-center justify-center min-w-[280px] shadow-2xl">
                      
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                        <Clock className="w-4 h-4 text-purple-400" />
                        Live GMT Countdown
                      </div>

                      {/* Digits Display */}
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-mono text-2xl sm:text-3xl font-bold text-white shadow-inner">
                            {String(timeLeft.hours).padStart(2, '0')}
                          </div>
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 mt-1 font-semibold">Hours</span>
                        </div>

                        <span className="text-2xl font-bold text-purple-400 -mt-4">:</span>

                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-mono text-2xl sm:text-3xl font-bold text-white shadow-inner">
                            {String(timeLeft.minutes).padStart(2, '0')}
                          </div>
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 mt-1 font-semibold">Mins</span>
                        </div>

                        <span className="text-2xl font-bold text-purple-400 -mt-4">:</span>

                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-mono text-2xl sm:text-3xl font-bold text-purple-300 shadow-inner">
                            {String(timeLeft.seconds).padStart(2, '0')}
                          </div>
                          <span className="text-[10px] uppercase tracking-wider text-purple-400 mt-1 font-semibold">Secs</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-4 text-center">
                        Airs synchronized globally in Greenwich Mean Time (GMT)
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            ) : null}

            {/* SECTION: Full Airing Grid with Mini Countdown Clocks */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
                    <span>Airing This Week</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-semibold">
                      {filteredList.length} Shows
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Every title has its own live countdown clock. Click any title to feature it in the hero.
                  </p>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {filteredList.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  const title = item.media.title.english || item.media.title.romaji;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`group cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col bg-[#0e1017] ${
                        isSelected 
                          ? 'border-purple-500 ring-2 ring-purple-500/40 shadow-xl shadow-purple-500/10 -translate-y-1' 
                          : 'border-white/5 hover:border-white/20 hover:-translate-y-0.5'
                      }`}
                    >
                      {/* Poster Thumbnail */}
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900">
                        <img 
                          src={item.media.coverImage.large} 
                          alt={title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                        
                        {/* Top Pill: Episode Number */}
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 backdrop-blur-md border border-white/10 text-white">
                            Ep {item.episode}
                          </span>
                        </div>

                        {/* Bottom Live Countdown Pill on the Image */}
                        <div className="absolute bottom-2 left-2 right-2 flex justify-center">
                          <CardCountdown airingAt={item.airingAt} />
                        </div>
                      </div>

                      {/* Card Info */}
                      <div className="p-3 flex-1 flex flex-col justify-between gap-1.5">
                        <h3 className="text-xs font-bold text-slate-200 line-clamp-2 group-hover:text-purple-300 transition-colors leading-snug">
                          {title}
                        </h3>
                        
                        {/* GMT Time indicator */}
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono pt-1 border-t border-white/5">
                          <Calendar className="w-3 h-3 text-purple-400 flex-shrink-0" />
                          <span className="truncate">
                            {new Date(item.airingAt * 1000).toLocaleDateString('en-GB', {
                              timeZone: 'UTC',
                              weekday: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })} GMT
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Minimal Footer (Schedule view only) */}
        {activeTab === 'schedule' && (
          <footer className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <div>
              <span>OtakuGMT · Schedules sourced via AniList</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hover:text-slate-400 cursor-pointer">Terms & DMCA</span>
              <span className="hover:text-slate-400 cursor-pointer">Ghana Otaku Community</span>
            </div>
          </footer>
        )}

      </main>

      {/* Floating Bottom Navigation Bar (Spotify Ultra-Transparent Style) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentStation={currentStation}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isBuffering={isBuffering}
        onTogglePlay={handleTogglePlay}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Profile & History Drawer (Option A) */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userProfile={userProfile}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Sign In / Sign Up Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        pendingTrackTitle={pendingLikedTrack?.title}
        onSuccess={handleAuthSuccess}
      />

    </div>
  );
}
