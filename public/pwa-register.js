// PWA Service Worker Registration Script

// Check if service workers are supported
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    // Register the main service worker
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('PWA Service Worker registered with scope:', registration.scope);
      })
      .catch(function(error) {
        console.error('PWA Service Worker registration failed:', error);
      });
      
    // Check for Firebase messaging service worker
    navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
      .then(function(registration) {
        if (!registration) {
          console.log('Firebase Messaging Service Worker not found, registering...');
          navigator.serviceWorker.register('/firebase-messaging-sw.js')
            .then(function(registration) {
              console.log('Firebase Messaging Service Worker registered with scope:', registration.scope);
            })
            .catch(function(error) {
              console.error('Firebase Messaging Service Worker registration failed:', error);
            });
        } else {
          console.log('Firebase Messaging Service Worker already registered');
        }
      });
  });
}

// Add to home screen functionality
let deferredPrompt;
const addToHomeBtn = document.getElementById('add-to-home');
const pwaInstallBanner = document.getElementById('pwa-install-banner');

// Hide the install button initially
if (addToHomeBtn) {
  addToHomeBtn.style.display = 'none';
}

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show the install button or banner
  if (addToHomeBtn) {
    addToHomeBtn.style.display = 'block';
    
    addToHomeBtn.addEventListener('click', () => {
      // Hide the button
      addToHomeBtn.style.display = 'none';
      
      // Show the prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        
        // Clear the saved prompt
        deferredPrompt = null;
      });
    });
  }
  
  // Show the install banner if it exists
  if (pwaInstallBanner) {
    pwaInstallBanner.style.display = 'flex';
    
    // Add event listener to the close button
    const closeBtn = pwaInstallBanner.querySelector('.close-banner');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        pwaInstallBanner.style.display = 'none';
        
        // Save to localStorage that the user closed the banner
        localStorage.setItem('pwa-banner-closed', 'true');
      });
    }
    
    // Add event listener to the install button in the banner
    const installBtn = pwaInstallBanner.querySelector('.install-pwa');
    if (installBtn) {
      installBtn.addEventListener('click', () => {
        // Hide the banner
        pwaInstallBanner.style.display = 'none';
        
        // Show the prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
          } else {
            console.log('User dismissed the install prompt');
          }
          
          // Clear the saved prompt
          deferredPrompt = null;
        });
      });
    }
  }
});

// Listen for the appinstalled event
window.addEventListener('appinstalled', (evt) => {
  console.log('App was installed');
  
  // Hide the install button and banner
  if (addToHomeBtn) {
    addToHomeBtn.style.display = 'none';
  }
  
  if (pwaInstallBanner) {
    pwaInstallBanner.style.display = 'none';
  }
});
