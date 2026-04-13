const SOUND_URLS = {
  success: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  notification: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
  error: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3'
};

export type SoundType = keyof typeof SOUND_URLS;

const audioCache: Record<string, HTMLAudioElement> = {};

export function playSound(type: SoundType) {
  const soundEnabled = localStorage.getItem('aura-sound') !== 'false';
  if (!soundEnabled) return;

  try {
    let audio = audioCache[type];
    if (!audio) {
      audio = new Audio(SOUND_URLS[type]);
      audio.volume = 0.3; // Keep it subtle
      audioCache[type] = audio;
    }
    
    // Reset and play
    audio.currentTime = 0;
    audio.play().catch(err => console.log('Audio play blocked:', err));
  } catch (error) {
    console.error('Error playing sound:', error);
  }
}
