import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Calendar, 
  CalendarPlus, 
  Bell, 
  Check, 
  Star, 
  Users, 
  ExternalLink, 
  Tv, 
  Film, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Share2, 
  PlayCircle 
} from 'lucide-react';
import { type AiringScheduleItem } from '../services/anilist';

export interface AnimeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  anime: AiringScheduleItem | null;
  isReminded?: boolean;
  onToggleReminder?: (animeId: number) => void;
}

// Strip HTML tags and clean up AniList synopsis strings
function cleanDescription(desc?: string): string {
  if (!desc) return '';
  return desc
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .trim();
}

// Convert unix timestamp to Google Calendar template date string (UTC format: YYYYMMDDTHHmmssZ)
function formatGoogleCalendarDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// Format UTC/GMT date string for display (e.g. "Sun 24 Nov, 17:30 GMT")
function formatGmtDateTime(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1000);
  const weekday = date.toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short' });
  const day = date.toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric' });
  const month = date.toLocaleDateString('en-GB', { timeZone: 'UTC', month: 'short' });
  const time = date.toLocaleTimeString('en-GB', { 
    timeZone: 'UTC', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
  return `${weekday} ${day} ${month}, ${time} GMT`;
}

export function AnimeDetailModal({
  isOpen,
  onClose,
  anime,
  isReminded = false,
  onToggleReminder,
}: AnimeDetailModalProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isAired: false,
  });

  // Body scroll lock & ESC key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Live ticking countdown for this specific episode
  useEffect(() => {
    if (!anime?.airingAt) return;

    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = anime.airingAt - now;

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isAired: true });
        return;
      }

      setCountdown({
        days: Math.floor(diff / 86400),
        hours: Math.floor((diff % 86400) / 3600),
        minutes: Math.floor((diff % 3600) / 60),
        seconds: diff % 60,
        isAired: false,
      });
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [anime?.airingAt]);

  // Reset expanded state on anime change
  useEffect(() => {
    setIsExpanded(false);
    setCopied(false);
  }, [anime?.id]);

  if (!isOpen || !anime) return null;

  const titleEnglish = anime.media.title.english;
  const titleRomaji = anime.media.title.romaji;
  const mainTitle = titleEnglish || titleRomaji;
  const subTitle = titleEnglish && titleRomaji !== titleEnglish ? titleRomaji : null;
  const nativeTitle = anime.media.title.native;

  const bannerImg = anime.media.bannerImage || anime.media.coverImage.extraLarge || anime.media.coverImage.large;
  const posterImg = anime.media.coverImage.large || anime.media.coverImage.extraLarge;
  const score = anime.media.averageScore;
  const popularity = anime.media.popularity;
  const format = anime.media.format || 'TV';
  const studios = anime.media.studios?.nodes || [];
  const gmtDisplay = formatGmtDateTime(anime.airingAt);
  const rawDescription = cleanDescription(anime.media.description);
  const hasLongDescription = rawDescription.length > 240;

  // Google Calendar Template URL Generator
  const startDate = new Date(anime.airingAt * 1000);
  const endDate = new Date((anime.airingAt + 30 * 60) * 1000); // 30 min runtime estimate
  const startStr = formatGoogleCalendarDate(startDate);
  const endStr = formatGoogleCalendarDate(endDate);
  const calTitle = encodeURIComponent(`${mainTitle} - Episode ${anime.episode} (OtakuGMT)`);
  const calDetails = encodeURIComponent(
    `Airing Episode ${anime.episode} of ${mainTitle} globally synchronized in Greenwich Mean Time (GMT).\n\n` +
    `Exact Airing: ${gmtDisplay}\n` +
    `AniList Page: ${anime.media.siteUrl || `https://anilist.co/anime/${anime.media.id}`}\n` +
    `Tracked on OtakuGMT (Ghana / Africa)`
  );
  const calLocation = encodeURIComponent('OtakuGMT Airing • GMT/UTC Timezone');
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calTitle}&dates=${startStr}/${endStr}&details=${calDetails}&location=${calLocation}`;

  // Streaming platform search queries
  const searchQuery = encodeURIComponent(mainTitle);
  const crunchyrollUrl = `https://www.crunchyroll.com/search?q=${searchQuery}`;
  const netflixUrl = `https://www.netflix.com/search?q=${searchQuery}`;
  const museAsiaUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(mainTitle + ' episode ' + anime.episode + ' muse asia')}`;

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}?anime=${anime.media.id}&ep=${anime.episode}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback: copy title
      navigator.clipboard.writeText(`${mainTitle} - Episode ${anime.episode} (${gmtDisplay})`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md transition-all duration-300 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="anime-modal-title"
    >
      {/* Modal / Sheet Container */}
      <div 
        className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] bg-[#0e1017] border border-white/10 sm:border-purple-500/20 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-purple-950/40 flex flex-col overflow-hidden text-slate-100"
      >
        {/* Glow highlights */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 left-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-[90px] pointer-events-none" />

        {/* Scrollable Content */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 pb-6 overscroll-contain">
          
          {/* Header Backdrop Banner */}
          <div className="relative w-full h-48 sm:h-56 bg-slate-900 overflow-hidden flex-shrink-0">
            <img 
              src={bannerImg} 
              alt={mainTitle}
              className="w-full h-full object-cover object-center filter brightness-[0.75] scale-105"
            />
            {/* Smooth dark gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e1017] via-[#0e1017]/70 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0e1017]/90 via-transparent to-black/40" />

            {/* Prominent Close (X) Button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-slate-300 hover:text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer shadow-lg active:scale-95"
              title="Close modal (Esc)"
              aria-label="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Top Left Badges: Format & Score */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/60 backdrop-blur-md border border-white/15 text-slate-200 uppercase tracking-wider">
                {format === 'MOVIE' ? <Film className="w-3 h-3 text-cyan-400" /> : <Tv className="w-3 h-3 text-purple-400" />}
                <span>{format.replace('_', ' ')}</span>
              </span>

              {score && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/60 backdrop-blur-md border border-white/15 text-emerald-300">
                  <Star className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                  <span>{score}% Score</span>
                </span>
              )}

              {popularity && (
                <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/60 backdrop-blur-md border border-white/15 text-slate-300">
                  <Users className="w-3 h-3 text-indigo-400" />
                  <span>{(popularity).toLocaleString()} fans</span>
                </span>
              )}
            </div>
          </div>

          {/* Body Section with Floating Poster and Details */}
          <div className="px-5 sm:px-8 -mt-16 sm:-mt-20 relative z-10 flex flex-col gap-5">
            
            {/* Top Row: Floating Poster + Title Block */}
            <div className="flex gap-4 sm:gap-6 items-end sm:items-start">
              
              {/* Poster Thumbnail */}
              <div className="w-24 sm:w-32 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shadow-black/80 flex-shrink-0 bg-slate-900">
                <img 
                  src={posterImg} 
                  alt={mainTitle}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title & Episode Header */}
              <div className="flex-1 min-w-0 pt-2 sm:pt-4">
                
                {/* Episode Pill & Airing Timing */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/40 text-purple-300">
                    Episode {anime.episode}
                  </span>
                  
                  {countdown.isAired ? (
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                      Aired Recently
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-400">
                      airs in {countdown.days > 0 ? `${countdown.days}d ` : ''}{countdown.hours}h {countdown.minutes}m
                    </span>
                  )}
                </div>

                {/* Main English / Romaji Title */}
                <h2 
                  id="anime-modal-title" 
                  className="text-lg sm:text-2xl font-extrabold text-white tracking-tight leading-snug font-['Space_Grotesk'] line-clamp-2"
                >
                  {mainTitle}
                </h2>

                {/* Romaji or Native Subtitle */}
                {subTitle && (
                  <p className="text-xs sm:text-sm text-purple-300/80 font-medium mt-1 truncate">
                    {subTitle}
                  </p>
                )}

                {nativeTitle && (
                  <p className="text-[11px] text-slate-500 mt-0.5 font-sans truncate">
                    {nativeTitle}
                  </p>
                )}
              </div>
            </div>

            {/* Live Ticking Mini Countdown Banner */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-[#0e1017] border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
              
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center flex-shrink-0 text-purple-300">
                  <Clock className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                    Live GMT Airing Countdown
                  </div>
                  <div className="text-xs text-slate-300 flex items-center gap-1.5 font-medium mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{gmtDisplay}</span>
                  </div>
                </div>
              </div>

              {/* Ticking Digits */}
              <div className="flex items-center gap-1.5 font-mono text-sm sm:text-base font-bold text-white self-end sm:self-auto bg-black/50 border border-white/10 px-3 py-1.5 rounded-xl shadow-sm">
                {countdown.isAired ? (
                  <span className="text-emerald-400 font-sans text-xs">Currently Airing / Available</span>
                ) : (
                  <>
                    {countdown.days > 0 && (
                      <span className="text-purple-300 font-semibold">{countdown.days}d </span>
                    )}
                    <span className="text-slate-100">{pad(countdown.hours)}</span>
                    <span className="text-purple-400 animate-pulse">:</span>
                    <span className="text-slate-100">{pad(countdown.minutes)}</span>
                    <span className="text-purple-400 animate-pulse">:</span>
                    <span className="text-cyan-400">{pad(countdown.seconds)}</span>
                  </>
                )}
              </div>

            </div>

            {/* Studios & Genres Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {studios.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-semibold">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>{studios.map(s => s.name).join(', ')}</span>
                </div>
              )}

              {anime.media.genres.map(genre => (
                <span 
                  key={genre} 
                  className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-medium hover:bg-white/10 transition-colors"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Description / Synopsis */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 flex flex-col gap-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Synopsis</span>
              </h4>

              {rawDescription ? (
                <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <p className={`whitespace-pre-line ${!isExpanded && hasLongDescription ? 'line-clamp-3' : ''}`}>
                    {rawDescription}
                  </p>
                  
                  {hasLongDescription && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="mt-2 text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>{isExpanded ? 'Read less' : 'Read more'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  No synopsis available for this title on AniList yet.
                </p>
              )}
            </div>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              
              {/* Notify / Set Reminder Button */}
              <button
                onClick={() => onToggleReminder && onToggleReminder(anime.id)}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm transition-all shadow-lg cursor-pointer active:scale-[0.98] ${
                  isReminded
                    ? 'bg-emerald-500 text-black shadow-emerald-500/25 ring-2 ring-emerald-400/50'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/25'
                }`}
              >
                {isReminded ? (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Reminder Set (Ep {anime.episode})</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>Notify for Episode {anime.episode}</span>
                  </>
                )}
              </button>

              {/* Add to Google Calendar Button */}
              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-200 hover:text-white font-semibold text-sm transition-all shadow-md group cursor-pointer active:scale-[0.98]"
              >
                <CalendarPlus className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>Add to Google Calendar</span>
              </a>

            </div>

            {/* Secondary Action Row: AniList & Share */}
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={anime.media.siteUrl || `https://anilist.co/anime/${anime.media.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <span>Official AniList Page</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>

              <button
                onClick={handleCopyLink}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Share or copy info"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Link!' : 'Share'}</span>
              </button>
            </div>

            {/* Where to Watch (Search Badges) */}
            <div className="pt-2 border-t border-white/5 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <PlayCircle className="w-3.5 h-3.5 text-purple-400" />
                <span>Where to Watch & Search Streams</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Crunchyroll */}
                <a
                  href={crunchyrollUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-300 hover:text-orange-200 text-xs font-semibold transition-all text-center"
                >
                  <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                  <span className="truncate">Crunchyroll</span>
                </a>

                {/* Netflix */}
                <a
                  href={netflixUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-300 hover:text-red-200 text-xs font-semibold transition-all text-center"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="truncate">Netflix</span>
                </a>

                {/* Muse Asia (YouTube) */}
                <a
                  href={museAsiaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-semibold transition-all text-center"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                  <span className="truncate">Muse Asia</span>
                </a>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default AnimeDetailModal;
