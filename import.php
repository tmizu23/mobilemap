<?php
session_start();
require_once('oauth_conf.php');

//error_log("session:{$_SESSION['acsToken']}",0);
if (!isset($_SESSION['acsToken'])) {
  echo 'ログインしてください';
}else{

$table = $_POST['table'];

$url = 'https://www.google.com/fusiontables/api/query?access_token=' . $_SESSION['acsToken'];
$query = 'SHOW TABLES';
$response = doPost($url, array('sql' => $query));
if ($response==""){
   echo "再度ログインし直してください。";
   return;
}
$response = explode("\n", $response);
$flag = 0;
foreach($response as $value)//すでにテーブルがあるかどうか
{
    $value = explode(",", $value);
    if ($value[1] == $table) {
	$tableid = $value[0];
	$flag = 1;
    }
}
if ($flag == 1) {
 $url = 'https://www.google.com/fusiontables/api/query?access_token=' . $_SESSION['acsToken'];
 $query = 'SELECT * FROM ' . $tableid;
 $response = doPost($url, array('sql' => $query));
 echo $response;
 
}else{
 echo 'テーブルがありません。';
}

}
?>
