import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { ShieldAlert, Lock, ArrowRight, Terminal } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

const AdminLogin = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const auth = getAuth();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess();
    } catch (err) {
      setError('Invalid Command. Access Denied.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Theme Background */}
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-pink-900/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-900/20">
            <Terminal className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2">System Admin</h1>
          <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">Secure Authentication Required</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="group">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block ml-2">Operative ID</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                placeholder="admin@system.com"
                required
              />
            </div>
            
            <div className="group">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block ml-2">Passcode</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-bold animate-shake">
              <ShieldAlert size={16} /> {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={clsx(
              "w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
              loading ? "bg-white/5 text-gray-500 cursor-wait" : "bg-white text-black hover:bg-gray-200 shadow-xl shadow-purple-900/10"
            )}
          >
            {loading ? "Decrypting..." : "Initialize Session"} 
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;