<?php
session_start();
require_once('oauth_conf.php');

//error_log("session:{$_SESSION['acsToken']}",0);
if (!isset($_SESSION['acsToken'])) {
  echo 'ログインしてください';
}else{

$table = $_POST['table'];
//error_log("{$table}",0);

$mdata = $_POST['mdata'];
//$mdata = rtrim($mdata, "-");
$mdata = explode("-", $mdata);
if($mdata[0] == "" ) $mdata = array();


$tdata = $_POST['tdata'];
//$tdata = rtrim($tdata, "-");
$tdata = explode("-", $tdata);
if($tdata[0] == "" ) $tdata = array();

$pdata = $_POST['pdata'];
//$pdata = rtrim($pdata, "-");
$pdata = explode("-", $pdata);
if($pdata[0] == "" ) $pdata = array();

$ldata = $_POST['ldata'];
//$ldata = rtrim($ldata, "-");
$ldata = explode("-", $ldata);
if($ldata[0] == "" ) $ldata = array();

$ydata = $_POST['ydata'];
//$ydata = rtrim($ydata, "-");
$ydata = explode("-", $ydata);
if($ydata[0] == "" ) $ydata = array();


$url = 'https://www.google.com/fusiontables/api/query?access_token=' . $_SESSION['acsToken'];
$query = 'SHOW TABLES';
$response = doPost($url, array('sql' => $query));
if ($response==""){
   echo "再度ログインし直してください。";
   return;
}

$flag = 0;
$response = explode("\n", $response);
foreach($response as $value)//すでにテーブルがあるかどうか
{
    $value = explode(",", $value);
    if ($value[1] == $table) {
	$tableid = $value[0];
	$flag = 1;
    }
}

if ($flag == 0) {
    //日本語のテーブル名は''で囲うこと！
    $query = "CREATE TABLE '" . $table . "' (type:STRING,id:STRING,name:STRING,memo:STRING,location:LOCATION)";
    $response = doPost($url, array('sql' => $query));
    $response = explode("\n", $response);
    $tableid = $response[1];
  
}

for ($i = 0; $i < count($mdata); $i++) {
    $m = explode("/", $mdata[$i]);
    $query = "INSERT INTO " . $tableid . " (type, id , name , memo , location) VALUES ('" . $m[0] . "' , '" . $m[1] . "' , '" . $m[2] . "' , '" . $m[3] . "' , " . "'<Point> <coordinates>" . $m[4] . "</coordinates></Point>')";
    $response = doPost($url, array('sql' => $query));
    error_log("{$query}",0);
}

for ($i = 0; $i < count($tdata); $i++) {
    $t = explode("/", $tdata[$i]);
    $query = "INSERT INTO " . $tableid . " (type, id , name , memo , location) VALUES ('" . $t[0] . "' , '" . $t[1] . "' , '" . $t[2] . "' , '" . $t[3] . "' , " . "'<LineString> <coordinates>" . $t[4] . "</coordinates></LineString>')";
    $response = doPost($url, array('sql' => $query));
    error_log("{$query}",0);
}

for ($i = 0; $i < count($pdata); $i++) {
    $p = explode("/", $pdata[$i]);
    $query = "INSERT INTO " . $tableid . " (type, id , name , memo , location) VALUES ('" . $p[0] . "' , '" . $p[1] . "' , '" . $p[2] . "' , '" . $p[3] . "' , " . "'<Point> <coordinates>" . $p[4] . "</coordinates></Point>')";
    $response = doPost($url, array('sql' => $query));
    error_log("{$query}",0);
}


for ($i = 0; $i < count($ldata); $i++) {
    $l = explode("/", $ldata[$i]);
    $query = "INSERT INTO " . $tableid . " (type, id , name , memo , location) VALUES ('" . $l[0] . "' , '" . $l[1] . "' , '" . $l[2] . "' , '" . $l[3] . "' , " . "'<LineString> <coordinates>" . $l[4] . "</coordinates></LineString>')";
    $response = doPost($url, array('sql' => $query));
    error_log("{$query}",0);
}


for ($i = 0; $i < count($ydata); $i++) {
    $y = explode("/", $ydata[$i]);
    $query = "INSERT INTO " . $tableid . " (type, id , name , memo , location) VALUES ('" . $y[0] . "' , '" . $y[1] . "' , '" . $y[2] . "' , '" . $y[3] . "' , " . "'<Polygon><outerBoundaryIs><coordinates>" . $y[4] . "</coordinates></outerBoundaryIs></Polygon>')";
    $response = doPost($url, array('sql' => $query));
    error_log("{$query}",0);
}

echo "完了";
}
?>
