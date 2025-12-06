import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, doc, onSnapshot, updateDoc, setDoc, 
  query, orderBy 
} from 'firebase/firestore';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

const SESSION_ID = 'vibe-live'; 

export const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState({ 
    status: 'idle', // idle | active | revealed | closed
    isRunning: false, 
    endTime: null,
    remainingTime: 0 // For pause feature
  });
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // 1. Listen to System Config
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "system", "config"), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setGameState({
          status: data.status || 'idle',
          isRunning: data.isRunning || false,
          endTime: data.endTime?.toDate() || null,
          remainingTime: data.remainingTime || 0
        });
      }
    });
    return () => unsub();
  }, []);

  // 2. Listen to Players
  useEffect(() => {
    const q = query(collection(db, `sessions/${SESSION_ID}/players`), orderBy("score", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
      
      const localId = localStorage.getItem('userId');
      if (localId) {
        const found = usersList.find(u => u.id === localId);
        if (found) setCurrentUser(found);
      }
    });
    return () => unsub();
  }, []);

  // 3. Timer Logic
  useEffect(() => {
    let interval;
    
    if (gameState.status === 'active') {
      if (gameState.isRunning && gameState.endTime) {
        // RUNNING: Calculate from End Time
        interval = setInterval(() => {
          const now = new Date();
          const diff = Math.floor((gameState.endTime - now) / 1000);
          setTimeLeft(diff > 0 ? diff : 0);
        }, 1000);
      } else if (!gameState.isRunning && gameState.remainingTime) {
        // PAUSED: Show frozen remaining time
        setTimeLeft(gameState.remainingTime);
      }
    } else {
      setTimeLeft(0);
    }

    return () => clearInterval(interval);
  }, [gameState]);

  // --- ACTIONS ---

  const registerUser = async (name) => {
    if (!name) return;
    const id = Date.now().toString(); 
    const userData = { 
      name, score: 0, status: 'idle', projectsCompleted: 0, joinedAt: new Date(), completedProjects: [], pendingProjectIds: []
    };
    await setDoc(doc(db, `sessions/${SESSION_ID}/players`, id), userData);
    setCurrentUser({ id, ...userData });
    localStorage.setItem('userId', id); 
  };

  const gradeUser = async (userId, projectId, points) => {
    // Grade logic handled in AdminControl for flexibility
  };

  // Helper to update system doc
  const updateSystem = (data) => updateDoc(doc(db, "system", "config"), data);

  const startTimer = async (minutes) => {
    const endTime = new Date();
    endTime.setMinutes(endTime.getMinutes() + minutes);
    await updateSystem({
      status: 'active',
      isRunning: true,
      endTime: endTime,
      remainingTime: null // Clear pause state
    });
  };

  const pauseTimer = async () => {
    await updateSystem({
      isRunning: false,
      remainingTime: timeLeft // Save where we stopped
    });
  };

  const resumeTimer = async () => {
    const endTime = new Date();
    endTime.setSeconds(endTime.getSeconds() + gameState.remainingTime); // Add remaining seconds to now
    await updateSystem({
      isRunning: true,
      endTime: endTime,
      remainingTime: null
    });
  };

  const stopSession = async () => {
    await updateSystem({ status: 'idle', isRunning: false, endTime: null, remainingTime: 0 });
  };

  return (
    <GameContext.Provider value={{ 
      gameState, users, currentUser, timeLeft, 
      registerUser, gradeUser, 
      startTimer, pauseTimer, resumeTimer, stopSession
    }}>
      {children}
    </GameContext.Provider>
  );
};