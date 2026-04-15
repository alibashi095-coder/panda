<?php
require_once 'db_config.php';

try {
    // 1. تغيير ترميز قاعدة البيانات نفسها
    $pdo->exec("ALTER DATABASE `" . $db . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    // 2. جلب جميع الجداول
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

    // 3. تحويل كل جدول وكل عمود إلى utf8mb4
    foreach ($tables as $table) {
        $pdo->exec("ALTER TABLE `$table` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        echo "تم إصلاح ترميز الجدول: $table <br>";
    }
    
    echo "<h3 style='color:green;'>تم حل مشكلة علامات الاستفهام (????) بنجاح! يمكنك إغلاق أو حذف هذا الملف الآن.</h3>";

} catch (Exception $e) {
    echo "<h3 style='color:red;'>حدث خطأ: " . $e->getMessage() . "</h3>";
}
?>
