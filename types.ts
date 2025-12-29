export enum WeaponType {
  SMG = 'SMG',
  RIFLE = 'Assault Rifle',
  SHOTGUN = 'Shotgun'
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  ammo: Record<WeaponType, number>;
  currentWeapon: WeaponType;
  score: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
}

export interface AnalysisResult {
  text: string;
  status: 'idle' | 'analyzing' | 'complete' | 'error';
}