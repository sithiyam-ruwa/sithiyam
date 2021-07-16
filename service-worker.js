// Caution! Be sure you understand the caveats before publishing an application with
// offline support. See https://aka.ms/blazor-offline-considerations

self.importScripts('./service-worker-assets.js');
self.addEventListener('install', event => event.waitUntil(onInstall(event)));
self.addEventListener('activate', event => event.waitUntil(onActivate(event)));
self.addEventListener('fetch', event => event.respondWith(onFetch(event)));

const cacheNamePrefix = 'offline-cache-';
const cacheName = `${cacheNamePrefix}${self.assetsManifest.version}`;
const offlineAssetsInclude = [/\.dll$/, /\.pdb$/, /\.wasm/, /\.html/, /\.js$/, /\.json$/, /\.css$/, /\.woff$/, /\.png$/, /\.jpe?g$/, /\.gif$/, /\.ico$/, /\.blat$/, /\.dat$/];
const offlineAssetsExclude = [/^service-worker\.js$/];

// const PRECACHE = 'precache-v-1.0.0.0';
const RUNTIME = 'runtime';
const PRECACHE_URLS = [
    'index.html',
    'indexmirror.htm',
    './'
];


async function onInstall(event) {
    console.info('Service worker: Install');

    var cache = await caches.open(RUNTIME);

    for (s in self.assetsManifest.assets) {
        var url = self.assetsManifest.assets[s].url;
        console.info(url);
        // cache.add(url);
        cacheURL(url, cache);
    }

    for (url in PRECACHE_URLS) {
        console.info(url);
        await cache.delete(url);
        cacheURL(url, cache);
    }

}

async function cacheURL(url, cache) {
    var response = await fetch(url, { redirect: "follow" })
    cache.put(url, response.clone());
}

async function onActivate(event) {
    console.info('Service worker: Activate');

    const currentCaches = [RUNTIME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
        }).then(cachesToDelete => {
            return Promise.all(cachesToDelete.map(cacheToDelete => {
                return caches.delete(cacheToDelete);
            }));
        }).then(() => self.clients.claim())
    );
}

async function onFetch(event) {
    // Skip cross-origin requests, like those for Google Analytics.
    if (event.request.method === 'GET' && event.request.url.startsWith(self.location.origin)) {

        var req = event.request;

        const shouldServeIndexHtml = event.request.mode === 'navigate';
        if (shouldServeIndexHtml) {
            req = new Request(url = 'indexmirror.htm');
        }

        var cache = await caches.open(RUNTIME);

        var cachedResponse = await cache.match(req.url, { ignoreVary: true });
        if (cachedResponse) {
            return cachedResponse;
        }


        var response = await fetch(req, { redirect: "follow" })
        // Put a copy of the response in the runtime cache.
        return cache.put(req.url, response.clone()).then(() => {
            return response;
        });


    }
}
/* Manifest version: OXFiwVzi */
