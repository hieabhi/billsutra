import React, { useState } from 'react';

const AuthTest = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setResult({ error: 'No token found. Please login first.' });
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5051/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setResult({ success: response.ok, data });
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f5f5f5', 
      borderRadius: '10px',
      margin: '20px 0'
    }}>
      <h3>🔐 Authentication Test</h3>
      <button 
        onClick={testAuth}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {loading ? 'Testing...' : 'Test Backend Auth'}
      </button>

      {result && (
        <div style={{ 
          marginTop: '15px', 
          padding: '15px', 
          backgroundColor: 'white',
          borderRadius: '5px',
          border: result.success ? '2px solid green' : '2px solid red'
        }}>
          {result.error ? (
            <div style={{ color: 'red' }}>
              <strong>❌ Error:</strong> {result.error}
            </div>
          ) : (
            <div style={{ color: result.success ? 'green' : 'red' }}>
              <strong>{result.success ? '✅ Success!' : '❌ Failed'}</strong>
              <pre style={{ 
                marginTop: '10px', 
                padding: '10px', 
                backgroundColor: '#f9f9f9',
                borderRadius: '5px',
                overflow: 'auto',
                maxHeight: '300px'
              }}>
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
        <strong>Token Info:</strong>
        <div style={{ marginTop: '5px' }}>
          {localStorage.getItem('authToken') 
            ? `✅ Token exists (${localStorage.getItem('authToken').substring(0, 30)}...)`
            : '❌ No token found'
          }
        </div>
      </div>
    </div>
  );
};

export default AuthTest;
