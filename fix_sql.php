<?php
$content = file_get_contents('database.sql');

// Find all `CREATE TABLE` statements avoiding modifying ones that already have ENGINE
// Wait! Let's just do a blanket regex: replace `\);` at the end of a line with `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;` 
// ONLY if it's the end of a CREATE TABLE.

// Actually, simpler:
$content = preg_replace('/(\n\s*\));/', "\n$1 ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;", $content);

// Ensure there is no duplicated ENGINE
$content = preg_replace('/(ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;)+/', "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;", $content);

file_put_contents('database.sql', $content);
echo "Done";
?>
