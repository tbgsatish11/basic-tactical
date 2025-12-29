import { WeaponType } from './types';

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;

export const PLAYER_SPEED = 4;
export const ENEMY_SPEED = 2;
export const ENEMY_SPAWN_RATE = 2000; // Increased to 2000ms (was 1000ms) to reduce enemy count

export const WEAPON_CONFIG = {
  [WeaponType.SMG]: {
    damage: 28,
    fireRate: 30, // Reduced from 120 (4x faster)
    spread: 0.15, // Less accurate than pistol
    projectileSpeed: 14,
    color: '#fbbf24', // amber
    ammoCapacity: Infinity
  },
  [WeaponType.RIFLE]: {
    damage: 30, // Increased from 15
    fireRate: 25, // Reduced from 100 (4x faster)
    spread: 0.1,
    projectileSpeed: 15,
    color: '#60a5fa', // blue
    ammoCapacity: 300
  },
  [WeaponType.SHOTGUN]: {
    damage: 22, // Increased from 12 per pellet
    fireRate: 200, // Reduced from 800 (4x faster)
    spread: 0.4,
    projectileSpeed: 12,
    pellets: 6,
    color: '#f87171', // red
    ammoCapacity: 50
  }
};

export const GEMINI_MODEL = 'gemini-3-pro-preview';

export const SYSTEM_INSTRUCTION_CHAT = `
You are COMMANDER GEMINI, a veteran tactical advisor for a special operations unit. 
Your responses should be brief, authoritative, and helpful. 
Use military terminology (e.g., "Copy that," "Negative," "Intel suggests"). 
Provide tactical advice, weapon recommendations, and encouragement to the operative.
`;

export const SYSTEM_INSTRUCTION_VISION = `
You are a SATELLITE RECONNAISSANCE AI. 
Analyze the provided image for tactical threats, terrain advantages, and potential enemy positions. 
Provide a structured "INTEL REPORT" identifying key objects and strategic value.
`;