const { execSync } = require('child_process');
const path = require('path');

const services = ['db', 'rules-service', 'redirect-service'];

console.log('Running tests with coverage for all services...\n');

let allPassed = true;

services.forEach(service => {
  const servicePath = path.join(__dirname, '..', 'services', service);
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Testing ${service} with coverage...`);
  console.log('='.repeat(50));
  
  try {
    execSync('npm run test:coverage', { 
      cwd: servicePath, 
      stdio: 'inherit' 
    });
    console.log(`${service} coverage check passed\n`);
  } catch (error) {
    console.error(`${service} coverage check failed\n`);
    allPassed = false;
  }
});

if (!allPassed) {
  process.exit(1);
}

console.log('\n' + '='.repeat(50));
console.log('All coverage checks passed!');
console.log('='.repeat(50));

