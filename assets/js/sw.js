// Service Worker для FREE CAD
const CACHE_NAME = 'free-cad-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/cad.html',
    '/documentation.html',
    '/contact.html',
    '/bug-report.html',
    '/css/styles.css',
    '/js/script.js',
    '/manifest.json'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Кэш открыт');
                return cache.addAll(urlsToCache);
            })
    );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Удаление старого кэша:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Возвращаем кэшированную версию, если она есть
                if (response) {
                    return response;
                }
                
                // Иначе загружаем из сети
                return fetch(event.request).then((response) => {
                    // Проверяем, что ответ валидный
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Клонируем ответ
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            })
    );
});

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Новое уведомление от FREE CAD',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Открыть FREE CAD',
                icon: '/icon-192x192.png'
            },
            {
                action: 'close',
                title: 'Закрыть',
                icon: '/icon-192x192.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('FREE CAD', options)
    );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Обработка синхронизации в фоне
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Здесь можно добавить логику синхронизации данных
            console.log('Фоновая синхронизация выполнена')
        );
    }
});
