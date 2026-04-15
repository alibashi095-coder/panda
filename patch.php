<?php
require 'db_config.php';
try {
    $pdo->exec("ALTER TABLE user_roles ADD COLUMN code VARCHAR(255) DEFAULT NULL");
    echo "Added code column. ";
} catch (Exception $e) {
    echo "Code column might already exist. ";
}
try {
    $pdo->exec("ALTER TABLE user_roles ADD COLUMN plain_password VARCHAR(255) DEFAULT NULL");
    echo "Added plain_password column. ";
} catch (Exception $e) {
    echo "Plain_password column might already exist. ";
}
echo "Done.";
?>
