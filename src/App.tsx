// src/App.tsx
import React, { useState, useEffect } from 'react';
import './App.css';
import { CrashGame, FirebaseTest, FirebaseDebug } from './components';
import './styles/CrashGame.css';
import './styles/theme.css';
import { motion, AnimatePresence } from 'framer-motion';
import { isFirebaseInitialized } from './firebase/config';
import FirebaseRulesTest from './components/FirebaseRulesTest';
import styled from 'styled-components';

const AppContainer = styled.div`
  background-color: #1A1A1A;
  min-height: 100vh;
  color: #FFFFFF;
`;

const AppHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: linear-gradient(90deg, #282C34, #1A1A1A);
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  
  h1 {
    margin: 0;
    font-size: 1.5rem;
    color: #0096FF;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
    padding: 1rem;
  }
`;

const AppContent = styled.main`
  min-height: calc(100vh - 140px);
  padding: 1rem;
`;

const AppFooter = styled.footer`
  text-align: center;
  padding: 1rem;
  background-color: #282C34;
  font-size: 0.8rem;
  color: #CCCCCC;
  border-top: 1px solid #3A3F4B;
`;

const DebugControls = styled.div`
  display: flex;
  gap: 10px;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }
`;

const DebugButton = styled(motion.button) <{ $active: boolean }>`
  background-color: ${props => props.$active ? '#0096FF' : 'rgba(0, 150, 255, 0.2)'};
  color: white;
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  font-weight: ${props => props.$active ? 'bold' : 'normal'};
  
  &:hover {
    background-color: ${props => props.$active ? '#0096FF' : 'rgba(0, 150, 255, 0.4)'};
  }
  
  @media (max-width: 768px) {
    flex: 1;
    text-align: center;
  }
`;

const Loading = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #FFFFFF;
`;

const Spinner = styled.div`
  border: 4px solid rgba(0, 150, 255, 0.1);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border-left-color: #0096FF;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

function App() {
  const [activeComponent, setActiveComponent] = useState<'game' | 'test' | 'debug' | 'rules'>('game');
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    // Check if Firebase is initialized properly
    const checkFirebase = () => {
      if (isFirebaseInitialized) {
        setFirebaseReady(true);
      } else {
        // Retry after a short delay
        setTimeout(checkFirebase, 500);
      }
    };

    checkFirebase();
  }, []);

  return (
    <AppContainer>
      <AppHeader>
        <h1>Multiplayer Crash Game</h1>
        <DebugControls>
          <DebugButton
            onClick={() => setActiveComponent('game')}
            $active={activeComponent === 'game'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Game
          </DebugButton>
          <DebugButton
            onClick={() => setActiveComponent('test')}
            $active={activeComponent === 'test'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Firebase Test
          </DebugButton>
          <DebugButton
            onClick={() => setActiveComponent('debug')}
            $active={activeComponent === 'debug'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Firebase Debug
          </DebugButton>
          <DebugButton
            onClick={() => setActiveComponent('rules')}
            $active={activeComponent === 'rules'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Rules Test
          </DebugButton>
        </DebugControls>
      </AppHeader>

      <AppContent>
        {!firebaseReady ? (
          <Loading>
            <h2>Initializing Firebase...</h2>
            <Spinner />
          </Loading>
        ) : (
          <AnimatePresence mode="wait">
            {activeComponent === 'game' && (
              <motion.div
                key="game"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <CrashGame />
              </motion.div>
            )}

            {activeComponent === 'test' && (
              <motion.div
                key="test"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <FirebaseTest />
              </motion.div>
            )}

            {activeComponent === 'debug' && (
              <motion.div
                key="debug"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <FirebaseDebug />
              </motion.div>
            )}

            {activeComponent === 'rules' && (
              <motion.div
                key="rules"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <FirebaseRulesTest />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </AppContent>

      <AppFooter>
        <p>© 2025 Multiplayer Crash Game - Built with React & Firebase</p>
      </AppFooter>
    </AppContainer>
  );
}

export default App;