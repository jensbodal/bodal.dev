// PWA Manifest is now served as static file from /public/manifest.json
// No dynamic generation needed

let deferredPrompt: any = null;

// Service Worker Registration
export function registerServiceWorker() {
    // Skip service worker in Capacitor (native app doesn't need it)
    if ((window as any).Capacitor) {
        console.log('Running in Capacitor, skipping service worker registration');
        return;
    }

    if ('serviceWorker' in navigator) {
        // Register in both dev (localhost) and production (HTTPS)
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const isHttps = window.location.protocol === 'https:';

        if (isLocalhost || isHttps) {
            // Use relative path for service worker to work with base: './' configuration
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('Service Worker registered:', reg.scope))
                .catch(err => console.log('Service Worker registration failed:', err));
        }
    }
}

// Detect iOS
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

// Check if already installed
function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (navigator as any).standalone === true;
}

// Install prompt handler
export function setupInstallPrompt() {
    // Don't show if already installed
    if (isStandalone()) return;

    // Handle iOS separately (no beforeinstallprompt support)
    if (isIOS()) {
        showIOSInstallPrompt();
        return;
    }

    // Handle Chrome/Edge (Android, Desktop)
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the default mini-infobar
        e.preventDefault();
        // Save the event for later
        deferredPrompt = e;

        // Show custom install button/banner
        showInstallPrompt();
    });

    // Track successful installation
    window.addEventListener('appinstalled', () => {
        console.log('PWA installed successfully');
        deferredPrompt = null;
    });
}

function showInstallPrompt() {
    // Create install banner
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-3 flex items-center gap-3 shadow-lg';
    banner.innerHTML = `
        <span class="text-sm font-medium">Install Digital Bloom</span>
        <button id="pwa-install-btn" class="bg-white text-black px-4 py-1 rounded-full text-sm font-bold hover:bg-gray-200 transition">
            Install
        </button>
        <button id="pwa-dismiss-btn" class="text-white/60 hover:text-white text-xl leading-none">×</button>
    `;

    document.body.appendChild(banner);

    // Install button handler
    document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User ${outcome} the install prompt`);

        banner.remove();
        deferredPrompt = null;
    });

    // Dismiss button handler
    document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
        banner.remove();
    });
}

function showIOSInstallPrompt() {
    // Check if already dismissed this session
    if (sessionStorage.getItem('pwa-install-dismissed')) return;

    // Create iOS install instructions banner
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'fixed top-16 left-4 right-4 z-50 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-lg max-w-sm mx-auto';
    banner.innerHTML = `
        <div class="flex justify-between items-start mb-2">
            <h3 class="font-bold text-base">Install Digital Bloom</h3>
            <button id="pwa-dismiss-btn" class="text-white/60 hover:text-white text-2xl leading-none -mt-1">×</button>
        </div>
        <p class="text-sm text-white/80 mb-3">Install this app on your home screen for a better experience:</p>
        <ol class="text-sm text-white/90 space-y-2 list-none">
            <li class="flex items-center gap-2">
                <span class="text-2xl">1️⃣</span>
                <span>Tap the Share button <svg class="inline w-4 h-4 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12.5v5.5c0 1.1-.9 2-2 2h-10c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h5.5l-2 2h-3.5v10h10v-3.5l2-2z"/><path d="M12 4l2.5 2.5-3 3 1.5 1.5 3-3L18.5 10.5V4z"/></svg></span>
            </li>
            <li class="flex items-center gap-2">
                <span class="text-2xl">2️⃣</span>
                <span>Select "Add to Home Screen"</span>
            </li>
        </ol>
    `;

    document.body.appendChild(banner);

    // Dismiss button handler
    document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
        banner.remove();
        // Remember dismissal for this session
        sessionStorage.setItem('pwa-install-dismissed', 'true');
    });

    // Auto-dismiss after 15 seconds
    setTimeout(() => {
        if (document.getElementById('pwa-install-banner')) {
            banner.remove();
        }
    }, 15000);
}

export function initPWA() {
    registerServiceWorker();
    setupInstallPrompt();
}