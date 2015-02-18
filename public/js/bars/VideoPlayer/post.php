<?php

// windows: double quotes content-type and escape double quotes on unquoted json string 
//curl -v -H "content-type: application/json" -X POST -d {\"name\":\"data.json\",\"text\":\"Hello World\"} http://frontgate.dev/ctt/upload2.php
//curl -v -H "content-type: application/json" -X POST -d {\"name\":\"data.json\",\"text\":\"Hello\"} http://frontgate.dev/vtt/upload2.php
//curl -v -H "content-type: application/json" -X POST --data @data.json http://frontgate.dev/vtt/upload2.php

//file_put_contents("C:\\TEMP\\res.json", json_encode($_POST));
file_put_contents($_POST['name'], $_POST['text']);
