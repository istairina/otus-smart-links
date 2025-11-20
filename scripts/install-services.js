const { execSync } = require('child_process');
const path = require('path');

const services = ['db', 'rules-service', 'redirect-service'];

console.log('Installing dependencies for all services...\n');

services.forEach(service => {
  const servicePath = path.join(__dirname, '..', 'services', service);
  console.log(`Installing dependencies for ${service}...`);
  try {
    execSync('npm install', { cwd: servicePath, stdio: 'inherit' });
    console.log(`${service} installed successfully\n`);
  } catch (error) {
    console.error(`Failed to install ${service}`);
    process.exit(1);
  }
});

console.log('All services installed successfully!');

