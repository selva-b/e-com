// PWA Service Worker Registration Script

// Check if service workers are supported
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    // Register the main service worker
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('PWA Service Worker registered with scope:', registration.scope);

        // Set up message handling for the service worker
        navigator.serviceWorker.addEventListener('message', function(event) {
          if (event.data && event.data.type === 'API_ERROR') {
            console.error('Service worker reported API error:', event.data.error);
            // You could show a notification or update UI here
          }
        });

        // Check if we need to update the service worker
        registration.update();
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

    // Periodically update the service worker to ensure fresh content
    setInterval(function() {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'PERIODIC_UPDATE'
        });
      }

      navigator.serviceWorker.getRegistration().then(function(registration) {
        if (registration) {
          registration.update();
        }
      });
    }, 60 * 60 * 1000); // Check for updates every hour
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
