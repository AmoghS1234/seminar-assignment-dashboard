import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { 
  Send, Lock, User, Terminal, CheckCircle2, Clock, 
  ChevronRight, Link, X, Loader2, AlertCircle, PlayCircle, Radio, Hourglass 
} from 'lucide-react';
import { clsx } from 'clsx';
import { doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';

const PROJECTS = [
  { id: 1, name: "Bubble Sort", desc: "Visualizer Engine" },
  { id: 2, name: "Merge Sort", desc: "Recursive Logic" },
  { id: 3, name: "Quick Sort", desc: "Partitioning" },
  { id: 4, name: "Pathfinding", desc: "BFS/DFS Traversal" },
  { id: 5, name: "Dijkstra", desc: "Shortest Path" }
];

const TOTAL_PROJECTS = PROJECTS.length;

const StudentDeck = () => {
  const { currentUser, registerUser, timeLeft, gameState } = useGame();
  const [nameInput, setNameInput] = useState('');
  
  // Modal State
  const [selectedProject, setSelectedProject] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- HANDLERS ---

  const openSubmitModal = (project) => {
    setSelectedProject(project);
    setUrlInput(currentUser?.submissionUrl || ''); 
  };

  const closeSubmitModal = () => {
    setSelectedProject(null);
    setIsSubmitting(false);
  };

  const confirmSubmission = async () => {
    if (!currentUser || !selectedProject) return;
    
    setIsSubmitting(true);
    try {
      const userRef = doc(db, `sessions/vibe-live/players`, currentUser.id);
      await updateDoc(userRef, {
        status: 'pending_review',
        pendingProjectIds: arrayUnion(selectedProject.id),
        submissionUrl: urlInput,
        lastActive: serverTimestamp()
      });
      closeSubmitModal();
    } catch (error) {
      console.error("Submission failed", error);
      alert("Error submitting. Check permissions.");
      setIsSubmitting(false);
    }
  };

  // --- 1. LOGIN SCREEN (No User) ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-20%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-purple-600/20 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#0A0A0A] border border-white/10 p-6 sm:p-10 rounded-3xl shadow-2xl relative z-10"
        >
          <div className="flex flex-col items-center mb-8 sm:mb-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 mb-4 sm:mb-6">
              <Terminal size={32} className="text-white sm:w-10 sm:h-10" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white text-center">OPERATIVE LOGIN</h1>
            <p className="text-gray-500 text-xs sm:text-sm font-mono mt-2 uppercase tracking-widest">
              Session: {gameState.status === 'active' ? <span className="text-green-400">LIVE</span> : <span className="text-red-400">OFFLINE</span>}
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
               <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider">Codename</label>
               <input 
                 type="text" 
                 value={nameInput}
                 onChange={(e) => setNameInput(e.target.value)}
                 placeholder="ENTER ID..."
                 className="w-full bg-[#111] border border-white/10 text-white text-lg sm:text-xl font-bold px-5 py-3 sm:px-6 sm:py-4 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-700"
               />
            </div>

            <button 
              onClick={() => registerUser(nameInput)}
              disabled={!nameInput || gameState.status === 'closed'}
              className={clsx(
                "w-full py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] uppercase tracking-wider shadow-lg",
                !nameInput || gameState.status === 'closed' 
                  ? "bg-white/5 text-gray-500 cursor-not-allowed" 
                  : "bg-white text-black hover:bg-gray-200"
              )}
            >
              {gameState.status === 'closed' ? "SYSTEM LOCKED" : "ESTABLISH UPLINK"}
              {gameState.status !== 'closed' && <ChevronRight size={20} />}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- 2. STANDBY SCREEN (User Logged In, BUT Timer Not Started) ---
  // This is the screen that shows "Starting Soon"
  if (gameState.status === 'idle' || gameState.status === 'waiting') {
     return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden text-center">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#050505] to-[#050505]" />
           
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="relative z-10 flex flex-col items-center gap-8 max-w-md"
           >
              <div className="relative">
                 <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 rounded-full animate-pulse" />
                 <div className="w-24 h-24 bg-[#111] border border-blue-500/30 rounded-full flex items-center justify-center shadow-2xl">
                    <Radio size={40} className="text-blue-500 animate-pulse" />
                 </div>
              </div>
              
              <div className="space-y-2">
                 <h1 className="text-4xl font-black tracking-tighter text-white">MISSION STANDBY</h1>
                 <p className="text-gray-500 font-mono uppercase tracking-widest text-sm">
                    Welcome, Operative <span className="text-white font-bold">{currentUser.name}</span>
                 </p>
              </div>

              <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl flex items-center gap-3 text-sm text-gray-400 animate-pulse w-full justify-center">
                 <Hourglass size={16} className="animate-spin-slow" />
                 <span>Awaiting Admin Signal...</span>
              </div>
              
              <p className="text-xs text-gray-600">Do not refresh the page.</p>
           </motion.div>
        </div>
     );
  }
  
  // --- 3. SESSION ENDED SCREEN ---
  if (gameState.status === 'revealed' || gameState.status === 'closed') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-[#050505] to-[#050505]" />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-[#0A0A0A] border border-white/10 p-10 rounded-[3rem] shadow-2xl relative z-10"
        >
           <div className="w-24 h-24 bg-gradient-to-tr from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-500/20">
              <div className="text-white"><CheckCircle2 size={40} /></div>
           </div>
           
           <h1 className="text-4xl font-black text-white tracking-tighter mb-2">SESSION<br/>CLOSED</h1>
           <p className="text-gray-500 font-mono text-sm uppercase tracking-widest mb-8">Submissions are disabled</p>

           <div className="bg-[#111] rounded-2xl p-6 border border-white/5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Final Score</p>
              <div className="text-5xl font-mono font-black text-purple-400">{currentUser.score} <span className="text-sm text-gray-600">XP</span></div>
           </div>

           <p className="mt-8 text-gray-600 text-xs">Check the main projector for the leaderboard.</p>
        </motion.div>
      </div>
    );
 }

  // --- 4. MAIN DASHBOARD (Active Session) ---
  const pendingIds = currentUser.pendingProjectIds || [];
  if (currentUser.pendingProjectId && !pendingIds.includes(currentUser.pendingProjectId)) {
    pendingIds.push(currentUser.pendingProjectId);
  }

  const completedIds = currentUser.completedProjects || [];
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-24 sm:pb-10 overflow-y-auto">
      
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-[#050505]/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 sm:px-8 sm:py-4 mb-6 sm:mb-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-sm sm:text-lg shadow-inner border border-white/20">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Operative</div>
              <div className="text-lg sm:text-xl font-bold text-white leading-none">{currentUser.name}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-8">
             {/* Timer Pill */}
             <div className={clsx("flex items-center gap-2 sm:gap-3 px-3 py-1.5 sm:px-5 sm:py-2 rounded-full border transition-colors", timeLeft < 60 ? "bg-red-500/10 border-red-500/30" : "bg-white/5 border-white/10")}>
                <Clock size={16} className={clsx("sm:w-5 sm:h-5", timeLeft < 60 ? "text-red-400" : "text-purple-400")} />
                <span className={clsx("text-lg sm:text-2xl font-mono font-bold", timeLeft < 60 ? "text-red-400 animate-pulse" : "text-white")}>
                  {mins}:{secs}
                </span>
             </div>

             <div className="text-right hidden sm:block">
               <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total XP</div>
               <div className="text-2xl font-mono font-black text-purple-400">{currentUser.score}</div>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">
         
         {/* Progress Bar */}
         <div className="bg-[#0A0A0A] border border-white/10 p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex items-center justify-between shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1 bg-purple-500 transition-all duration-500" style={{ width: `${(completedIds.length / TOTAL_PROJECTS) * 100}%` }} />
            
            <div>
               <h2 className="text-base sm:text-lg font-bold text-white">Mission Progress</h2>
               <p className="text-gray-500 text-xs sm:text-sm mt-1">Complete protocols to decrypt payload.</p>
            </div>
            <div className="text-right">
               <span className="text-2xl sm:text-3xl font-black text-white">{completedIds.length}</span>
               <span className="text-gray-600 text-sm sm:text-lg font-bold"> / {TOTAL_PROJECTS}</span>
            </div>
         </div>

         {/* GRID LAYOUT for Projects */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {PROJECTS.map((project, index) => {
               const isDone = completedIds.includes(project.id);
               const isPending = pendingIds.includes(project.id);
               
               return (
                 <motion.div
                   key={project.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: index * 0.1 }}
                   className={clsx(
                     "p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all relative overflow-hidden group flex flex-col h-44 sm:h-52 justify-between",
                     isDone 
                       ? "bg-green-900/10 border-green-500/20" 
                       : isPending
                         ? "bg-yellow-500/5 border-yellow-500/20"
                         : "bg-[#0A0A0A] border-white/10 hover:border-purple-500/40 hover:bg-white/5"
                   )}
                 >
                    {/* Status Icon (Top Right) */}
                    <div className="absolute top-5 right-5 sm:top-6 sm:right-6">
                       {isDone ? <CheckCircle2 className="text-green-500" size={24} /> : isPending ? <Loader2 className="text-yellow-500 animate-spin" size={24} /> : <div className="text-gray-700 font-black text-3xl sm:text-4xl opacity-20">{index + 1}</div>}
                    </div>

                    {/* Project Info */}
                    <div>
                       <h3 className={clsx("text-lg sm:text-xl font-bold mb-1 sm:mb-2", isDone ? "text-green-400" : "text-white")}>
                          {project.name}
                       </h3>
                       <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide font-mono">{project.desc}</p>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 sm:pt-4 border-t border-white/5 flex items-center justify-between">
                       <span className={clsx("text-[10px] sm:text-xs font-bold uppercase tracking-wider", isDone ? "text-green-600" : isPending ? "text-yellow-600" : "text-gray-600")}>
                          {isDone ? "SECURE" : isPending ? "VERIFYING" : "AVAILABLE"}
                       </span>

                       {!isDone && !isPending && (
                          <button 
                             onClick={() => openSubmitModal(project)}
                             className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-white text-black font-bold text-xs sm:text-sm hover:bg-gray-200 active:scale-95 transition-all flex items-center gap-2"
                          >
                             Submit <PlayCircle size={14} />
                          </button>
                       )}
                    </div>
                 </motion.div>
               );
            })}
         </div>
      </main>

      {/* --- SUBMISSION MODAL --- */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
            onClick={closeSubmitModal}
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full sm:max-w-lg bg-[#111] border-t sm:border border-white/10 rounded-t-[2rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
               <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 sm:hidden" />

               <div className="flex justify-between items-start mb-6 sm:mb-8">
                  <div>
                     <div className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">Upload Protocol</div>
                     <h2 className="text-2xl sm:text-3xl font-black text-white">{selectedProject.name}</h2>
                  </div>
                  <button onClick={closeSubmitModal} className="hidden sm:block p-2 bg-white/5 rounded-full hover:bg-white/20 transition-colors"><X size={20} /></button>
               </div>

               <div className="space-y-5 sm:space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 ml-1">GitHub / Vercel URL</label>
                    <div className="relative">
                      <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                      <input 
                        type="url" 
                        autoFocus
                        value={urlInput} 
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://..." 
                        className="w-full bg-black border border-white/20 text-white pl-12 pr-4 py-4 sm:py-5 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-base sm:text-lg"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={confirmSubmission}
                    disabled={!urlInput || isSubmitting}
                    className={clsx(
                      "w-full py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-purple-900/20",
                      !urlInput ? "bg-white/10 text-gray-500 cursor-not-allowed" : "bg-white text-black hover:bg-gray-200"
                    )}
                  >
                    {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : <>Confirm Submission <Send size={20} /></>}
                  </button>
                  
                  <button onClick={closeSubmitModal} className="w-full py-3 text-gray-500 font-bold text-sm sm:hidden">Cancel</button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default StudentDeck;