<?php

$sub = $_GET['sub'];
$url = "\\\\MYBOOKLIVE\\Public\\Shared Videos\\tv-shows\\" . $sub;
//die($url);
die(file_get_contents($url));