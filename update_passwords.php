<?php
require_once 'db_config.php';
$new_hash = password_hash('123123', PASSWORD_BCRYPT);

try {
    // تحديث قاعدة البيانات
    $stmt = $pdo->prepare("UPDATE user_roles SET password_hash = :hash, plain_password = '123123'");
    $stmt->execute(['hash' => $new_hash]);
    
    // تحديث ملف database.sql أيضا
    $sql_file = 'database.sql';
    if (file_exists($sql_file)) {
        $content = file_get_contents($sql_file);
        $content = str_replace(
            "'$2y$10\$wK1VqO3Z1H6xG4J5.e0/U.tqz3pM5yq31j0pG.8E0kO3qQcM2L6tq'", 
            "'$new_hash'", 
            $content
        );
        file_put_contents($sql_file, $content);
    }

    echo "PASSWORDS UPDATED";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
?>
