const sharp = require('sharp');

// Generate splash.png (2732x2732)
sharp('basha-vara-splash.svg')
  .resize(2732, 2732)
  .png()
  .toFile('splash.png')
  .then(() => console.log('✓ splash.png generated (2732x2732)'))
  .catch(err => console.error('Error generating splash:', err));
