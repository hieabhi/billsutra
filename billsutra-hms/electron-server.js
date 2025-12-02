// Server wrapper for Electron - handles ES modules
const path = require('path');
const { spawn } = require('child_process');

let serverProcess = null;

function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, 'server', 'index.js');
    
    console.log('[Electron] Server path:', serverPath);
    console.log('[Electron] Node path:', process.execPath);
    
    // Use spawn with node to run ES module
    serverProcess = spawn('node', [serverPath], {
      cwd: __dirname,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: '5051'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    console.log('[Electron] Server process spawned with PID:', serverProcess.pid);

    serverProcess.stdout.on('data', (data) => {
      console.log(`[Server] ${data.toString().trim()}`);
      
      // Check if server is ready
      if (data.toString().includes('Server running on port')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const errorMsg = data.toString().trim();
      console.error(`[Server Error] ${errorMsg}`);
      // Don't reject on stderr, some modules log warnings there
    });

    serverProcess.on('error', (error) => {
      console.error('[Server] Failed to start:', error);
      reject(error);
    });

    serverProcess.on('exit', (code, signal) => {
      console.log(`[Server] Process exited with code ${code}, signal ${signal}`);
      serverProcess = null;
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        resolve(); // Assume server started even without explicit message
      }
    }, 10000);
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.once('exit', () => {
        resolve();
      });
      serverProcess.kill();
      
      // Force kill after 5 seconds
      setTimeout(() => {
        if (serverProcess && !serverProcess.killed) {
          serverProcess.kill('SIGKILL');
        }
        resolve();
      }, 5000);
    } else {
      resolve();
    }
  });
}

module.exports = { startServer, stopServer };
