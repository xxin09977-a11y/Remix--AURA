export type ThemeId = 'aura' | 'cyberpunk' | 'minimalist' | 'nebula' | 'blood' | string;

export interface Theme {
  id: ThemeId;
  name: string;
  colors: {
    bg: string;
    primary: string;
    accent: string;
    glass: string;
    border: string;
    text: string;
    muted: string;
  };
}

export const themes: Theme[] = [
  {
    id: 'aura',
    name: 'Aura (Default)',
    colors: {
      bg: '#0D0D0D',
      primary: '#ffffff',
      accent: '#00ff9d',
      glass: 'rgba(255, 255, 255, 0.03)',
      border: 'rgba(255, 255, 255, 0.06)',
      text: '#ffffff',
      muted: 'rgba(255, 255, 255, 0.4)'
    }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    colors: {
      bg: '#050505',
      primary: '#f3f315', // Yellow
      accent: '#ff00ff', // Magenta
      glass: 'rgba(243, 243, 21, 0.05)',
      border: 'rgba(255, 0, 255, 0.2)',
      text: '#f3f315',
      muted: 'rgba(243, 243, 21, 0.5)'
    }
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    colors: {
      bg: '#ffffff',
      primary: '#000000',
      accent: '#000000',
      glass: 'rgba(0, 0, 0, 0.02)',
      border: 'rgba(0, 0, 0, 0.05)',
      text: '#000000',
      muted: 'rgba(0, 0, 0, 0.4)'
    }
  },
  {
    id: 'nebula',
    name: 'Nebula',
    colors: {
      bg: '#0a0a1a',
      primary: '#e0e0ff',
      accent: '#7b61ff', // Purple
      glass: 'rgba(123, 97, 255, 0.08)',
      border: 'rgba(123, 97, 255, 0.2)',
      text: '#e0e0ff',
      muted: 'rgba(224, 224, 255, 0.5)'
    }
  },
  {
    id: 'blood',
    name: 'Blood Protocol',
    colors: {
      bg: '#0f0000',
      primary: '#ff4d4d',
      accent: '#ff0000',
      glass: 'rgba(255, 0, 0, 0.05)',
      border: 'rgba(255, 0, 0, 0.2)',
      text: '#ff4d4d',
      muted: 'rgba(255, 77, 77, 0.5)'
    }
  }
];
