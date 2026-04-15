<?php
$lines = file('script.js');
foreach ($lines as $i => $line) {
    if (strpos($line, 'supabaseClient') !== false) {
        echo "Line " . ($i + 1) . ": " . htmlspecialchars($line) . "<br>";
    }
}
?>
