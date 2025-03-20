const CACHE_NAME = 'relic-tracker-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './src/img/icon-72x72.png',
    './src/img/icon-96x96.png',
    './src/img/icon-128x128.png',
    './src/img/icon-144x144.png',
    './src/img/icon-152x152.png',
    './src/img/icon-167x167.png',
    './src/img/icon-180x180.png',
    './src/img/icon-192x192.png',
    './src/img/icon-384x384.png',
    './src/img/icon-512x512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
}); 