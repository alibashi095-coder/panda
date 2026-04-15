<?php
$host = '127.0.0.1';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // إنشاء قاعدة البيانات
    $pdo->exec("CREATE DATABASE IF NOT EXISTS panda CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "<p style='color: green;'>تم إنشاء أو العثور على قاعدة البيانات 'panda'.</p>";
    
    // اختيار قاعدة البيانات
    $pdo->exec("USE panda");
    
    // قراءة وتطبيق ملف database.sql
    if (file_exists('database.sql')) {
        $sql = file_get_contents('database.sql');
        $pdo->exec($sql);
        echo "<p style='color: green;'>تم استيراد الجداول من database.sql بنجاح.</p>";
    } else {
        echo "<p style='color: red;'>ملف database.sql غير موجود!</p>";
    }

} catch (\PDOException $e) {
    echo "<p style='color: red;'>خطأ: " . $e->getMessage() . "</p>";
}
?>
