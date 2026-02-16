#!/usr/bin/env node

/**
 * enhance-component.js
 *
 * A utility script to transform plain React components into futuristic cyber-minimalist designs
 * Usage: node enhance-component.js <input-file> <output-file>
 */

const fs = require('fs');
const path = require('path');

const cyberMinimalistTransformations = {
  // Convert plain backgrounds to glassmorphism
  plainBgToGlass: (content) => {
    return content
      .replace(/className="([^"]*)bg-white([^"]*)"/g, 'className="$1bg-gradient-to-br from-gray-900 to-gray-800/50 backdrop-blur-sm border border-white/10$2"')
      .replace(/className="([^"]*)bg-gray-100([^"]*)"/g, 'className="$1bg-gradient-to-br from-gray-800/30 to-gray-900/20 backdrop-blur-sm border border-white/10$2"')
      .replace(/className="([^"]*)bg-gray-200([^"]*)"/g, 'className="$1bg-white/5 backdrop-blur-sm border border-white/10$2"');
  },

  // Add neon accents to text and elements
  addNeonAccents: (content) => {
    return content
      .replace(/className="([^"]*)text-black([^"]*)"/g, 'className="$1text-white$2"')
      .replace(/className="([^"]*)text-gray-700([^"]*)"/g, 'className="$1text-gray-300$2"')
      .replace(/className="([^"]*)text-gray-800([^"]*)"/g, 'className="$1text-gray-200$2"')
      .replace(/className="([^"]*)text-gray-900([^"]*)"/g, 'className="$1text-gray-100$2"');
  },

  // Enhance borders to translucent glass borders
  enhanceBorders: (content) => {
    return content
      .replace(/className="([^"]*)border-gray-200([^"]*)"/g, 'className="$1border-white/10$2"')
      .replace(/className="([^"]*)border-gray-300([^"]*)"/g, 'className="$1border-white/10$2"')
      .replace(/className="([^"]*)rounded([^"]*)"/g, 'className="$1rounded-xl$2"');
  },

  // Add subtle shadows for depth
  addDepthShadows: (content) => {
    return content
      .replace(/className="([^"]*)"/g, (match, className) => {
        if (!className.includes('shadow') && !className.includes('bg-gradient')) {
          return `className="${className} shadow-lg shadow-black/20"`;
        }
        return match;
      });
  }
};

function enhanceComponent(content) {
  let enhanced = content;

  // Apply transformations in sequence
  enhanced = cyberMinimalistTransformations.plainBgToGlass(enhanced);
  enhanced = cyberMinimalistTransformations.addNeonAccents(enhanced);
  enhanced = cyberMinimalistTransformations.enhanceBorders(enhanced);
  enhanced = cyberMinimalistTransformations.addDepthShadows(enhanced);

  return enhanced;
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node enhance-component.js <input-file> <output-file>');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1];

  if (!fs.existsSync(inputFile)) {
    console.error(`Input file does not exist: ${inputFile}`);
    process.exit(1);
  }

  const content = fs.readFileSync(inputFile, 'utf8');
  const enhancedContent = enhanceComponent(content);

  fs.writeFileSync(outputFile, enhancedContent);
  console.log(`Enhanced component saved to: ${outputFile}`);
  console.log('Applied Cyber-Minimalist transformations:');
  console.log('- Converted plain backgrounds to glassmorphism');
  console.log('- Added neon accents to text elements');
  console.log('- Enhanced borders to translucent glass borders');
  console.log('- Added depth shadows for 3D effect');
}

if (require.main === module) {
  main();
}

module.exports = { enhanceComponent, cyberMinimalistTransformations };