<?php

$sub = $_GET['sub'];
$host = "/mnt/Public/Shared Videos/";
$info = pathinfo($host.$sub);
$srt = $info['dirname']."/".$info['filename'].".srt";

header('Content-Type: text/vtt; charset=utf-8');

die(srt2vtt($srt));

function srt2vtt($srt){
    if(!file_exists($srt)) return;

    $info = pathinfo($srt);
    $filename = $info['dirname']."/".$info['filename'].".vtt";

    if($info['extension'] != "srt") return;

    $vtt = array();
    $vtt[0] = "WEBVTT\n";
    $vtt[1] = "\n";
    foreach(file($srt) as $i => $line){
        $pattern ='/\d{2}:\d{2}:\d{2},\d{1,3} \-\-\> \d{2}:\d{2}:\d{2},\d{1,3}/';
        if(preg_match($pattern, $line, $matches))
            $line = str_replace(",", ".", $line);
        $vtt[$i+2] = utf8_encode($line);
    }

    return implode("", $vtt);
}
