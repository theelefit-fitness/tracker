/**
 * Custom build script for Shopify integration
 * This script builds the React app and copies the assets to the Shopify theme folder
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  // Source paths
  sourceDir: path.resolve(__dirname, 'dist-shopify'),
  // Target paths - adjust these based on your Shopify theme location
  targetDir: path.resolve(__dirname, '../ALEXA_SKILL/shopify-testing')
};

console.log('🚀 Starting Shopify build process...');

try {
  // Step 1: Build the app for Shopify
  console.log('Building React app for Shopify...');
  execSync('cross-env BUILD_TARGET=shopify npm run build', { stdio: 'inherit' });
  
  // Step 2: Check if build succeeded
  if (!fs.existsSync(config.sourceDir)) {
    throw new Error('Build failed - dist-shopify directory not found');
  }
  
  // Step 3: Copy assets to Shopify theme
  console.log('Copying assets to Shopify theme...');
  
  // Create assets directory if it doesn't exist
  const targetAssetsDir = path.join(config.targetDir, 'assets');
  if (!fs.existsSync(targetAssetsDir)) {
    fs.mkdirSync(targetAssetsDir, { recursive: true });
  }
  
  // Copy all assets
  const assetFiles = fs.readdirSync(path.join(config.sourceDir, 'assets'));
  for (const file of assetFiles) {
    const sourceFile = path.join(config.sourceDir, 'assets', file);
    const targetFile = path.join(targetAssetsDir, file);
    
    fs.copyFileSync(sourceFile, targetFile);
    console.log(`✅ Copied: ${file}`);
  }

  // Copy any other important files at the root level
  const rootFiles = ['elefit_logo.jpg', 'vite.svg'];
  for (const file of rootFiles) {
    const sourceFile = path.join(config.sourceDir, file);
    if (fs.existsSync(sourceFile)) {
      const targetFile = path.join(targetAssetsDir, file);
      fs.copyFileSync(sourceFile, targetFile);
      console.log(`✅ Copied: ${file}`);
    }
  }
  
  console.log('✨ Build and copy complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Upload the files to your Shopify theme');
  console.log('2. Make sure your elefit-tracker.liquid section is properly configured');
  
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
} 