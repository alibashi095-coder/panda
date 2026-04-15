<?php
require_once 'db_config.php';
$email = 'admin@panda.com';
$pass = '123123';
$hash = password_hash($pass, PASSWORD_DEFAULT);

// التأكد من وجود الحساب أو تحديثه
$stmt = $pdo->prepare("SELECT id FROM user_roles WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    $pdo->prepare("UPDATE user_roles SET password_hash = ? WHERE email = ?")->execute([$hash, $email]);
    echo "<h1>تم تحديث كلمة مرور مدير النظام بنجاح!</h1>";
} else {
    $id = 'ADM-' . time();
    $pdo->prepare("INSERT INTO user_roles (id, name, email, password_hash, role, role_code, status_code) VALUES (?, 'مدير النظام', ?, ?, 'مدير النظام', 'admin', 'active')")
        ->execute([$id, $email, $hash]);
    echo "<h1>تم إنشاء حساب مدير نظام جديد بنجاح!</h1>";
}

echo "<p>الآن يمكنك الدخول بـ: <br> البريد: <b>$email</b> <br> كلمة المرور: <b>$pass</b></p>";
echo "<a href='index.html'>اذهب لصفحة الدخول</a>";
