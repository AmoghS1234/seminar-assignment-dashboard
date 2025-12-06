import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import AdminLogin from './AdminLogin';
import { 
  Play, Pause, Square, Users, Eye, ShieldAlert, LogOut, 
  CheckCircle, Lock, Unlock, Trophy, Terminal, 
  RotateCcw, StopCircle, ArrowRight, Clock, ExternalLink, Download, X, AlertCircle, Activity, Radio, Search
} from 'lucide-react';
import { clsx } from 'clsx';
import { doc, updateDoc, deleteDoc, collection, getDocs, setDoc, arrayUnion, arrayRemove, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';

const SESSION_ID = 'vibe-live';

const PROJECTS = [
  { id: 1, name: "Bubble Sort" },
  { id: 2, name: "Merge Sort" },
  { id: 3, name: "Quick Sort" },
  { id: 4, name: "Pathfinding" },
  { id: 5, name: "Dijkstra" }
];

const AdminControl = () => {
  const { gameState, startTimer: contextStartTimer, pauseTimer, resumeTimer, stopSession } = useGame();
  const { timeLeft } = useGame(); 
  
  // --- STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customTime, setCustomTime] = useState(25); 
  const [safetyLocked, setSafetyLocked] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data
  const [allPlayers, setAllPlayers] = useState([]);
  const [metrics, setMetrics] = useState({ active: 0, finished: 0, pending: 0 });
  const [inspectingUser, setInspectingUser] = useState(null);

  // --- 1. AUTH ---
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- 2. REAL-TIME LISTENER ---
  useEffect(() => {
    // FIX: Order by 'joinedAt' ensures ALL teams appear, even if they haven't acted yet
    const q = query(collection(db, `sessions/${SESSION_ID}/players`), orderBy("joinedAt", "desc"));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const players = snapshot.docs.map(d => {
        const data = d.data();
        let pending = data.pendingProjectIds || [];
        if (data.pendingProjectId && !pending.includes(data.pendingProjectId)) pending.push(data.pendingProjectId);
        return { ...data, id: d.id, pending };
      });

      // Client-side Sort: Pending First -> Then Finished -> Then Others
      const sortedPlayers = players.sort((a, b) => {
         const aPending = a.pending.length > 0 ? 2 : 0;
         const bPending = b.pending.length > 0 ? 2 : 0;
         
         const aDone = (a.projectsCompleted || 0) >= 5 ? 1 : 0;
         const bDone = (b.projectsCompleted || 0) >= 5 ? 1 : 0;
         
         const score = (bPending - aPending) || (bDone - aDone);
         // Tie-breaker: Join time
         return score !== 0 ? score : (b.joinedAt?.seconds || 0) - (a.joinedAt?.seconds || 0);
      });

      setAllPlayers(sortedPlayers);

      // Metrics
      let active = 0, finished = 0, pending = 0;
      players.forEach(p => {
        const count = (p.completedProjects?.length) || (p.projectsCompleted || 0);
        if (p.pending.length > 0) pending++;
        if (count >= 5) finished++; else active++;
      });
      setMetrics({ active, finished, pending });

      if (inspectingUser) {
        const updated = players.find(p => p.id === inspectingUser.id);
        if (updated) setInspectingUser(updated);
      }
    });
    return () => unsub();
  }, [inspectingUser]);

  // --- ACTIONS ---
  const handleLogout = () => signOut(getAuth());
  const handleStartSession = () => contextStartTimer(customTime);
  const handleRevealLeaderboard = async () => await updateDoc(doc(db, "system", "config"), { status: 'revealed' });

  const gradeUser = async (userId, projectId, points) => {
    const userRef = doc(db, `sessions/${SESSION_ID}/players`, userId);
    const player = allPlayers.find(p => p.id === userId);
    if (!player) return;

    await updateDoc(userRef, {
      score: (player.score || 0) + points,
      status: 'idle',
      pendingProjectIds: arrayRemove(projectId),
      pendingProjectId: null, 
      completedProjects: arrayUnion(projectId),
      projectsCompleted: (player.projectsCompleted || 0) + 1
    });
  };

  const handleResetDB = async () => {
    await setDoc(doc(db, "system", "config"), { status: 'idle', isRunning: false, endTime: null, remainingTime: 0 });
    const snap = await getDocs(collection(db, `sessions/${SESSION_ID}/players`));
    await Promise.all(snap.docs.map(d => deleteDoc(doc(db, `sessions/${SESSION_ID}/players`, d.id))));
    setConfirmReset(false); setSafetyLocked(true);
  };

  // --- RENDER ---
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-purple-500 font-mono animate-pulse">SYSTEM_BOOT...</div>;
  if (!isAuthenticated) return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />;

  const currentStatus = gameState?.status || 'offline';
  
  // Filter for search
  const displayedPlayers = allPlayers.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="w-full min-h-screen bg-[#050505] text-gray-200 font-sans pb-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="max-w-[1600px] mx-auto p-6 space-y-8 relative z-10">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6 pt-2">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-white"><Terminal size={24} /></div>
                <div><h1 className="text-3xl font-black text-white tracking-tighter">ADMIN <span className="text-purple-500">CONSOLE</span></h1></div>
            </div>
            <div className="flex gap-3">
                 <button onClick={handleLogout} className="p-3 bg-white/5 hover:bg-red-500/10 border border-white/10 rounded-xl text-gray-400 hover:text-red-400"><LogOut size={20}/></button>
            </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col justify-between h-28"><span className="text-xs font-bold text-gray-500 uppercase">Total Teams</span><span className="text-4xl font-black text-white">{allPlayers.length}</span></div>
           <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-2xl flex flex-col justify-between h-28 shadow-lg shadow-purple-900/20"><span className="text-xs font-bold text-purple-300 uppercase">Review Needed</span><span className="text-4xl font-black text-white">{metrics.pending}</span></div>
           <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col justify-between h-28"><span className="text-xs font-bold text-gray-500 uppercase">Active</span><span className="text-4xl font-black text-green-400">{metrics.active}</span></div>
           <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col justify-between h-28"><span className="text-xs font-bold text-gray-500 uppercase">Finished</span><span className="text-4xl font-black text-blue-400">{metrics.finished}</span></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT: SESSION CONTROLS (4 Cols) */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* TIMER */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 space-y-6">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Clock size={14} /> Timer Control</h3>
                    
                    {/* Show Controls regardless of state so you can restart easily */}
                    <div className="space-y-4">
                        {/* Time Input */}
                        <div>
                            <label className="text-xs text-gray-400 font-bold ml-1 mb-1 block">Duration (Minutes)</label>
                            <input type="number" value={customTime} onChange={(e) => setCustomTime(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-mono text-lg outline-none" />
                        </div>
                        
                        {/* Action Buttons */}
                        {gameState.status === 'active' ? (
                           <div className="space-y-4">
                                <div className="text-center py-4 bg-white/5 rounded-xl border border-white/5">
                                   <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Time Remaining</div>
                                   <div className={clsx("text-4xl font-mono font-bold", gameState.isRunning ? "text-white" : "text-yellow-500")}>
                                      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                   </div>
                                   {!gameState.isRunning && <div className="text-[10px] text-yellow-500 font-bold mt-1 animate-pulse">PAUSED</div>}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                   {gameState.isRunning ? (
                                      <button onClick={pauseTimer} className="py-4 rounded-xl bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 font-bold text-xs hover:bg-yellow-500/20 flex items-center justify-center gap-2"><Pause size={16} fill="currentColor" /> PAUSE</button>
                                   ) : (
                                      <button onClick={resumeTimer} className="py-4 rounded-xl bg-green-500/10 text-green-500 border border-green-500/30 font-bold text-xs hover:bg-green-500/20 flex items-center justify-center gap-2"><Play size={16} fill="currentColor" /> RESUME</button>
                                   )}
                                   <button onClick={stopSession} className="py-4 rounded-xl bg-red-500/10 text-red-500 border border-red-500/30 font-bold text-xs hover:bg-red-500/20 flex items-center justify-center gap-2"><Square size={16} fill="currentColor" /> END</button>
                                </div>
                           </div>
                        ) : (
                            <button onClick={handleStartSession} className="w-full py-4 rounded-xl font-bold text-sm bg-white text-black hover:bg-gray-200 shadow-lg flex items-center justify-center gap-2"><Play size={16} fill="currentColor" /> START SESSION</button>
                        )}
                    </div>
                </div>

                {/* REVEAL */}
                <div className="p-6 rounded-3xl border border-white/10 bg-[#0A0A0A] flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-white mb-1">Leaderboard</h3>
                        <p className="text-xs text-gray-500">Show final results</p>
                    </div>
                    <button onClick={handleRevealLeaderboard} disabled={gameState.status === 'revealed'} className="px-6 py-3 rounded-xl font-bold text-xs bg-purple-600 text-white hover:bg-purple-500 shadow-lg disabled:opacity-50">REVEAL</button>
                </div>

                {/* DANGER ZONE */}
                <div className={clsx("p-6 rounded-3xl border transition-all", safetyLocked ? "bg-[#0A0A0A] border-white/5 opacity-60" : "bg-red-950/10 border-red-900")}>
                   <div className="flex items-center justify-between mb-4">
                     <span className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2"><ShieldAlert size={14} /> Danger Zone</span>
                     <button onClick={() => { setSafetyLocked(!safetyLocked); setConfirmReset(false); }} className="text-[10px] font-bold border border-white/10 px-2 py-1 rounded text-gray-400 hover:text-white">{safetyLocked ? "UNLOCK" : "LOCK"}</button>
                   </div>
                   <button onClick={handleResetDB} disabled={safetyLocked} className="w-full py-3 bg-transparent border border-red-900/30 text-red-500 hover:bg-red-900/10 rounded-xl font-bold text-xs disabled:cursor-not-allowed">{confirmReset ? "CONFIRM WIPE?" : "RESET DATABASE"}</button>
                </div>
            </div>

            {/* RIGHT: TEAM GRID (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col gap-4 h-[800px]">
                
                {/* Search Bar */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                    <Search className="text-gray-500" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search Team..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent text-white font-bold outline-none w-full placeholder:text-gray-600"
                    />
                </div>

                {/* THE GRID OF TEAMS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto custom-scrollbar pr-2 content-start flex-1">
                   {displayedPlayers.length === 0 && <div className="col-span-full text-center py-20 text-gray-600 opacity-50 font-mono uppercase tracking-widest">No teams found</div>}
                   
                   <AnimatePresence>
                   {displayedPlayers.map(player => {
                      const hasPending = player.pending && player.pending.length > 0;
                      const isFinished = (player.projectsCompleted || 0) >= 5;
                      
                      return (
                        <motion.div 
                          key={player.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                          onClick={() => setInspectingUser(player)}
                          className={clsx(
                            "relative p-5 rounded-2xl border cursor-pointer transition-all group flex flex-col justify-between min-h-[140px]",
                            hasPending 
                              ? "bg-purple-900/20 border-purple-500/50 hover:border-purple-400 shadow-lg shadow-purple-900/20"
                              : isFinished
                                ? "bg-green-900/10 border-green-500/30 hover:bg-green-900/20"
                                : "bg-[#0A0A0A] border-white/10 hover:border-white/30 hover:bg-white/5"
                          )}
                        >
                           <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-4">
                                  <div className={clsx(
                                    "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border",
                                    hasPending ? "bg-purple-500 text-white border-purple-400" : "bg-white/10 text-gray-400 border-white/5"
                                  )}>
                                    {player.name.charAt(0)}
                                  </div>
                                  <div>
                                     <div className="font-bold text-white text-lg leading-none mb-1">{player.name}</div>
                                     <div className="text-xs text-gray-500 font-mono">XP: {player.score}</div>
                                  </div>
                              </div>
                              {hasPending && (
                                 <div className="px-2 py-1 rounded-md bg-purple-500 text-white text-[10px] font-bold animate-pulse shadow-lg">
                                    {player.pending.length} PENDING
                                 </div>
                              )}
                           </div>

                           <div className="mt-auto">
                               <div className="flex gap-1 mb-2">
                                  {[1,2,3,4,5].map(i => {
                                     const isDone = (player.completedProjects || []).includes(i);
                                     return (
                                       <div key={i} className={clsx("h-1.5 flex-1 rounded-full", isDone ? "bg-green-500" : "bg-white/10")} />
                                     )
                                  })}
                               </div>
                               <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                  <span>{player.projectsCompleted || 0}/5 DONE</span>
                                  <span className="group-hover:text-white transition-colors flex items-center gap-1">INSPECT <ArrowRight size={10}/></span>
                               </div>
                           </div>
                        </motion.div>
                      );
                   })}
                   </AnimatePresence>
                </div>
            </div>
        </div>

        {/* INSPECTION MODAL */}
        <AnimatePresence>
        {inspectingUser && (
           <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setInspectingUser(null)}>
             <motion.div className="w-full max-w-3xl bg-[#111] border border-white/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                <button onClick={() => setInspectingUser(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={24} /></button>
                
                <div className="mb-8">
                   <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl font-bold text-white">{inspectingUser.name.charAt(0)}</div>
                      <div>
                         <h2 className="text-3xl font-black text-white tracking-tight">{inspectingUser.name}</h2>
                         <div className="text-sm text-gray-400 font-mono">Total Score: <span className="text-purple-400 font-bold">{inspectingUser.score}</span></div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {PROJECTS.map((p) => {
                      const isDone = (inspectingUser.completedProjects || []).includes(p.id);
                      const isPending = inspectingUser.pending.includes(p.id);
                      return (
                        <div key={p.id} className={clsx("p-4 rounded-xl border flex items-center justify-between transition-all", isPending ? "bg-purple-900/10 border-purple-500/50" : isDone ? "bg-green-900/5 border-green-500/20 opacity-60" : "bg-white/5 border-white/5 opacity-30")}>
                            <div className="flex items-center gap-4">
                              <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm", isPending ? "bg-purple-500 text-white" : isDone ? "bg-green-500/20 text-green-400" : "bg-white/10 text-gray-500")}>{p.id}</div>
                              <div>
                                  <div className={clsx("font-bold", isPending ? "text-white" : "text-gray-400")}>{p.name}</div>
                                  {isPending && inspectingUser.submissionUrl && <a href={inspectingUser.submissionUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs mt-1 hover:underline"><ExternalLink size={10} /> Link</a>}
                              </div>
                            </div>
                            {isPending ? (
                              <div className="flex items-center gap-2">
                                  <button onClick={() => gradeUser(inspectingUser.id, p.id, 10)} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300">+10</button>
                                  <button onClick={() => gradeUser(inspectingUser.id, p.id, 20)} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold flex items-center gap-1"><CheckCircle size={14} /> Accept</button>
                              </div>
                            ) : isDone ? <div className="px-3 py-1 rounded bg-green-500/10 text-green-500 text-xs font-bold flex items-center gap-1"><CheckCircle size={12} /> Done</div> : null}
                        </div>
                      );
                  })}
                </div>
             </motion.div>
           </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminControl;