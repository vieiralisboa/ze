<?php

$sub = $_GET['sub'];
$folder = "/mnt/Public/Shared Videos/";//"http://situs.pt/myTV/vtt/";
$file = $folder . $sub;

if(file_exists($file)) {
    $content = file_get_contents($file);
    header('Content-Type: text/vtt; charset=utf-8');
    die($content);
}

header('HTTP/1.0 404 Not Found');
echo "<h1>Error 404 Not Found</h1>";
//readfile('404.html');

exit();
