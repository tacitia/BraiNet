<?php

/* this should be the data access layer
and should be a class by itself.
But it is neither right now.
*/


function createNewUser(){

	$con = mysql_connect("localhost","root","root");
	if (!$con)
	  {
	  die('Could not connect: ' . mysql_error());
	  }
	
	mysql_select_db("tacitia_hiviz", $con);
  	
	$result = mysql_query("INSERT INTO users (email, fullname, lastname, firstname)
	VALUES ('$email', '$fullname', '$lastname', '$firstname')");
	
	//var_dump($result);
	
	mysql_close($con);
	
	//return userId;
}
?>