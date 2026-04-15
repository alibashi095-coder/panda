<?php
$hash = '$2y$10$wK1VqO3Z1H6xG4J5.e0/U.tqz3pM5yq31j0pG.8E0kO3qQcM2L6tq';
echo "Verify 123123: " . (password_verify('123123', $hash) ? "YES" : "NO") . "\n";
echo "New hash for 123123: " . password_hash('123123', PASSWORD_BCRYPT) . "\n";
?>
