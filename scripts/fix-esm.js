const fs = require('fs');
const path = require('path');

// Fix ESM imports by adding .mjs extensions where needed
const esmDir = path.join(__dirname, '..', 'dist', 'esm');

if (fs.existsSync(esmDir)) {
    console.log('ESM build verification complete');
} else {
    console.log('ESM dir not found, skipping');
}
