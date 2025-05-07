import React, { useState } from 'react';
import { ref, set, get } from 'firebase/database';
import { database } from '../firebase/config';

const FirebaseRulesTest: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().substring(11, 19)} - ${message}`]);
  };
  
  const runRootWriteTest = async () => {
    setIsLoading(true);
    addLog("Attempting to write directly to root...");
    
    try {
      const testRef = ref(database, `root_test_${Date.now()}`);
      await set(testRef, {
        timestamp: Date.now(),
        message: "Testing root write access"
      });
      addLog("✅ Root write successful!");
    } catch (error: any) {
      addLog(`❌ Root write failed: ${error.message}`);
    }
    
    setIsLoading(false);
  };
  
  const runGamesPathTest = async () => {
    setIsLoading(true);
    addLog("Attempting to write to /games path...");
    
    try {
      const testRef = ref(database, `games/test_${Date.now()}`);
      await set(testRef, {
        timestamp: Date.now(),
        message: "Testing games path write access"
      });
      addLog("✅ Games path write successful!");
    } catch (error: any) {
      addLog(`❌ Games path write failed: ${error.message}`);
    }
    
    setIsLoading(false);
  };
  
  const runDebugPathTest = async () => {
    setIsLoading(true);
    addLog("Attempting to write to /debug path...");
    
    try {
      const testRef = ref(database, `debug/test_${Date.now()}`);
      await set(testRef, {
        timestamp: Date.now(),
        message: "Testing debug path write access"
      });
      addLog("✅ Debug path write successful!");
    } catch (error: any) {
      addLog(`❌ Debug path write failed: ${error.message}`);
    }
    
    setIsLoading(false);
  };
  
  const verifyRules = async () => {
    setIsLoading(true);
    addLog("Checking current database rules...");
    
    try {
      addLog("Note: We cannot directly read rules from client side.");
      addLog("Checking if we can write and then read to verify access...");
      
      const testId = `verify_${Date.now()}`;
      const testRef = ref(database, testId);
      const testValue = { test: "value", time: Date.now() };
      
      // Try to write
      await set(testRef, testValue);
      addLog("✅ Write successful");
      
      // Try to read back
      const snapshot = await get(testRef);
      if (snapshot.exists()) {
        addLog("✅ Read successful");
        addLog("🔍 Read/write permissions appear to be working correctly");
      } else {
        addLog("❌ Read failed - data was written but cannot be read back");
      }
    } catch (error: any) {
      addLog(`❌ Verification failed: ${error.message}`);
    }
    
    setIsLoading(false);
  };
  
  return (
    <div className="firebase-rules-test">
      <h2>Firebase Rules Diagnostics</h2>
      
      <div className="test-actions">
        <button onClick={verifyRules} disabled={isLoading}>
          Verify Rules Access
        </button>
        <button onClick={runRootWriteTest} disabled={isLoading}>
          Test Root Write
        </button>
        <button onClick={runGamesPathTest} disabled={isLoading}>
          Test Games Path
        </button>
        <button onClick={runDebugPathTest} disabled={isLoading}>
          Test Debug Path
        </button>
      </div>
      
      <div className="logs">
        <h3>Test Logs</h3>
        <div className="log-container">
          {logs.map((log, index) => (
            <div key={index} className="log-entry">{log}</div>
          ))}
          {logs.length === 0 && <div className="log-entry">No logs yet. Run a test to see results.</div>}
        </div>
      </div>
      
      <div className="rules-help">
        <h3>Troubleshooting Help</h3>
        <p>If all tests fail, your Firebase project might have <strong>Security Rules</strong> that are too restrictive or the database URL might be incorrect.</p>
        <p>To fix this issue:</p>
        <ol>
          <li>Go to Firebase Console → Realtime Database → Rules</li>
          <li>Update the rules to be completely open for testing:</li>
          <pre>{`{
  "rules": {
    ".read": true,
    ".write": true
  }
}`}</pre>
          <li>Publish the rules and try again</li>
        </ol>
      </div>
      
      <style>{`
        .firebase-rules-test {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        h2 {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .test-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 20px;
          justify-content: center;
        }
        
        button {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        button:hover {
          background-color: #0069d9;
        }
        
        button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .log-container {
          height: 200px;
          overflow-y: auto;
          border: 1px solid #ddd;
          padding: 10px;
          border-radius: 4px;
          background-color: #f1f1f1;
          margin-bottom: 20px;
        }
        
        .log-entry {
          margin-bottom: 5px;
          font-size: 14px;
          font-family: monospace;
        }
        
        .rules-help {
          background-color: #e9ecef;
          padding: 15px;
          border-radius: 4px;
        }
        
        pre {
          background-color: #212529;
          color: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
        }
        
        @media (max-width: 768px) {
          .test-actions {
            flex-direction: column;
          }
          
          button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default FirebaseRulesTest;