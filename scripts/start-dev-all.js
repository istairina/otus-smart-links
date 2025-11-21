const { spawn } = require('child_process');
const path = require('path');

const services = ['db', 'rules-service', 'redirect-service'];

console.log('Starting all services in development mode...\n');

const processes = [];

services.forEach(service => {
  const servicePath = path.join(__dirname, '..', 'services', service);
  
  console.log(`Starting ${service}...`);
  
  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  
  const proc = spawn(npmCmd, ['run', 'dev'], {
    cwd: servicePath,
    stdio: 'inherit',
    shell: isWindows
  });
  
  proc.on('error', (error) => {
    console.error(`Failed to start ${service}:`, error);
  });
  
  proc.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`${service} exited with code ${code}`);
    }
  });
  
  processes.push({ service, process: proc });
});

process.on('SIGINT', () => {
  console.log('\n\nShutting down all services...');
  processes.forEach(({ service, process: proc }) => {
    console.log(`Stopping ${service}...`);
    proc.kill('SIGINT');
  });
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\nShutting down all services...');
  processes.forEach(({ service, process: proc }) => {
    console.log(`Stopping ${service}...`);
    proc.kill('SIGTERM');
  });
  process.exit(0);
});

console.log('\nAll services are starting. Press Ctrl+C to stop all services.\n');

