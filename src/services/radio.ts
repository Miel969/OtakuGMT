export interface RadioStation {
  id: string;
  name: string;
  genre: 'anime' | 'jpop' | 'lofi' | 'ghana';
  country: string;
  streamUrl: string;
  location: string;
}

// Hand-curated, verified 100% HTTPS streams that never fail mixed-content checks
export const CURATED_STATIONS: RadioStation[] = [
  {
    id: 'animenfo',
    name: 'AnimeNfo Radio',
    genre: 'anime',
    country: 'Japan',
    location: 'Tokyo, JP',
    streamUrl: 'https://yp.animenfo.com:8000/listen.pls.mp3',
  },
  {
    id: 'asia-dream-japan',
    name: 'Asia DREAM Japan',
    genre: 'jpop',
    country: 'Japan',
    location: 'Shibuya, JP',
    streamUrl: 'https://igor.torontocast.com:1025/stream',
  },
  {
    id: 'lofi-girl-stream',
    name: 'Lofi Otaku Beats',
    genre: 'lofi',
    country: 'Global',
    location: 'Chill Sanctuary',
    streamUrl: 'https://play.streamafrica.net/lofiradio',
  },
  {
    id: 'jpop-sakura',
    name: 'J-Pop Powerplay',
    genre: 'jpop',
    country: 'Japan',
    location: 'Osaka, JP',
    streamUrl: 'https://kathy.torontocast.com:3560/stream',
  },
  {
    id: 'yfm-accra',
    name: 'YFM 107.9 Accra',
    genre: 'ghana',
    country: 'Ghana',
    location: 'Accra, GH',
    streamUrl: 'https://edge.mixlr.com/channel/swhly',
  },
];
