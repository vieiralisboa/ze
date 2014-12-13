<?php

$sub = $_GET['sub'];
$url = "\\\\MYBOOKLIVE\\Public\\Shared Videos\\tv-shows\\" . $sub;

die(file_get_contents($url));
