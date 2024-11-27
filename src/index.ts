import { install } from './install';
import { list } from './list';

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'install':
    const packageName = args[1];
    if (!packageName) {
      console.error('Please provide a package name.');
      process.exit(1);
    }
    install(packageName);
    break;
  case 'ls':
  case 'list':
    list();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}
