<? 
    $nodeKey = $_POST['linkKey'];			/*int*/
    $isClone = $_POST['isClone'];
    $origin = $_POST['origin'];
    $userID = $_POST['userID'];
    
    $con = mysql_connect("localhost", "tacitia_brainIDC", "Ophelia621");
    if (!$con) {
        die('Could not connect: ' . mysql_error());
    }
    else {
        //echo 'Connection successful' . "\n";
    }

    mysql_select_db("brainconnect_brainData", $con);

    echo mysql_error($con) . "\n";   

	if ($isClone) {
		mysql_query("INSERT INTO diff_links (linkKey, diff, userID, origin) VALUES ('$nodeKey', 'Delete', '$userID', '$origin')") or die("an error occurred when deleting cloned link");
	}
	else {
    	mysql_query("DELETE FROM user_links WHERE key = " . $nodeKey) or die("an error occured when deletinglinks");
    }

	mysql_close($con);
?>