import React, { useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { TacticalTerminal } from './components/TacticalTerminal';
import { GameState, PlayerStats, WeaponType } from './types';
import { WEAPON_CONFIG } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    health: 100,
    maxHealth: 100,
    ammo: { [WeaponType.SMG]: Infinity, [WeaponType.RIFLE]: 0, [WeaponType.SHOTGUN]: 0 },
    currentWeapon: WeaponType.SMG,
    score: 0
  });

  const handleStartGame = () => {
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = (finalScore: number) => {
    setGameState(GameState.GAME_OVER);
    // Could save high score here
  };

  const currentWeaponInfo = WEAPON_CONFIG[playerStats.currentWeapon];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950">
      {/* Game Area */}
      <div className="flex-1 relative flex flex-col p-4 h-full">
        
        {/* Top HUD */}
        <div className="flex justify-between items-center mb-4 bg-slate-900/80 p-4 rounded-lg border border-slate-700 shadow-lg z-10">
            <div className="flex gap-6 items-center">
                <div className="flex flex-col">
                    <span className="text-xs text-slate-400 uppercase tracking-widest">Operator Status</span>
                    <div className="flex items-center gap-2">
                         <div className="w-48 h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-600">
                             <div 
                                className={`h-full transition-all duration-300 ${playerStats.health > 50 ? 'bg-green-500' : playerStats.health > 25 ? 'bg-amber-500' : 'bg-red-600'}`} 
                                style={{ width: `${(playerStats.health / playerStats.maxHealth) * 100}%` }}
                             />
                         </div>
                         <span className="font-mono text-xl font-bold">{Math.ceil(playerStats.health)}%</span>
                    </div>
                </div>

                <div className="flex flex-col">
                    <span className="text-xs text-slate-400 uppercase tracking-widest">Score</span>
                    <span className="font-mono text-xl font-bold text-white">{playerStats.score.toString().padStart(6, '0')}</span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="text-right">
                    <span className="text-xs text-slate-400 uppercase tracking-widest block">Weapon System</span>
                    <span className="font-mono text-xl font-bold" style={{ color: currentWeaponInfo.color }}>
                        {playerStats.currentWeapon.toUpperCase()}
                    </span>
                </div>
                <div className="text-right">
                    <span className="text-xs text-slate-400 uppercase tracking-widest block">Ammunition</span>
                    <span className={`font-mono text-2xl font-bold ${playerStats.ammo[playerStats.currentWeapon] === 0 && playerStats.currentWeapon !== WeaponType.SMG ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {playerStats.ammo[playerStats.currentWeapon] === Infinity ? '∞' : playerStats.ammo[playerStats.currentWeapon]}
                    </span>
                </div>
            </div>
        </div>

        {/* Main Canvas Container */}
        <div className="flex-1 relative flex items-center justify-center">
             <GameCanvas 
                gameState={gameState} 
                onStatsUpdate={setPlayerStats} 
                onGameOver={handleGameOver}
             />
             
             {/* Overlay Buttons */}
             {gameState !== GameState.PLAYING && (
                 <div className="absolute bottom-10 z-20">
                     <button 
                        onClick={handleStartGame}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-12 rounded-lg text-xl tracking-widest border-2 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all hover:scale-105"
                     >
                        {gameState === GameState.MENU ? 'INITIATE MISSION' : 'REDEPLOY'}
                     </button>
                 </div>
             )}
        </div>
        
        {/* Controls Hint */}
        <div className="mt-2 flex justify-center gap-8 text-xs text-slate-500 font-mono">
             <span>[W,A,S,D] MOVE</span>
             <span>[MOUSE] AIM & SHOOT</span>
             <span>[1] SMG</span>
             <span>[2] RIFLE</span>
             <span>[3] SHOTGUN</span>
        </div>
      </div>

      {/* Right Panel - Terminal */}
      <TacticalTerminal />
    </div>
  );
};

export default App;