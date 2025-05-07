import React, { useState } from 'react';
import testFirebaseConnection from '../utils/firebaseTest';

const FirebaseTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    database?: { success: boolean; message: string };
    auth?: { success: boolean; message: string };
  }>({});
  const [error, setError] = useState<string | null>(null);

  const runTests = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const testResults = await testFirebaseConnection();
      setResults(testResults);
    } catch (err: any) {
      setError(`Test failed with error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="firebase-test-container">
      <h2>Firebase Connection Test</h2>
      <p>Use this tool to test your Firebase configuration</p>
      
      <button 
        onClick={runTests} 
        disabled={isLoading}
        className="test-button"
      >
        {isLoading ? 'Running Tests...' : 'Run Firebase Tests'}
      </button>
      
      {error && (
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}
      
      {results.database && (
        <div className={`test-result ${results.database.success ? 'success' : 'failure'}`}>
          <h3>Database Test</h3>
          <p>{results.database.message}</p>
        </div>
      )}
      
      {results.auth && (
        <div className={`test-result ${results.auth.success ? 'success' : 'failure'}`}>
          <h3>Authentication Test</h3>
          <p>{results.auth.message}</p>
        </div>
      )}
      
      <style>{`
        .firebase-test-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .test-button {
          background-color: #007bff;
          color: white;
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-bottom: 20px;
        }
        
        .test-button:hover {
          background-color: #0056b3;
        }
        
        .test-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .test-result {
          margin-top: 15px;
          padding: 15px;
          border-radius: 4px;
        }
        
        .success {
          background-color: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
        }
        
        .failure {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }
        
        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 15px;
        }
      `}</style>
    </div>
  );
};

export default FirebaseTest;