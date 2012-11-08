<?php
session_start();

require_once('oauth_conf.php');


if (isset($_GET['error'])) { // 認可が拒否された場合
    header('Location: loginerror.html');
    exit();
}

$params = array(
  'client_id'     => $conf['consKey'],
  'client_secret' => $conf['consSecret'],
  'redirect_uri'  => $conf['callbackUrl'],
  'code'          => $_GET['code'],
  'grant_type'    => 'authorization_code'
);

// アクセストークンURLにPOST
$response = doPost($conf['acsTokenUrl'], $params);

$data = json_decode($response);
$acsToken = $data->access_token;
$refToken = $data->refresh_token;  
$_SESSION['acsToken'] = $acsToken;
$_SESSION['refToken'] = $refToken;


//error_log(print_r($response,true));


header('Location:' . $_GET['state'] . "?login=true");


?>
