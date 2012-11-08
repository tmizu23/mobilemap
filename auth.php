<?php

require_once('oauth_conf.php');
$scope = 'https://www.googleapis.com/auth/fusiontables';

$params = array(
  'client_id'     => $conf['consKey'],
  'scope'         => $scope,
  'response_type' => 'code',
  'redirect_uri'  => $conf['callbackUrl'],
  'state' => $_SERVER[HTTP_REFERER],
);
$url = $conf['authUrl'] . '?' . http_build_query($params);
header('Location: ' . $url);
?>
