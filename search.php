<?php
$lines = file('script.js');
foreach($lines as $i => $line) {
    if (strpos($line, 'crypto') !== false || strpos($line, 'randomUUID') !== false) {
        echo ($i + 1) . ": " . trim($line) . "\n";
    }
}
?>
