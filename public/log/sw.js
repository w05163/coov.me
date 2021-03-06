const cacheStorageKey = 'minimal-pwa-1';
const cacheList = [
	'/',
	'https://static-1252458005.file.myqcloud.com/log/index.js.gz?sign=DTQLVgCR+Q/zvO2RzXXrFjoEiWFhPTEyNTI0NTgwMDUmaz1BS0lEZURib3JqM3ZwWkJmQld1ZVM1YzljMkNCeW1UemJWVUgmZT0xNTE1NjgwNDM3JnQ9MTUxMzA4ODQzNyZyPTc0NDM4NTEzJmY9L2xvZy9pbmRleC5qcy5neiZiPXN0YXRpYw==',
	'https://static-1252458005.cosgz.myqcloud.com/icon.woff?sign=bT/WTXbjXcAGvh9KXJBvUIKTyr5hPTEyNTI0NTgwMDUmaz1BS0lEZURib3JqM3ZwWkJmQld1ZVM1YzljMkNCeW1UemJWVUgmZT0xNTEzMTc1NDM3JnQ9MTUxMDU4MzQzNyZyPTM2NTM2OTg5NSZmPS9pY29uLndvZmYmYj1zdGF0aWM='
];

self.addEventListener('install', (e) => {
	e.waitUntil(caches.open(cacheStorageKey)
		.then(cache => cache.addAll(cacheList))
		.then(() => self.skipWaiting()));
});

self.addEventListener('fetch', (e) => {
	e.respondWith(caches.match(e.request).then((response) => {
		if (response != null) {
			return response;
		}
		if (isGetPage(e)) {
			return caches.match(cacheList[0]);
		}
		return fetch(e.request.url);
	}));
});

function isGetPage(e) {
	const { method, url } = e.request;
	const { pathname, href } = self.location;
	const path = href.replace('sw.js', '');
	const pathName = url.replace(path, '').replace('.html', '');
	return method === 'GET' && !/[./]/.test(pathName);
}

