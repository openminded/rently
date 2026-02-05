import appRoot from 'app-root-path';
import path from 'path';
import fs from 'fs';

console.log('App Root Path:', appRoot.path);
const configPath = path.resolve(appRoot.path, 'config/duitku-configuration.js');
console.log('Target Config Path:', configPath);
console.log('File Exists:', fs.existsSync(configPath));

try {
    const config = await import(configPath);
    console.log('Config Loaded Successfully');
    console.log('Merchant Code from Config:', config.default.merchantCode);
} catch (err) {
    console.error('Failed to load config:', err);
}
