<?php

$sub = $_GET['sub'];
$host = "/mnt/Public/Shared Videos/";//"http://situs.pt/myTV/vtt/";//
$file = $host.$sub;

$content = file_get_contents($file);

if(file_exists($file)){
	header('Content-Type: text/vtt; charset=utf-8');
	die($content);
}
