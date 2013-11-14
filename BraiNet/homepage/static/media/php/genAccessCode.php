<!DOCTYPE html>
<html>
<body>
<div>
<? 
	$MYSQL_DUPLICATE_PRIMARY_KEY_ERRNO = 1062;
	$websiteName = "BraiNet";
	$emailAddress = "admin@brainconnect.cs.brown.edu";
	
    $email = $_POST["email"]; 

    $con = mysql_connect("localhost", "tacitia_brainIDC", "Ophelia621");
    if (!$con) {
        die('Could not connect: ' . mysql_error());
    }
    else {
//        echo 'Connection successful' . "\n";
    }
    mysql_select_db("brainconnect_brainData", $con);
    echo mysql_error($con) . "\n";
    
    do {
	    $gen = substr(md5(uniqid(mt_rand(), true)), 0, 8);    

	    $query = "INSERT INTO accesscode (accesscode, email) VALUES ('$gen', '$email')";
	    mysql_query($query);
    } while (mysql_errno() == $MYSQL_DUPLICATE_PRIMARY_KEY_ERRNO);
    
    // Send email to the user
    $accesslink = "http://brainconnect.cs.brown.edu/index.html?accesscode=" . $gen;
	$header = "MIME-Version: 1.0\r\n";
	$header .= "Content-type: text/plain; charset=iso-8859-1\r\n";
	$header .= "From: ". $websiteName . " <" . $emailAddress . ">\r\n";
	
	$subject = "Access link to BraiNet";
		
	$message = "Hello,\n\nPlease find below an access link to BraiNet:\n\n" . $accesslink . "\n\nWhen you visit BraiNet using your access link, changes you make will be saved and will be available every time you visit BraiNet using the same access link. \n\nThanks for using BraiNet! If you have any question or comment, please email hua_guo@brown.edu.\n\nYours Sincerely,\nBraiNet team";
	$message = wordwrap($message, 70);
	mail($email,$subject,$message,$header);
    	
	echo "<p>An email containing an access link has been sent to " . $email . ". Please check your inbox (possibly also the spam folder) for the email and enjoy using BraiNet!</p>";

	mysql_close($con);

?>
</div>
</body>
</html>