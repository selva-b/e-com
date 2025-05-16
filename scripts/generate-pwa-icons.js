// Script to generate placeholder PWA icons
const fs = require('fs');
const path = require('path');

// Define icon sizes
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Function to generate a simple SVG icon with text
function generateSVGIcon(size, text) {
  const fontSize = Math.floor(size / 4);
  
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#000000"/>
  <text x="50%" y="50%" font-family="Arial" font-size="${fontSize}" fill="white" text-anchor="middle" dominant-baseline="middle">E-com</text>
</svg>`;
}

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons for each size
iconSizes.forEach(size => {
  const iconPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  const svgContent = generateSVGIcon(size, 'E-com');
  
  // Write SVG file (as a placeholder - in a real app, you'd convert to PNG)
  fs.writeFileSync(iconPath.replace('.png', '.svg'), svgContent);
  
  console.log(`Generated icon: ${iconPath.replace('.png', '.svg')}`);
});

console.log('PWA icons generated successfully!');
console.log('Note: In a production app, you should replace these with real PNG icons.');
