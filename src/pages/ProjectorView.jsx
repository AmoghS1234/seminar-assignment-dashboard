import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Sparkles, Users, Lock, Trophy } from 'lucide-react';
import { clsx } from 'clsx';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// --- 1. CONFIG & DATA ---
const SESSION_ID = 'vibe-live';

const FUN_FACTS = [
  { text: "The first computer bug was an actual moth found in a relay in 1947.", icon: "bug" },
  { text: "Python was named after Monty Python's Flying Circus, not the snake.", icon: "snake" },
  { text: "The first 1GB hard drive (1980) weighed over 500 pounds.", icon: "disk" },
  { text: "There are over 700 distinct programming languages in use today.", icon: "code" },
  { text: "The QWERTY keyboard layout was originally designed to slow down typists.", icon: "keyboard" },
  { text: "90% of the world's currency exists only in digital form.", icon: "coin" },
  { text: "The first domain name ever registered was Symbolics.com on March 15, 1985.", icon: "globe" },
  { text: "The Firefox logo is actually a Red Panda, not a Fox.", icon: "panda" },
  { text: "GitHub stores over 200 million repositories from 100 million developers.", icon: "rocket" }
];

// --- 2. PARTICLE BACKGROUND ---
const ParticleBackground = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speedY: Math.random() * 0.2 + 0.1,
      opacity: Math.random() * 0.5 + 0.1
    }));

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.y -= p.speedY;
        if (p.y < 0) p.y = height;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 85, 247, ${p.opacity})`; 
        ctx.fill();
      });
      requestAnimationFrame(animate);
    };
    animate();
    window.addEventListener('resize', () => { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; });
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-50 pointer-events-none" />;
};

// --- 3. ANIMATED ICONS ---
const AnimatedIcon = ({ type }) => {
  const s = "text-7xl filter drop-shadow-xl"; 
  switch(type) {
    case 'bug': return <motion.div animate={{ x: [0, 5, 0], rotate: [0, 5, 0] }} transition={{ duration: 4, repeat: Infinity }} className={s}>🐛</motion.div>;
    case 'snake': return <motion.div animate={{ x: [-10, 10], y: [0, 5, 0] }} transition={{ duration: 5, repeat: Infinity }} className={s}>🐍</motion.div>;
    case 'disk': return <motion.div animate={{ rotateY: [0, 360] }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} className={s}>💾</motion.div>;
    case 'code': return <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 4, repeat: Infinity }} className={s}>💻</motion.div>;
    case 'keyboard': return <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }} className={s}>⌨️</motion.div>;
    case 'coin': return <motion.div animate={{ rotateY: [0, 180, 360], y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity }} className={s}>💰</motion.div>;
    case 'globe': return <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} className={s}>🌐</motion.div>;
    case 'panda': return <motion.div animate={{ rotate: [-10, 10, -10] }} transition={{ duration: 3, repeat: Infinity }} className={s}>🦊</motion.div>;
    case 'rocket': return <motion.div animate={{ y: [0, -15, 0], x: [0, 5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className={s}>🚀</motion.div>;
    default: return <div className={s}>✨</div>;
  }
};

// --- 4. DIGITAL TIMER ---
const BouncyDigit = ({ value }) => (
  <div className="relative overflow-visible h-[1.1em] w-[0.65em] flex justify-center items-center">
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="absolute inset-0 flex justify-center items-center"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  </div>
);

const DigitalTimer = ({ timeLeft, isUrgent }) => {
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="relative flex items-center justify-center p-4">
       <div 
         className={clsx(
           "text-[16rem] lg:text-[20rem] font-mono font-bold leading-none flex items-center justify-center gap-2 tracking-tighter filter drop-shadow-[0_0_40px_rgba(168,85,247,0.3)]",
           isUrgent ? "text-red-500" : "text-white"
         )}
       >
          <div className="flex">
            <BouncyDigit value={mins[0]} />
            <BouncyDigit value={mins[1]} />
          </div>
          <span className="relative -top-4 text-white/30 animate-pulse">:</span>
          <div className="flex">
            <BouncyDigit value={secs[0]} />
            <BouncyDigit value={secs[1]} />
          </div>
       </div>
    </div>
  );
};

// --- 5. DATA VIZ ---
const DataStructureViz = () => {
  const [vizType, setVizType] = useState(0);
  const vizTypes = ['linkedList', 'stack', 'queue', 'binaryTree', 'graph'];

  useEffect(() => {
    const interval = setInterval(() => {
      setVizType(prev => (prev + 1) % vizTypes.length);
    }, 8000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="text-xs font-bold text-purple-300 uppercase tracking-widest mb-3 opacity-70 flex items-center gap-2 shrink-0">
         <Activity size={14} /> System Activity: {vizTypes[vizType].toUpperCase()}
      </div>
      
      <motion.div 
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex items-center justify-center w-full relative overflow-hidden" 
      >
        <AnimatePresence mode="wait">
          {vizTypes[vizType] === 'linkedList' && <LinkedListViz key="ll" />}
          {vizTypes[vizType] === 'stack' && <StackViz key="stack" />}
          {vizTypes[vizType] === 'queue' && <QueueViz key="queue" />}
          {vizTypes[vizType] === 'binaryTree' && <BinaryTreeViz key="tree" />}
          {vizTypes[vizType] === 'graph' && <GraphViz key="graph" />}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// --- Sub-Viz Components ---
const LinkedListViz = () => {
  const nodes = [12, 7, 23, 45];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-1 w-full">
      {nodes.map((val, i) => (
        <motion.div key={i} initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.2 }} className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg border-2 border-blue-300 text-white font-bold text-lg">{val}</div>
          {i < nodes.length - 1 && (
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: i * 0.2 + 0.2 }} className="flex items-center mx-1">
              <div className="w-6 h-1 bg-blue-400" /><div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-blue-400" />
            </motion.div>
          )}
        </motion.div>
      ))}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: nodes.length * 0.2 }} className="text-gray-400 ml-1 text-xl font-mono">NULL</motion.div>
    </motion.div>
  );
};

const StackViz = () => {
  const [stack, setStack] = useState([15]);
  useEffect(() => {
    const interval = setInterval(() => setStack(prev => (prev.length >= 4 ? [15] : [...prev, Math.floor(Math.random() * 50)])), 1200);
    return () => clearInterval(interval);
  }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col-reverse items-center gap-1 h-full justify-end pb-2">
      <div className="w-24 h-2 bg-gradient-to-r from-orange-600 to-red-600 rounded-full" />
      <AnimatePresence>
        {stack.map((val, i) => (
          <motion.div key={`${val}-${i}`} initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} transition={{ duration: 0.3 }} className="w-20 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-md flex items-center justify-center shadow-lg border border-orange-300 text-white font-bold text-sm">{val}</motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

const QueueViz = () => {
  const [queue, setQueue] = useState([9, 15, 23, 42]);
  useEffect(() => {
    const interval = setInterval(() => setQueue(prev => [...prev.slice(1), Math.floor(Math.random() * 50) + 10]), 1500);
    return () => clearInterval(interval);
  }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2 items-center">
      <span className="text-xs text-green-400 font-bold uppercase tracking-widest">OUT</span>
      <AnimatePresence mode="popLayout">
        {queue.map((val, i) => (
          <motion.div key={`${val}-${i}`} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} transition={{ duration: 0.5 }} className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg border border-green-300 text-white font-bold text-sm">{val}</motion.div>
        ))}
      </AnimatePresence>
      <span className="text-xs text-green-400 font-bold uppercase tracking-widest">IN</span>
    </motion.div>
  );
};

const BinaryTreeViz = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex items-center justify-center">
    <svg viewBox="-50 -30 400 200" className="w-full h-full p-2"> 
      <line x1="150" y1="25" x2="90" y2="65" stroke="#ec4899" strokeWidth="2" />
      <line x1="150" y1="25" x2="210" y2="65" stroke="#ec4899" strokeWidth="2" />
      <line x1="90" y1="65" x2="50" y2="110" stroke="#ec4899" strokeWidth="2" />
      <line x1="90" y1="65" x2="130" y2="110" stroke="#ec4899" strokeWidth="2" />
      <line x1="210" y1="65" x2="170" y2="110" stroke="#ec4899" strokeWidth="2" />
      <line x1="210" y1="65" x2="250" y2="110" stroke="#ec4899" strokeWidth="2" />
      
      <circle cx="150" cy="25" r="16" fill="#ec4899" /><text x="150" y="30" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">50</text>
      <circle cx="90" cy="65" r="16" fill="#a855f7" /><text x="90" y="70" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">30</text>
      <circle cx="210" cy="65" r="16" fill="#a855f7" /><text x="210" y="70" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">70</text>
      <circle cx="50" cy="110" r="16" fill="#a855f7" /><text x="50" y="115" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">20</text>
      <circle cx="130" cy="110" r="16" fill="#a855f7" /><text x="130" y="115" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">40</text>
      <circle cx="170" cy="110" r="16" fill="#a855f7" /><text x="170" y="115" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">60</text>
      <circle cx="250" cy="110" r="16" fill="#a855f7" /><text x="250" y="115" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">80</text>
    </svg>
  </motion.div>
);

const GraphViz = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex items-center justify-center">
    <svg viewBox="-50 -50 400 250" className="w-full h-full p-2">
      <line x1="150" y1="20" x2="80" y2="70" stroke="#22c55e" strokeWidth="2" />
      <line x1="150" y1="20" x2="220" y2="70" stroke="#22c55e" strokeWidth="2" />
      <line x1="80" y1="70" x2="220" y2="70" stroke="#22c55e" strokeWidth="2" />
      <line x1="80" y1="70" x2="50" y2="120" stroke="#22c55e" strokeWidth="2" />
      <line x1="220" y1="70" x2="180" y2="120" stroke="#22c55e" strokeWidth="2" />
      <circle cx="150" cy="20" r="16" fill="#14b8a6" /><text x="150" y="25" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">A</text>
      <circle cx="80" cy="70" r="16" fill="#22c55e" /><text x="80" y="75" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">B</text>
      <circle cx="220" cy="70" r="16" fill="#22c55e" /><text x="220" y="75" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">C</text>
      <circle cx="50" cy="120" r="16" fill="#22c55e" /><text x="50" y="125" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">D</text>
      <circle cx="180" cy="120" r="16" fill="#22c55e" /><text x="180" y="125" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">E</text>
    </svg>
  </motion.div>
);

// --- 6. MAIN PROJECTOR ---
export default function ProjectorView() {
  const { timeLeft, gameState, users } = useGame();
  const [leaderboard, setLeaderboard] = useState([]);
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setFactIndex(p => (p + 1) % FUN_FACTS.length), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (gameState.status === 'revealed') {
      const fetchLeaders = async () => {
        const q = query(collection(db, `sessions/${SESSION_ID}/players`), orderBy('score', 'desc'), limit(5));
        const snap = await getDocs(q);
        setLeaderboard(snap.docs.map(d => d.data()));
      };
      fetchLeaders();
    }
  }, [gameState.status]);

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  const isCritical = timeLeft < 60 && timeLeft > 0;
  const isFinished = timeLeft === 0;

  return (
    <div className="h-screen w-screen bg-[#050505] text-white flex flex-col overflow-hidden relative font-sans">
      
      {/* Backgrounds */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-[#050505] to-[#050505]" />
      <ParticleBackground />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50" />

      {/* --- STATUS HEADER --- */}
      <div className="absolute top-8 left-8 z-50">
         <div className="px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-sm font-mono text-red-400 flex items-center gap-2 shadow-lg">
            <Lock size={14} /> DATABASE LOCKED
         </div>
      </div>
      <div className="absolute top-8 right-8 z-50">
         <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-mono text-gray-300 flex items-center gap-2 shadow-lg backdrop-blur-md">
            <Users size={14} className="text-blue-400" /> 
            <span className="font-bold text-white">{users.length}</span> AGENTS
         </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* PHASE 0: IDLE / THANK YOU */}
        {(gameState.status === 'closed' || gameState.status === 'idle') && (
          <motion.div 
            key="closed"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center justify-center space-y-6 relative z-10 h-full"
          >
            {gameState.status === 'idle' ? (
               <>
                 <div className="p-8 bg-white/5 border border-white/10 rounded-full animate-pulse"><Lock size={64} className="text-gray-500" /></div>
                 <h1 className="text-7xl font-black text-gray-500 tracking-widest uppercase">AWAITING SIGNAL</h1>
               </>
            ) : (
               <>
                 <div className="p-8 bg-green-500/10 border border-green-500/30 rounded-full animate-pulse"><Trophy size={80} className="text-green-500" /></div>
                 <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 tracking-tighter uppercase text-center leading-tight">MISSION<br/>ACCOMPLISHED</h1>
               </>
            )}
          </motion.div>
        )}

        {/* PHASE 1: ACTIVE STATE */}
        {gameState.status === 'active' && (
          <motion.div 
            key="active"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 grid grid-rows-[1fr_auto] h-full w-full p-8 pt-16 gap-8 max-w-[1800px] mx-auto"
          >
             {/* TIMER */}
             <div className="flex flex-col justify-center items-center">
                {isFinished ? (
                   <motion.div 
                     initial={{ scale: 0.8, opacity: 0 }} 
                     animate={{ scale: 1, opacity: 1 }} 
                     className="text-[8rem] font-black text-red-600 tracking-tighter drop-shadow-[0_0_60px_rgba(220,38,38,0.6)] uppercase font-mono text-center leading-none"
                   >
                     SYSTEM<br/>HALTED
                   </motion.div>
                ) : (
                   <div className="relative">
                       {/* Centered Pause Indicator */}
                       {!gameState.isRunning && (
                          <div className="absolute inset-0 flex items-center justify-center z-20">
                             <div className="bg-yellow-500/90 text-black px-8 py-3 rounded-xl font-black text-4xl tracking-widest flex items-center gap-3 shadow-2xl animate-pulse">
                                <Activity size={36} /> PAUSED
                             </div>
                          </div>
                       )}
                       <div className={clsx(!gameState.isRunning && "opacity-20 blur-sm transition-all duration-500")}>
                           <DigitalTimer timeLeft={timeLeft} isUrgent={isCritical} />
                       </div>
                   </div>
                )}
             </div>

             {/* INFO DECK */}
             <div className="grid grid-cols-2 gap-8 h-[350px]">
                <div className="bg-[#0A0A0A]/80 border border-white/10 rounded-3xl p-8 flex items-center gap-8 relative overflow-hidden shadow-2xl">
                   <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500" />
                   <div className="shrink-0 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <AnimatePresence mode="wait">
                        <motion.div key={factIndex} initial={{opacity:0, scale:0.8}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.8}}>
                          <AnimatedIcon type={FUN_FACTS[factIndex].icon} />
                        </motion.div>
                      </AnimatePresence>
                   </div>
                   <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                        <Sparkles size={14} className="text-purple-400" /> Database Fragment
                      </div>
                      <AnimatePresence mode="wait">
                        <motion.p 
                          key={factIndex} 
                          initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} 
                          className="text-2xl text-gray-200 font-medium leading-tight"
                        >
                          "{FUN_FACTS[factIndex].text}"
                        </motion.p>
                      </AnimatePresence>
                   </div>
                </div>

                <div className="bg-[#0A0A0A]/80 border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl flex flex-col">
                   <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-purple-500 to-pink-500" />
                   <DataStructureViz />
                </div>
             </div>
          </motion.div>
        )}

        {/* PHASE 2: LEADERBOARD */}
        {gameState.status === 'revealed' && (
          <motion.div 
            key="leaderboard"
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
            className="relative z-10 flex flex-col items-center justify-center h-full w-full max-w-5xl mx-auto p-8"
          >
             <header className="text-center mb-12">
               <Trophy size={80} className="text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_30px_rgba(250,204,21,0.4)]" />
               <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 tracking-tighter">
                 TOP PERFORMERS
               </h1>
             </header>

             <div className="w-full space-y-4">
                {leaderboard.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={clsx(
                      "flex items-center justify-between p-6 rounded-2xl border transition-all",
                      index === 0 
                        ? "bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-500/50" 
                        : "bg-[#0A0A0A] border-white/10"
                    )}
                  >
                    <div className="flex items-center gap-8">
                      <div className={clsx("text-4xl font-mono font-bold w-16 text-center", index === 0 ? "text-yellow-400" : "text-gray-600")}>
                        #{index + 1}
                      </div>
                      <div className="text-3xl font-bold text-white">{user.name}</div>
                    </div>
                    <div className="text-4xl font-mono font-bold text-white tracking-tight">
                      {user.score} <span className="text-sm text-gray-500 uppercase">XP</span>
                    </div>
                  </motion.div>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}