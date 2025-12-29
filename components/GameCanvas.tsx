import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WeaponType, GameState, PlayerStats } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SPEED, ENEMY_SPEED, WEAPON_CONFIG, ENEMY_SPAWN_RATE } from '../constants';

// Simple Vector interface for internal math
interface Vector {
  x: number;
  y: number;
}

interface GameEntity {
  id: string;
  pos: Vector;
  velocity: Vector;
  radius: number;
  color: string;
  health: number;
  maxHealth: number;
}

interface Bullet extends GameEntity {
  damage: number;
  lifeTime: number;
}

interface Props {
  gameState: GameState;
  onStatsUpdate: (stats: PlayerStats) => void;
  onGameOver: (score: number) => void;
}

export const GameCanvas: React.FC<Props> = ({ gameState, onStatsUpdate, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  
  // Game State Refs (Mutable for performance, bypassing React render cycle for 60fps)
  const playerRef = useRef<GameEntity & { currentWeapon: WeaponType }>({
    id: 'player',
    pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
    velocity: { x: 0, y: 0 },
    radius: 15,
    color: '#10b981', // Emerald 500
    health: 100,
    maxHealth: 100,
    currentWeapon: WeaponType.SMG
  });
  
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<GameEntity[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const mouseRef = useRef<Vector>({ x: 0, y: 0 });
  const scoreRef = useRef(0);
  const lastShotTimeRef = useRef(0);
  const lastEnemySpawnTimeRef = useRef(0);
  const ammoRef = useRef<Record<WeaponType, number>>({
    [WeaponType.SMG]: Infinity,
    [WeaponType.RIFLE]: 120,
    [WeaponType.SHOTGUN]: 24
  });

  // Handle Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      
      // Weapon Switching
      if (e.key === '1') playerRef.current.currentWeapon = WeaponType.SMG;
      if (e.key === '2') playerRef.current.currentWeapon = WeaponType.RIFLE;
      if (e.key === '3') playerRef.current.currentWeapon = WeaponType.SHOTGUN;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      mouseRef.current = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    const handleMouseDown = () => {
      keysRef.current['mouse_left'] = true;
    };

    const handleMouseUp = () => {
      keysRef.current['mouse_left'] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    // Bind mouse events to window to catch drags outside canvas
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Initialize/Reset Game
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      playerRef.current = {
        ...playerRef.current,
        pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
        health: 100,
        currentWeapon: WeaponType.SMG
      };
      bulletsRef.current = [];
      enemiesRef.current = [];
      scoreRef.current = 0;
      ammoRef.current = {
         [WeaponType.SMG]: Infinity,
         [WeaponType.RIFLE]: 120,
         [WeaponType.SHOTGUN]: 24
      };
    }
  }, [gameState]);

  // Main Game Loop
  const gameLoop = useCallback((timestamp: number) => {
    if (gameState !== GameState.PLAYING || !canvasRef.current) {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear Screen
    ctx.fillStyle = '#0f172a'; // Slate 900 background
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Grid (Tactical Look)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // --- Update Player ---
    const player = playerRef.current;
    let dx = 0;
    let dy = 0;
    if (keysRef.current['w']) dy -= 1;
    if (keysRef.current['s']) dy += 1;
    if (keysRef.current['a']) dx -= 1;
    if (keysRef.current['d']) dx += 1;

    // Normalize diagonal movement
    if (dx !== 0 || dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;
    }

    player.pos.x += dx * PLAYER_SPEED;
    player.pos.y += dy * PLAYER_SPEED;

    // Boundary check
    player.pos.x = Math.max(player.radius, Math.min(CANVAS_WIDTH - player.radius, player.pos.x));
    player.pos.y = Math.max(player.radius, Math.min(CANVAS_HEIGHT - player.radius, player.pos.y));

    // --- Shooting ---
    const weapon = WEAPON_CONFIG[player.currentWeapon];
    if (keysRef.current['mouse_left']) {
      if (timestamp - lastShotTimeRef.current > weapon.fireRate && ammoRef.current[player.currentWeapon] > 0) {
        lastShotTimeRef.current = timestamp;
        
        // Decrease ammo
        if (player.currentWeapon !== WeaponType.SMG) {
          ammoRef.current[player.currentWeapon]--;
        }

        const baseAngle = Math.atan2(mouseRef.current.y - player.pos.y, mouseRef.current.x - player.pos.x);

        // 4-Directional Firing Logic
        for (let d = 0; d < 4; d++) {
            const directionOffset = d * (Math.PI / 2); // 0, 90, 180, 270 degrees offset
            const currentAngle = baseAngle + directionOffset;

            const createBullet = (angleOffset: number) => {
              const finalAngle = currentAngle + angleOffset;
              bulletsRef.current.push({
                id: Math.random().toString(),
                pos: { ...player.pos },
                velocity: {
                  x: Math.cos(finalAngle) * weapon.projectileSpeed,
                  y: Math.sin(finalAngle) * weapon.projectileSpeed
                },
                radius: 3,
                color: weapon.color,
                health: 1,
                maxHealth: 1,
                damage: weapon.damage,
                lifeTime: 200 // Increased range (2x)
              });
            };

            if (player.currentWeapon === WeaponType.SHOTGUN && (weapon as any).pellets) {
                 for(let i=0; i<(weapon as any).pellets; i++) {
                     // Random spread
                     const spread = (Math.random() - 0.5) * weapon.spread;
                     createBullet(spread);
                 }
            } else {
                 const spread = (Math.random() - 0.5) * weapon.spread;
                 createBullet(spread);
            }
        }
      }
    }

    // --- Spawning Enemies ---
    if (timestamp - lastEnemySpawnTimeRef.current > ENEMY_SPAWN_RATE) {
      lastEnemySpawnTimeRef.current = timestamp;
      // Spawn at edge
      let ex, ey;
      if (Math.random() < 0.5) {
        ex = Math.random() < 0.5 ? 0 : CANVAS_WIDTH;
        ey = Math.random() * CANVAS_HEIGHT;
      } else {
        ex = Math.random() * CANVAS_WIDTH;
        ey = Math.random() < 0.5 ? 0 : CANVAS_HEIGHT;
      }

      enemiesRef.current.push({
        id: Math.random().toString(),
        pos: { x: ex, y: ey },
        velocity: { x: 0, y: 0 },
        radius: 12,
        color: '#ef4444', // Red 500
        health: 50 + (scoreRef.current * 0.5), // Difficulty scaling
        maxHealth: 50
      });
    }

    // --- Update Enemies ---
    for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
      const enemy = enemiesRef.current[i];
      // Move towards player
      const angle = Math.atan2(player.pos.y - enemy.pos.y, player.pos.x - enemy.pos.x);
      enemy.pos.x += Math.cos(angle) * ENEMY_SPEED;
      enemy.pos.y += Math.sin(angle) * ENEMY_SPEED;

      // Draw Enemy
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(enemy.pos.x, enemy.pos.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();

      // Collision with Player
      const dist = Math.sqrt((player.pos.x - enemy.pos.x)**2 + (player.pos.y - enemy.pos.y)**2);
      if (dist < player.radius + enemy.radius) {
        player.health -= 1; // Take damage
        // Push enemy back
        enemy.pos.x -= Math.cos(angle) * 10;
        enemy.pos.y -= Math.sin(angle) * 10;
      }
    }

    // --- Update Bullets ---
    for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
      const bullet = bulletsRef.current[i];
      bullet.pos.x += bullet.velocity.x;
      bullet.pos.y += bullet.velocity.y;
      bullet.lifeTime--;

      // Draw Bullet
      ctx.fillStyle = bullet.color;
      ctx.beginPath();
      ctx.arc(bullet.pos.x, bullet.pos.y, bullet.radius, 0, Math.PI * 2);
      ctx.fill();

      // Check Collision with Enemies
      let hit = false;
      for (let j = enemiesRef.current.length - 1; j >= 0; j--) {
        const enemy = enemiesRef.current[j];
        const dist = Math.sqrt((bullet.pos.x - enemy.pos.x)**2 + (bullet.pos.y - enemy.pos.y)**2);
        
        if (dist < bullet.radius + enemy.radius) {
          enemy.health -= bullet.damage;
          hit = true;
          // Effect
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(bullet.pos.x, bullet.pos.y, 5, 0, Math.PI*2);
          ctx.fill();

          if (enemy.health <= 0) {
            enemiesRef.current.splice(j, 1);
            scoreRef.current += 10;
            
            // Random ammo drop chance (simply add to pool)
            if (Math.random() > 0.8) {
                ammoRef.current[WeaponType.RIFLE] += 15;
            }
            if (Math.random() > 0.9) {
                ammoRef.current[WeaponType.SHOTGUN] += 4;
            }
          }
          break; // Bullet hits one enemy
        }
      }

      // Remove bullet if out of bounds, lifetime over, or hit
      if (
        bullet.pos.x < 0 || bullet.pos.x > CANVAS_WIDTH ||
        bullet.pos.y < 0 || bullet.pos.y > CANVAS_HEIGHT ||
        bullet.lifeTime <= 0 ||
        hit
      ) {
        bulletsRef.current.splice(i, 1);
      }
    }

    // --- Draw Player ---
    ctx.save();
    ctx.translate(player.pos.x, player.pos.y);
    // Rotate towards mouse
    const angle = Math.atan2(mouseRef.current.y - player.pos.y, mouseRef.current.x - player.pos.x);
    ctx.rotate(angle);
    
    // Body
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();
    // Weapon pointer
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, -3, 25, 6); // Barrel

    ctx.restore();

    // Crosshair
    ctx.strokeStyle = weapon.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mouseRef.current.x, mouseRef.current.y, 10, 0, Math.PI*2);
    ctx.moveTo(mouseRef.current.x - 15, mouseRef.current.y);
    ctx.lineTo(mouseRef.current.x + 15, mouseRef.current.y);
    ctx.moveTo(mouseRef.current.x, mouseRef.current.y - 15);
    ctx.lineTo(mouseRef.current.x, mouseRef.current.y + 15);
    ctx.stroke();

    // --- Game Over Check ---
    if (player.health <= 0) {
        onGameOver(scoreRef.current);
    }

    // --- Throttle UI Updates ---
    if (timestamp % 10 === 0) { // Update UI occasionally, not every frame
        onStatsUpdate({
            health: player.health,
            maxHealth: player.maxHealth,
            ammo: { ...ammoRef.current },
            currentWeapon: player.currentWeapon,
            score: scoreRef.current
        });
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, onGameOver, onStatsUpdate]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameLoop]);

  return (
    <div className="relative border-4 border-slate-700 rounded-lg overflow-hidden shadow-2xl bg-black">
        <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full object-contain cursor-none"
            style={{ maxHeight: '80vh' }}
        />
        {gameState === GameState.MENU && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10">
                 <div className="text-center">
                     <h1 className="text-5xl font-bold text-green-500 mb-4 tracking-tighter">TACTICAL OPS</h1>
                     <p className="text-slate-400 mb-8">WASD to Move | Click to Shoot | 1-2-3 Switch Weapons</p>
                     <p className="text-amber-500 mb-8 font-bold text-sm">MISSION: SURVIVE</p>
                 </div>
             </div>
        )}
        {gameState === GameState.GAME_OVER && (
             <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 backdrop-blur-sm z-10">
                 <div className="text-center">
                     <h1 className="text-6xl font-bold text-white mb-4">M.I.A.</h1>
                     <p className="text-red-200 text-xl mb-8">OPERATIVE LOST</p>
                 </div>
             </div>
        )}
    </div>
  );
};