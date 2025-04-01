const { spawn } = require('child_process');
const path = require('path');

// Function to start a process
function startProcess(command, args, cwd, name) {
  console.log(`Starting ${name}...`);
  
  const proc = spawn(command, args, {
    cwd,
    shell: true,
    stdio: 'pipe'
  });

  proc.stdout.on('data', (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });

  proc.stderr.on('data', (data) => {
    console.error(`[${name}] ${data.toString().trim()}`);
  });

  proc.on('close', (code) => {
    console.log(`${name} process exited with code ${code}`);
  });

  return proc;
}

// Main directory (where this script is located)
const mainDir = __dirname;
const backendDir = path.join(mainDir, 'backend');

// Start backend
const backend = startProcess('npm', ['run', 'dev'], backendDir, 'BACKEND');

// Start frontend
const frontend = startProcess('npm', ['start'], mainDir, 'FRONTEND');

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down all processes...');
  backend.kill();
  frontend.kill();
  process.exit(0);
}); 