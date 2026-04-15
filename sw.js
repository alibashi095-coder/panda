const CACHE_NAME = 'panda-pwa-v5';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js'
];

// تثبيت Service Worker وحفظ الملفات الأساسية
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// استدعاء الملفات (استخدام الكاش للملفات الثابتة، وتخطي طلبات API)
self.addEventListener('fetch', (event) => {
    // لا تقم بحفظ طلبات POST أو طلبات API الديناميكية
    if (event.request.method !== 'GET') return;
    if (event.request.url.includes('api.php') || event.request.url.includes('supabase.co')) return;

    event.respondWith(
        caches.match(event.request).then((response) => {
            // إذا كان الملف موجوداً في الكاش، قم بإرجاعه. وإلا قم بجلبه من الشبكة.
            return response || fetch(event.request).catch(() => {
                // يمكنك هنا إرجاع صفحة "أوفلاين" مخصصة إذا فشل الاتصال بالكامل
            });
        })
    );
});