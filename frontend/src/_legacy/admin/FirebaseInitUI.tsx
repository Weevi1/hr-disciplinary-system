// frontend/src/components/FirebaseInitUI.tsx
import React, { useState } from 'react';
import { FirebaseInitializer } from '../scripts/initializeFirebase';

interface InitStatus {
  isInitializing: boolean;
  isComplete: boolean;
  message: string;
  error?: string;
  logs: string[];
}

export const FirebaseInitUI: React.FC = () => {
  const [status, setStatus] = useState<InitStatus>({
    isInitializing: false,
    isComplete: false,
    message: '',
    error: undefined,
    logs: []
  });

  const addLog = (message: string) => {
    setStatus(prev => ({
      ...prev,
      logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${message}`]
    }));
  };

  const handleInitialize = async () => {
    setStatus({
      isInitializing: true,
      isComplete: false,
      message: 'Starting initialization...',
      error: undefined,
      logs: []
    });

    // Override console.log to capture logs
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);
      addLog(args.join(' '));
    };

    try {
      const result = await FirebaseInitializer.initializeAll();
      
      setStatus(prev => ({
        ...prev,
        isInitializing: false,
        isComplete: true,
        message: result.message,
        error: result.success ? undefined : result.message
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setStatus(prev => ({
        ...prev,
        isInitializing: false,
        isComplete: true,
        message: 'Initialization failed',
        error: errorMessage
      }));
    } finally {
      // Restore original console.log
      console.log = originalLog;
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('⚠️ This will delete ALL data from Firebase. Are you sure?')) {
      return;
    }

    setStatus({
      isInitializing: true,
      isComplete: false,
      message: 'Clearing all data...',
      error: undefined,
      logs: []
    });

    try {
      await FirebaseInitializer.clearAllData();
      
      setStatus(prev => ({
        ...prev,
        isInitializing: false,
        isComplete: true,
        message: 'All data cleared successfully',
        logs: [...prev.logs, 'All Firebase collections cleared']
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setStatus(prev => ({
        ...prev,
        isInitializing: false,
        isComplete: true,
        message: 'Failed to clear data',
        error: errorMessage
      }));
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '2rem auto',
      padding: '2rem',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
        color: '#1e293b'
      }}>
        🔥 Firebase Initialization Tool
      </h1>

      <div style={{
        backgroundColor: '#fef3c7',
        border: '1px solid #fbbf24',
        borderRadius: '6px',
        padding: '1rem',
        marginBottom: '2rem'
      }}>
        <p style={{ margin: 0, color: '#92400e' }}>
          <strong>⚠️ Warning:</strong> This tool will create demo data in your Firebase database. 
          Make sure you're connected to the correct Firebase project!
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <button
          onClick={handleInitialize}
          disabled={status.isInitializing}
          style={{
            padding: '0.75rem 2rem',
            backgroundColor: status.isInitializing ? '#94a3b8' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: status.isInitializing ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {status.isInitializing ? '🔄 Initializing...' : '🚀 Initialize Demo Data'}
        </button>

        <button
          onClick={handleClearData}
          disabled={status.isInitializing}
          style={{
            padding: '0.75rem 2rem',
            backgroundColor: status.isInitializing ? '#94a3b8' : '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: status.isInitializing ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          🗑️ Clear All Data
        </button>
      </div>

      {status.message && (
        <div style={{
          padding: '1rem',
          backgroundColor: status.error ? '#fee2e2' : status.isComplete ? '#d1fae5' : '#dbeafe',
          border: `1px solid ${status.error ? '#fca5a5' : status.isComplete ? '#6ee7b7' : '#60a5fa'}`,
          borderRadius: '6px',
          marginBottom: '1rem'
        }}>
          <p style={{
            margin: 0,
            color: status.error ? '#991b1b' : status.isComplete ? '#065f46' : '#1e40af',
            fontWeight: '500'
          }}>
            {status.error ? '❌' : status.isComplete ? '✅' : '🔄'} {status.message}
          </p>
        </div>
      )}

      {status.logs.length > 0 && (
        <div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '0.5rem',
            color: '#475569'
          }}>
            📋 Initialization Log
          </h3>
          <div style={{
            backgroundColor: '#1e293b',
            color: '#10b981',
            padding: '1rem',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {status.logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '0.25rem' }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#e0e7ff',
        borderRadius: '6px',
        fontSize: '0.875rem',
        color: '#4c1d95'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>📌 What this will create:</h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li>1 Demo Organization (Demo Corporation Ltd)</li>
          <li>4 Users (Super Admin, CEO, HR Manager, HOD)</li>
          <li>5 Warning Categories</li>
          <li>3 Demo Employees</li>
          <li>1 Sample Warning</li>
          <li>3 Document Templates</li>
        </ul>
      </div>
    </div>
  );
};
