<?php
header('Content-Type: text/html; charset=utf-8');
require_once 'db_config.php';

echo "<div style='font-family: Arial; padding: 20px; border: 2px solid #6366f1; border-radius: 10px; max-width: 500px; margin: 50px auto; text-align: center;'>";
echo "<h2 style='color: #6366f1;'>جاري إصلاح النظام...</h2>";

try {
    // 1. إعادة إنشاء حساب المدير
    $email = 'admin@panda.com';
    $pass = '123123';
    $hash = password_hash($pass, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("SELECT id FROM user_roles WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        $pdo->prepare("UPDATE user_roles SET password_hash = ? WHERE email = ?")->execute([$hash, $email]);
        echo "<p style='color: green;'>✅ تم تحديث كلمة مرور المدير بنجاح!</p>";
    } else {
        $id = 'ADM-' . time();
        $pdo->prepare("INSERT INTO user_roles (id, name, email, password_hash, role, role_code, status_code) VALUES (?, 'مدير النظام', ?, ?, 'مدير النظام', 'admin', 'active')")
            ->execute([$id, $email, $hash]);
        echo "<p style='color: green;'>✅ تم إنشاء حساب مدير جديد بنجاح!</p>";
    }

    echo "<hr>";
    echo "<h3>بيانات الدخول االآن:</h3>";
    echo "<p>البريد: <b>$email</b></p>";
    echo "<p>كلمة المرور: <b>$pass</b></p>";
    echo "<br>";
    echo "<a href='index.html' style='background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>اذهب لتسجيل الدخول الآن</a>";

} catch (Exception $e) {
    echo "<p style='color: red;'>❌ حدث خطأ: " . $e->getMessage() . "</p>";
    echo "<p>تأكد من إعدادات قاعدة البيانات في db_config.php</p>";
}

echo "</div>";
?>
