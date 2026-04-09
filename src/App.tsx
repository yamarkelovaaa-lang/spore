import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Trophy, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Game Constants ---
const WORLD_WIDTH = 4000;
const WORLD_HEIGHT = 4000;
const INITIAL_PLAYER_RADIUS = 15;
const MAX_PLAYER_RADIUS = 150;
const BASE_SPEED = 4;

// --- Types ---
type Vector2 = { x: number; y: number };

interface Entity {
  id: number;
  pos: Vector2;
  vel: Vector2;
  radius: number;
  color: string;
  type: 'player' | 'food' | 'enemy';
  speed: number;
  targetAngle?: number;
  wobbleOffset?: number;
}

type Difficulty = 'Easy' | 'Normal' | 'Hard';

const DIFFICULTY_SETTINGS = {
  Easy: { foodCount: 1000, enemyCount: 40, enemySpeedMult: 0.7, growthMult: 1.5 },
  Normal: { foodCount: 800, enemyCount: 60, enemySpeedMult: 1.0, growthMult: 1.0 },
  Hard: { foodCount: 500, enemyCount: 90, enemySpeedMult: 1.3, growthMult: 0.8 },
};

// --- Helper Functions ---
const distance = (p1: Vector2, p2: Vector2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;
const randomColor = (type: 'food' | 'enemy') => {
  if (type === 'food') {
    const isPlant = Math.random() > 0.3;
    return isPlant ? `hsl(${randomRange(100, 140)}, 80%, 50%)` : `hsl(${randomRange(0, 20)}, 80%, 50%)`;
  }
  return `hsl(${randomRange(0, 360)}, 70%, 60%)`;
};

let entityIdCounter = 0;

const createFood = (): Entity => ({
  id: entityIdCounter++,
  pos: { x: randomRange(0, WORLD_WIDTH), y: randomRange(0, WORLD_HEIGHT) },
  vel: { x: 0, y: 0 },
  radius: randomRange(3, 6),
  color: randomColor('food'),
  type: 'food',
  speed: 0,
});

const createEnemy = (playerRadius: number, speedMult: number): Entity => {
  const sizeMultiplier = randomRange(0.4, 2.5);
  return {
    id: entityIdCounter++,
    pos: { x: randomRange(0, WORLD_WIDTH), y: randomRange(0, WORLD_HEIGHT) },
    vel: { x: randomRange(-1, 1), y: randomRange(-1, 1) },
    radius: Math.max(10, playerRadius * sizeMultiplier),
    color: randomColor('enemy'),
    type: 'enemy',
    speed: randomRange(1.5, 3.5) * speedMult,
    targetAngle: randomRange(0, Math.PI * 2),
    wobbleOffset: randomRange(0, Math.PI * 2),
  };
};

// --- Components ---

const GalaxyView = ({ onSelectDifficulty }: { onSelectDifficulty: (d: Difficulty) => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPoint, setSelectedPoint] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    let frame = 0;
    const draw = () => {
      frame++;
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const arms = 5;
      const particlesPerArm = 200;

      // Draw Galaxy
      for (let i = 0; i < arms; i++) {
        const armAngle = (i / arms) * Math.PI * 2;
        for (let j = 0; j < particlesPerArm; j++) {
          const distance = (j / particlesPerArm) * (Math.min(canvas.width, canvas.height) * 0.45);
          const spiralAngle = distance * 0.012 + armAngle + frame * 0.0008;
          
          const x = centerX + Math.cos(spiralAngle) * distance;
          const y = centerY + Math.sin(spiralAngle) * distance;
          
          const size = randomRange(1, 4);
          const opacity = (1 - (j / particlesPerArm)) * 0.6;
          
          // Nebula Glow
          ctx.fillStyle = `rgba(168, 85, 247, ${opacity * 0.15})`; // Purple
          ctx.beginPath();
          ctx.arc(x + randomRange(-20, 20), y + randomRange(-20, 20), size * 15, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgba(59, 130, 246, ${opacity * 0.2})`; // Blue
          ctx.beginPath();
          ctx.arc(x + randomRange(-10, 10), y + randomRange(-10, 10), size * 10, 0, Math.PI * 2);
          ctx.fill();

          // Stars
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.beginPath();
          ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Core
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 100);
      gradient.addColorStop(0, 'white');
      gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 100, 0, Math.PI * 2);
      ctx.fill();

      // Blinking dots at tips
      for (let i = 0; i < arms; i++) {
        const armAngle = (i / arms) * Math.PI * 2;
        const distance = Math.min(canvas.width, canvas.height) * 0.4;
        const spiralAngle = distance * 0.01 + armAngle + frame * 0.001;
        const x = centerX + Math.cos(spiralAngle) * distance;
        const y = centerY + Math.sin(spiralAngle) * distance;

        const blink = (Math.sin(frame * 0.1) + 1) / 2;
        ctx.shadowBlur = 15 * blink;
        ctx.shadowColor = '#60a5fa';
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + blink * 0.5})`;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      requestAnimationFrame(draw);
    };

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const arms = 5;

      for (let i = 0; i < arms; i++) {
        const armAngle = (i / arms) * Math.PI * 2;
        const distanceVal = Math.min(canvas.width, canvas.height) * 0.4;
        // Note: frame is not accessible here easily, but we can approximate or use a ref
        // For simplicity, let's just use a static check or a ref for frame
      }
      // Simpler: just show difficulty select on any click for now, or near the tips
      setSelectedPoint({ x: e.clientX, y: e.clientY });
    };

    canvas.addEventListener('click', handleCanvasClick);
    const animId = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('click', handleCanvasClick);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-7xl font-black text-white tracking-tighter mb-2 drop-shadow-2xl"
        >
          SPORE
        </motion.h1>
        <p className="text-blue-300 font-medium tracking-widest uppercase text-sm opacity-60">Cell Stage</p>
      </div>

      <AnimatePresence>
        {selectedPoint && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bg-slate-900/90 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl w-64"
            style={{ 
              left: Math.min(window.innerWidth - 280, Math.max(20, selectedPoint.x - 128)), 
              top: Math.min(window.innerHeight - 300, Math.max(20, selectedPoint.y + 20)) 
            }}
          >
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Select Difficulty
            </h3>
            <div className="space-y-2">
              {(['Easy', 'Normal', 'Hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => onSelectDifficulty(d)}
                  className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 text-left text-slate-300 hover:text-white transition-all flex justify-between items-center group pointer-events-auto"
                >
                  {d}
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
            <button 
              onClick={() => setSelectedPoint(null)}
              className="mt-4 w-full text-xs text-slate-500 hover:text-slate-300 transition-colors pointer-events-auto"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-500 text-xs uppercase tracking-[0.3em] animate-pulse">
        Click a star to begin evolution
      </div>
    </div>
  );
};

const EggHatch = ({ onComplete }: { onComplete: () => void }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (stage < 3) setStage(s => s + 1);
      else onComplete();
    }, 800);
    return () => clearTimeout(timer);
  }, [stage, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div
        animate={stage === 1 ? { rotate: [0, -5, 5, -5, 5, 0] } : stage === 2 ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.5 }}
        className="relative w-32 h-40"
      >
        {/* Egg Shell */}
        <div className="absolute inset-0 bg-amber-50 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] shadow-inner border-2 border-amber-100/50 overflow-hidden">
          {stage >= 2 && (
            <motion.div 
              initial={{ y: 0 }}
              animate={{ y: -20 }}
              className="absolute top-1/2 left-0 w-full h-1 bg-amber-200/50 rotate-12" 
            />
          )}
          {stage >= 3 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-blue-500/20 flex items-center justify-center"
            >
              <div className="w-8 h-8 bg-blue-400 rounded-full blur-sm animate-pulse" />
            </motion.div>
          )}
        </div>
      </motion.div>
      <p className="mt-8 text-amber-200/50 font-mono text-sm tracking-widest uppercase">
        {stage === 0 ? "Incubating..." : stage === 1 ? "Cracking..." : stage === 2 ? "Hatching!" : "Emerging..."}
      </p>
    </div>
  );
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'hatching' | 'playing' | 'gameover' | 'won'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('Normal');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);

  const playerRef = useRef<Entity>({
    id: -1,
    pos: { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 },
    vel: { x: 0, y: 0 },
    radius: INITIAL_PLAYER_RADIUS,
    color: '#3b82f6',
    type: 'player',
    speed: BASE_SPEED,
    wobbleOffset: 0,
  });
  const entitiesRef = useRef<Entity[]>([]);
  const mousePosRef = useRef<Vector2>({ x: 0, y: 0 });
  const cameraRef = useRef<Vector2>({ x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 });
  const animationFrameId = useRef<number>(0);

  const startHatching = (d: Difficulty) => {
    setDifficulty(d);
    setGameState('hatching');
  };

  const initGame = () => {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    playerRef.current = {
      id: -1,
      pos: { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 },
      vel: { x: 0, y: 0 },
      radius: INITIAL_PLAYER_RADIUS,
      color: '#3b82f6',
      type: 'player',
      speed: BASE_SPEED,
      wobbleOffset: 0,
    };
    
    const initialEntities: Entity[] = [];
    for (let i = 0; i < settings.foodCount; i++) initialEntities.push(createFood());
    for (let i = 0; i < settings.enemyCount; i++) initialEntities.push(createEnemy(INITIAL_PLAYER_RADIUS, settings.enemySpeedMult));
    
    entitiesRef.current = initialEntities;
    setScore(0);
    setLevel(1);
    setGameState('playing');
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = {
        x: e.clientX - window.innerWidth / 2,
        y: e.clientY - window.innerHeight / 2,
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    let lastTime = performance.now();
    const settings = DIFFICULTY_SETTINGS[difficulty];

    const update = (time: number) => {
      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;

      const player = playerRef.current;
      const entities = entitiesRef.current;

      const mouseDist = Math.hypot(mousePosRef.current.x, mousePosRef.current.y);
      if (mouseDist > 10) {
        const angle = Math.atan2(mousePosRef.current.y, mousePosRef.current.x);
        const currentSpeed = Math.max(1.5, player.speed * (INITIAL_PLAYER_RADIUS / player.radius) * 1.5);
        player.vel.x = Math.cos(angle) * currentSpeed;
        player.vel.y = Math.sin(angle) * currentSpeed;
      } else {
        player.vel.x *= 0.9;
        player.vel.y *= 0.9;
      }

      player.pos.x += player.vel.x;
      player.pos.y += player.vel.y;
      player.pos.x = Math.max(player.radius, Math.min(WORLD_WIDTH - player.radius, player.pos.x));
      player.pos.y = Math.max(player.radius, Math.min(WORLD_HEIGHT - player.radius, player.pos.y));
      player.wobbleOffset! += deltaTime * 5;

      cameraRef.current.x += (player.pos.x - cameraRef.current.x) * 0.1;
      cameraRef.current.y += (player.pos.y - cameraRef.current.y) * 0.1;

      const newEntities: Entity[] = [];
      let playerDied = false;

      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        let isAlive = true;

        if (entity.type === 'enemy') {
          if (Math.random() < 0.02) {
            entity.targetAngle = randomRange(0, Math.PI * 2);
          }
          const distToPlayer = distance(entity.pos, player.pos);
          if (distToPlayer < 300) {
            const angleToPlayer = Math.atan2(player.pos.y - entity.pos.y, player.pos.x - entity.pos.x);
            if (player.radius > entity.radius * 1.1) {
              entity.targetAngle = angleToPlayer + Math.PI;
            } else if (player.radius < entity.radius * 0.9) {
              entity.targetAngle = angleToPlayer;
            }
          }
          if (entity.targetAngle !== undefined) {
            entity.vel.x = Math.cos(entity.targetAngle) * entity.speed;
            entity.vel.y = Math.sin(entity.targetAngle) * entity.speed;
          }
          entity.pos.x += entity.vel.x;
          entity.pos.y += entity.vel.y;
          entity.wobbleOffset! += deltaTime * 3;
          if (entity.pos.x < entity.radius || entity.pos.x > WORLD_WIDTH - entity.radius) {
            entity.vel.x *= -1;
            entity.targetAngle = Math.atan2(entity.vel.y, entity.vel.x);
          }
          if (entity.pos.y < entity.radius || entity.pos.y > WORLD_HEIGHT - entity.radius) {
            entity.vel.y *= -1;
            entity.targetAngle = Math.atan2(entity.vel.y, entity.vel.x);
          }
        }

        const dist = distance(player.pos, entity.pos);
        if (dist < player.radius + entity.radius) {
          if (entity.type === 'food') {
            isAlive = false;
            player.radius += 0.2 * settings.growthMult;
            setScore(s => s + 10);
            newEntities.push(createFood());
          } else if (entity.type === 'enemy') {
            if (player.radius > entity.radius * 1.1) {
              isAlive = false;
              player.radius += entity.radius * 0.1 * settings.growthMult;
              setScore(s => s + Math.floor(entity.radius * 5));
              newEntities.push(createEnemy(player.radius, settings.enemySpeedMult));
            } else if (entity.radius > player.radius * 1.1) {
              playerDied = true;
            } else {
              const overlap = (player.radius + entity.radius) - dist;
              const angle = Math.atan2(player.pos.y - entity.pos.y, player.pos.x - entity.pos.x);
              player.pos.x += Math.cos(angle) * overlap * 0.5;
              player.pos.y += Math.sin(angle) * overlap * 0.5;
              entity.pos.x -= Math.cos(angle) * overlap * 0.5;
              entity.pos.y -= Math.sin(angle) * overlap * 0.5;
            }
          }
        }
        if (isAlive) newEntities.push(entity);
      }

      if (playerDied) {
        setGameState('gameover');
        return;
      }
      if (player.radius >= MAX_PLAYER_RADIUS) {
        setGameState('won');
        return;
      }

      const newLevel = Math.floor((player.radius - INITIAL_PLAYER_RADIUS) / 20) + 1;
      if (newLevel !== level) setLevel(newLevel);

      entitiesRef.current = newEntities;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      ctx.translate(canvas.width / 2 - cameraRef.current.x, canvas.height / 2 - cameraRef.current.y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 5;
      ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      const drawCell = (entity: Entity) => {
        ctx.beginPath();
        if (entity.type !== 'food') {
          const wobble = Math.sin(entity.wobbleOffset || 0) * (entity.radius * 0.1);
          const stretchAngle = Math.atan2(entity.vel.y, entity.vel.x);
          ctx.save();
          ctx.translate(entity.pos.x, entity.pos.y);
          ctx.rotate(stretchAngle);
          const speed = Math.hypot(entity.vel.x, entity.vel.y);
          const stretch = 1 + Math.min(speed * 0.05, 0.3);
          ctx.scale(stretch, 1 / stretch);
          ctx.arc(0, 0, entity.radius + wobble, 0, Math.PI * 2);
          ctx.fillStyle = entity.color;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(entity.radius * 0.2, 0, entity.radius * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fill();
          if (entity.radius > 10) {
            ctx.beginPath();
            ctx.arc(entity.radius * 0.6, -entity.radius * 0.4, entity.radius * 0.15, 0, Math.PI * 2);
            ctx.arc(entity.radius * 0.6, entity.radius * 0.4, entity.radius * 0.15, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(entity.radius * 0.7, -entity.radius * 0.4, entity.radius * 0.05, 0, Math.PI * 2);
            ctx.arc(entity.radius * 0.7, entity.radius * 0.4, entity.radius * 0.05, 0, Math.PI * 2);
            ctx.fillStyle = 'black';
            ctx.fill();
          }
          ctx.restore();
        } else {
          ctx.arc(entity.pos.x, entity.pos.y, entity.radius, 0, Math.PI * 2);
          ctx.fillStyle = entity.color;
          ctx.fill();
        }
      };

      entities.filter(e => e.type === 'food').forEach(drawCell);
      entities.filter(e => e.type === 'enemy').forEach(drawCell);
      drawCell(player);
      ctx.restore();
      animationFrameId.current = requestAnimationFrame(update);
    };

    animationFrameId.current = requestAnimationFrame(update);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameState, level, difficulty]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      <AnimatePresence mode="wait">
        {gameState === 'menu' && (
          <motion.div 
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <GalaxyView onSelectDifficulty={startHatching} />
          </motion.div>
        )}

        {gameState === 'hatching' && (
          <motion.div 
            key="hatching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-slate-950"
          >
            <EggHatch onComplete={initGame} />
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0"
          >
            <canvas ref={canvasRef} className="absolute inset-0 block cursor-crosshair" style={{ touchAction: 'none' }} />
            
            {/* HUD */}
            <div className="absolute top-0 left-0 w-full p-6 pointer-events-none flex justify-between items-start">
              <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-xl">
                <div className="text-sm text-slate-400 uppercase tracking-widest font-semibold mb-1">Evolution Stage</div>
                <div className="text-3xl font-black text-blue-400 flex items-center gap-2">Level {level}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{difficulty} Mode</div>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-xl text-right">
                <div className="text-sm text-slate-400 uppercase tracking-widest font-semibold mb-1">DNA Points</div>
                <div className="text-3xl font-black text-emerald-400">{score.toLocaleString()}</div>
              </div>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md bg-slate-900/50 backdrop-blur-md border border-slate-700 rounded-full p-2 shadow-xl">
                <div className="h-4 bg-slate-800 rounded-full overflow-hidden relative">
                  <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300 ease-out" style={{ width: `${Math.min(100, ((playerRef.current.radius - INITIAL_PLAYER_RADIUS) / (MAX_PLAYER_RADIUS - INITIAL_PLAYER_RADIUS)) * 100)}%` }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {(gameState === 'gameover' || gameState === 'won') && (
          <motion.div 
            key="end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10"
          >
            <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl shadow-2xl max-w-md w-full text-center">
              {gameState === 'gameover' ? (
                <>
                  <div className="w-20 h-20 bg-red-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <div className="w-10 h-10 bg-red-500 rounded-full" />
                  </div>
                  <h2 className="text-4xl font-black text-white mb-2">Eaten!</h2>
                  <p className="text-slate-400 mb-6">Your evolutionary journey ends here.</p>
                  <div className="bg-slate-950 rounded-xl p-4 mb-8">
                    <div className="text-sm text-slate-500 uppercase tracking-wider mb-1">Final DNA</div>
                    <div className="text-3xl font-bold text-emerald-400">{score.toLocaleString()}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setGameState('hatching')}
                      className="py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-5 h-5" /> Respawn
                    </button>
                    <button
                      onClick={() => setGameState('menu')}
                      className="py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      Galaxy
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Trophy className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h2 className="text-4xl font-black text-white mb-2">Apex Predator</h2>
                  <p className="text-slate-400 mb-6">You have dominated the tide pool.</p>
                  <div className="bg-slate-950 rounded-xl p-4 mb-8">
                    <div className="text-sm text-slate-500 uppercase tracking-wider mb-1">Total DNA</div>
                    <div className="text-3xl font-bold text-emerald-400">{score.toLocaleString()}</div>
                  </div>
                  <button
                    onClick={() => setGameState('menu')}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" /> Return to Galaxy
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
