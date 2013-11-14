<?php
/*
 * Copyright 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
if(!isset($_SESSION)) {
     session_start();
}
include_once 'config.php';

require_once 'src/Google_Client.php';
require_once 'src/contrib/Google_Oauth2Service.php';



$client = new Google_Client();
$client->setApplicationName($appname);
// Visit https://code.google.com/apis/console?api=plus to generate your
//oauth2_client_id, oauth2_client_secret, and to register your oauth2_redirect_uri.
$client->setClientId($client_id);
$client->setClientSecret($client_secret);
$client->setRedirectUri($callback);
$client->setDeveloperKey($developer_key);

$oauth2 = new Google_Oauth2Service($client);

if (isset($_GET['code'])) {
  $client->authenticate($_GET['code']);
  $_SESSION['token'] = $client->getAccessToken();
  $redirect = 'http://' . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF'];
  

  header('Location: ' . filter_var($redirect, FILTER_SANITIZE_URL));

  
  return;
}

if (isset($_SESSION['token'])) {
 $client->setAccessToken($_SESSION['token']);
}

if (isset($_REQUEST['logout'])) {
  unset($_SESSION['token']);
  $client->revokeToken();
}

if ($client->getAccessToken()) {
  $user = $oauth2->userinfo->get();

  // These fields are currently filtered through the PHP sanitize filters.
  // See http://www.php.net/manual/en/filter.filters.sanitize.php
  $email = filter_var($user['email'], FILTER_SANITIZE_EMAIL);
  $img = filter_var($user['picture'], FILTER_VALIDATE_URL);
  
  $fullname = filter_var($user['name'],FILTER_SANITIZE_STRING);
  $lastname = filter_var($user['family_name'],FILTER_SANITIZE_STRING);
  $firstname = filter_var($user['given_name'],FILTER_SANITIZE_STRING);

  //var_dump($user);
  $personMarkup = "$email<div><img src='$img?sz=50'></div>";
  

  // The access token may have been updated lazily.
  $_SESSION['token'] = $client->getAccessToken();
  
  
  //this need to packaged as a function
//   	$con = mysql_connect("localhost","root","root");
// 	if (!$con)
// 	  {
// 	  die('Could not connect: ' . mysql_error());
// 	  }
// 	
// 	mysql_select_db("tacitia_hiviz", $con);
//   	
// 	$result = mysql_query("INSERT INTO users (email, fullname, lastname, firstname)
// 	VALUES ('$email', '$fullname', '$lastname', '$firstname')");
// 
// 	mysql_close($con);
  
} else {
  $authUrl = $client->createAuthUrl();
}
?>

<?php
  if(isset($authUrl)) {
	print "<a class='login' href='$authUrl'>Sign in</a>";
  } else {

   print $email;
   print "<a class='logout' href='?logout'>Logout</a>";  
   
  }
?>