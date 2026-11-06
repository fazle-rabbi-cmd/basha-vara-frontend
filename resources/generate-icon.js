const sharp = require('sharp');

// Generate icon.png (1024x1024)
sharp('basha-vara-icon.svg')
  .resize(1024, 1024)
  .png()
  .toFile('icon.png')
  .then(() => console.log('✓ icon.png generated (1024x1024)'))
  .catch(err => console.error('Error generating icon:', err));
