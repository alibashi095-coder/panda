<?php
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

if ($uri !== '/' && file_exists(__DIR__ . '/public' . $uri)) {
    return false;
}

if (file_exists(__DIR__ . $uri)) {
    return false;
}

if (preg_match('/^\/api\/(.*)$/', $uri, $matches)) {
    $_GET['endpoint'] = $matches[1];
    require_once __DIR__ . '/api.php';
    return true;
}

require_once __DIR__ . '/index.html';
