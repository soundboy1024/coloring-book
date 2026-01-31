const CACHE_NAME = 'coloring-book-v17-fix-scroll';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './assets.js',
    './extensions.js',
    './banner.js',
    './manifest.json',
    './images/unicorn.png',
    './images/unicorn_jump.png',
    './images/unicorn_icecream.png',
    './images/unicorn_sleep.png',
    './images/gacha_bear.png',
    './images/gacha_boy.png',
    './images/gacha_cat.png',
    './images/gacha_fairy.png',
    './images/gacha_sport.png',
    './images/mona_lisa.png',
    './images/robot.png',
    './images/starry_night.png',
    './images/uni_cheeky.png',
    './images/uni_jump.png',
    './images/uni_poop_pile.png',
    './images/uni_potty.png',
    './images/uni_trail.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Pre-caching offline pages');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
});
