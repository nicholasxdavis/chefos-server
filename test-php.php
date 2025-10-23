<?php
// Simple test PHP file to verify routing works
header('Content-Type: text/plain');
echo "PHP routing is working!\n";
echo "Current time: " . date('Y-m-d H:i:s') . "\n";
echo "Request URI: " . $_SERVER['REQUEST_URI'] . "\n";
echo "Script name: " . $_SERVER['SCRIPT_NAME'] . "\n";
?>
