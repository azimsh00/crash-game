import React, { useState, useEffect } from 'react';
import { ref, onValue, get, set } from 'firebase/database';
import { auth, database } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

const FirebaseDebug: React.FC = () => {
  const [databaseStatus, setDatabaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().substring(11, 19)} - ${message}`]);
  };
  
  // Check database connectivity
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        addLog("Checking database connectivity...");
        
        // Try to read from a specific location
        const testRef = ref(database, '.info/connected');
        
        const unsubscribe = onValue(testRef, (snapshot) => {
          if (snapshot.val() === true) {
            addLog("Database connection successful");
            setDatabaseStatus('connected');
          } else {
            addLog("Database disconnected");
            setDatabaseStatus('error');
          }
        }, (error) => {
          addLog(`Database connection error: ${error.message}`);
          setDatabaseStatus('error');
          setErrorMessage(error.message);
        });
        
        return () => unsubscribe();
      } catch (error: any) {
        addLog(`Database check failed: ${error.message}`);
        setDatabaseStatus('error');
        setErrorMessage(error.message);
      }
    };
    
    checkDatabase();
  }, []);
  
  // Check authentication status
  useEffect(() => {
    try {
      addLog("Checking authentication status...");
      
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          addLog(`Authenticated as ${user.uid}`);
          setAuthStatus('authenticated');
        } else {
          addLog("Not authenticated");
          setAuthStatus('unauthenticated');
        }
      }, (error) => {
        addLog(`Auth error: ${error.message}`);
        setAuthStatus('error');
        setErrorMessage(error.message);
      });
      
      return () => unsubscribe();
    } catch (error: any) {
      addLog(`Auth check failed: ${error.message}`);
      setAuthStatus('error');
      setErrorMessage(error.message);
    }
  }, []);
  
  // Write test data to verify write permissions
  const testWrite = async () => {
    try {
      addLog("Testing write operation...");
      // Try writing to root level first
      const rootTestRef = ref(database, `test_${Date.now()}`);
      await set(rootTestRef, { 
        timestamp: Date.now(),
        value: "root test"
      });
      addLog("Root level write test successful");
      
      // Then try specific paths
      const testRef = ref(database, `debug/test_${Date.now()}`);
      await set(testRef, { 
        timestamp: Date.now(),
        value: "test"
      });
      addLog("Write test successful");
    } catch (error: any) {
      addLog(`Write test failed: ${error.message}`);
      setErrorMessage(error.message);
    }
  };
  
  return (
    <div className="firebase-debug">
      <h2>Firebase Debug Panel</h2>
      
      <div className="status-container">
        <div className="status-item">
          <span className="status-label">Database:</span>
          <span className={`status-value ${databaseStatus}`}>
            {databaseStatus === 'checking' ? 'Checking...' : 
             databaseStatus === 'connected' ? 'Connected' : 'Error'}
          </span>
        </div>
        
        <div className="status-item">
          <span className="status-label">Authentication:</span>
          <span className={`status-value ${authStatus}`}>
            {authStatus === 'checking' ? 'Checking...' : 
             authStatus === 'authenticated' ? 'Authenticated' : 
             authStatus === 'unauthenticated' ? 'Not Authenticated' : 'Error'}
          </span>
        </div>
      </div>
      
      {errorMessage && (
        <div className="error-box">
          <h3>Error</h3>
          <p>{errorMessage}</p>
        </div>
      )}
      
      <div className="actions">
        <button onClick={testWrite}>Test Write</button>
      </div>
      
      <div className="logs">
        <h3>Logs</h3>
        <div className="log-container">
          {logs.map((log, index) => (
            <div key={index} className="log-entry">{log}</div>
          ))}
        </div>
      </div>
      
      <style>{`
        .firebase-debug {
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          max-width: 600px;
          margin: 20px auto;
          background-color: #f8f9fa;
          font-family: monospace;
        }
        
        h2 {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .status-container {
          display: flex;
          justify-content: space-around;
          margin-bottom: 20px;
        }
        
        .status-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .status-label {
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .status-value {
          padding: 5px 10px;
          border-radius: 4px;
          font-weight: bold;
        }
        
        .status-value.checking {
          background-color: #ffeeba;
          color: #856404;
        }
        
        .status-value.connected, .status-value.authenticated {
          background-color: #d4edda;
          color: #155724;
        }
        
        .status-value.error {
          background-color: #f8d7da;
          color: #721c24;
        }
        
        .status-value.unauthenticated {
          background-color: #d6d8d9;
          color: #383d41;
        }
        
        .error-box {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        
        .error-box h3 {
          margin-top: 0;
          margin-bottom: 5px;
        }
        
        .actions {
          margin-bottom: 20px;
          text-align: center;
        }
        
        button {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-family: monospace;
        }
        
        button:hover {
          background-color: #0069d9;
        }
        
        .logs {
          margin-top: 20px;
        }
        
        .log-container {
          height: 200px;
          overflow-y: auto;
          border: 1px solid #ddd;
          padding: 10px;
          border-radius: 4px;
          background-color: #f1f1f1;
        }
        
        .log-entry {
          margin-bottom: 5px;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default FirebaseDebug;