<?php
session_start();

$_SESSION = array();

if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time()-42000, '/');
}

session_destroy();

$url = parse_url($_SERVER[HTTP_REFERER]);
header('Location: ' . $url['path']);
?>
