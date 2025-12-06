import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import ProjectorView from './pages/ProjectorView';
import StudentDeck from './pages/StudentDeck';
import AdminControl from './pages/AdminControl';
import './index.css';

function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<StudentDeck />} />
          <Route path="/admin" element={<AdminControl />} />
          <Route path="/projector" element={<ProjectorView />} />
        </Routes>
      </BrowserRouter>
    </GameProvider>
  );
}

export default App;