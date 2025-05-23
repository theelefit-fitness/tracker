/**
 * Custom build script for Shopify integration (CommonJS version)
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
  targetDir: path.resolve(__dirname, '../shopify-testing'),
  // AdBlocker-triggered terms to rename
  adBlockerTerms: {
    'analytics': 'e-stats',
    'tracking': 'e-data',
    'ga': 'ef',
    'gtag': 'ef-tag',
    'pixel': 'e-render',
    'tracker': 'e-monitor',
    'ad_': 'e_',
    'ads_': 'e_',
    'adsense': 'efsense',
    'adwords': 'efwords'
  }
};

console.log('🚀 Starting Shopify build process...');

try {
  // Step 1: Build the app for Shopify
  console.log('Building React app for Shopify...');
  execSync('cross-env BUILD_TARGET=shopify npx vite build', { stdio: 'inherit' });
  
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
  
  // Function to check if a file contains ad blocker trigger terms
  function containsAdBlockerTerms(fileName) {
    const lowerName = fileName.toLowerCase();
    return Object.keys(config.adBlockerTerms).some(term => lowerName.includes(term));
  }
  
  // Function to rename files to avoid ad blockers
  function getAdBlockerFriendlyName(fileName) {
    let newName = fileName;
    Object.keys(config.adBlockerTerms).forEach(term => {
      const regex = new RegExp(term, 'gi');
      newName = newName.replace(regex, config.adBlockerTerms[term]);
    });
    return newName;
  }
  
  // Copy all assets with renamed files if needed
  const assetsDir = path.join(config.sourceDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    const assetFiles = fs.readdirSync(assetsDir);
    for (const file of assetFiles) {
      const sourceFile = path.join(assetsDir, file);
      
      // Determine if file needs renaming
      const needsRenaming = containsAdBlockerTerms(file);
      const targetFileName = needsRenaming ? getAdBlockerFriendlyName(file) : file;
      const targetFile = path.join(targetAssetsDir, targetFileName);
      
      // Copy with potential rename
      fs.copyFileSync(sourceFile, targetFile);
      console.log(`✅ Copied${needsRenaming ? ' & renamed' : ''}: ${file}${needsRenaming ? ' -> ' + targetFileName : ''}`);
      
      // If this is a JS file that might contain ad blocker triggers, also process content
      if (file.endsWith('.js') && (file.includes('index-') || file.includes('chunk-'))) {
        console.log(`  Checking ${file} content for ad blocker triggers...`);
        let content = fs.readFileSync(sourceFile, 'utf8');
        let contentModified = false;
        
        // Replace common ad blocker trigger patterns in content
        Object.keys(config.adBlockerTerms).forEach(term => {
          // Only replace standalone terms or terms in specific contexts
          const safePattern = new RegExp(`(?<=["'\\\\./])${term}(?=["'\\\\./])`, 'gi');
          if (safePattern.test(content)) {
            content = content.replace(safePattern, config.adBlockerTerms[term]);
            contentModified = true;
          }
        });
        
        // Write modified content if needed
        if (contentModified) {
          fs.writeFileSync(targetFile, content);
          console.log(`  ✅ Modified content to bypass ad blockers in: ${targetFileName}`);
        }
      }
    }
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
  
  // Create or update adblock-bypass.js helper file
  const bypassJsPath = path.join(targetAssetsDir, 'adblock-bypass.js');
  fs.writeFileSync(bypassJsPath, `
/**
 * AdBlock compatibility script for EleFit app
 */
(function() {
  // Check for ad blocker
  function checkAdBlocker() {
    try {
      const test = document.createElement('div');
      test.className = 'ad-unit adsbox ad-space pub_300x250'; 
      test.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;top:-9999px';
      document.body.appendChild(test);
      
      // Check if ad blocker is active by seeing if element is hidden
      const isBlocked = test.offsetHeight === 0 || 
                        test.offsetWidth === 0 || 
                        test.clientHeight === 0 || 
                        test.clientWidth === 0;
                        
      document.body.removeChild(test);
      return isBlocked;
    } catch (e) {
      return false;
    }
  }
  
  // Add compatibility mode if ad blocker is detected
  window.addEventListener('DOMContentLoaded', function() {
    if (checkAdBlocker()) {
      console.log('Ad blocker detected, enabling compatibility mode');
      document.documentElement.classList.add('adblock-mode');
      
      // Fix script loading
      document.querySelectorAll('script[src*="analytics"],script[src*="tracking"],script[src*="ga"]').forEach(function(script) {
        const newScript = document.createElement('script');
        newScript.src = script.src.replace(/analytics|tracking|ga/gi, 'elefit-data');
        script.parentNode.replaceChild(newScript, script);
      });
    }
  });
})();
`);
  console.log('✅ Created adblock-bypass.js');

  // Create additional helper file specifically for Firebase issues with ad blockers
  const firebaseBypassJsPath = path.join(targetAssetsDir, 'elefit-firebase-helper.js');
  fs.writeFileSync(firebaseBypassJsPath, `
/**
 * Firebase compatibility helper for EleFit app with ad blockers
 */
(function() {
  // Create shims for Firebase in case it gets blocked
  window.elefitFirebaseShim = {
    initialized: false,
    
    init: function() {
      // Only initialize once
      if (this.initialized) return;
      this.initialized = true;
      
      // Check if Firebase is blocked
      const isFirebaseBlocked = !window.firebase;
      
      if (isFirebaseBlocked) {
        console.log('Firebase appears to be blocked, creating shim');
        
        // Create minimal Firebase shim
        window.firebase = {
          // Minimal implementations
          initializeApp: function() { 
            return { 
              auth: function() { return window.firebase.auth(); }
            }; 
          },
          auth: function() { 
            return {
              onAuthStateChanged: function(callback) { 
                // Call with null user
                setTimeout(() => callback(null), 100);
                return function() {}; // unsubscribe function
              },
              signInWithEmailAndPassword: function() {
                return Promise.reject(new Error('Firebase is blocked by an ad blocker'));
              },
              signOut: function() {
                return Promise.resolve();
              },
              createUserWithEmailAndPassword: function() {
                return Promise.reject(new Error('Firebase is blocked by an ad blocker'));
              }
            }; 
          }
        };
      }
    }
  };
  
  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    window.elefitFirebaseShim.init();
  });
})();
`);
  console.log('✅ Created elefit-firebase-helper.js');

  console.log('✨ Build and copy complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Make sure your elefit-tracker.liquid section includes adblock-bypass.js');
  console.log('2. Test your app with ad blockers enabled and disabled');
  
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
} 