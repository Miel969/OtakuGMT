export interface UserProfile {
  id: string;
  username: string;
  avatarSeed: string;
  isLoggedIn: boolean;
  momoNumber?: string;
  likedTracks: {
    id: string | number;
    title: string;
    artist: string;
    stationName: string;
    city: string;
    savedAt: string;
  }[];
}

const STORAGE_KEY = 'otakugmt_user_profile';

export function getSavedProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read profile from storage', e);
  }

  // Default guest state
  return {
    id: 'guest',
    username: 'Guest Otaku',
    avatarSeed: 'Spike',
    isLoggedIn: false,
    likedTracks: [],
  };
}

export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile to storage', e);
  }
}
