<? 
    $linkKey = $_POST['linkKey'];
    $userID = $_POST['userID'];											/*int*/
    $notes = $_POST['notes']; 
    $isClone = $_POST['isClone'];          								/*string*/
    $origin = $_POST['origin'];
    
    $con = mysql_connect("localhost", "tacitia_brainIDC", "Ophelia621");
    if (!$con) {
        die('Could not connect: ' . mysql_error());
    }

    mysql_select_db("brainconnect_brainData", $con);

    $notes = mysql_real_escape_string($notes);
    
    if ($isClone) {
    	if ($notes) {
			mysql_query("INSERT INTO diff_links (linkKey, diff, userID, origin, content) VALUES ('$linkKey', 'ChangeNote', '$userID', '$origin', '$notes')") or die("an error occurred when updating link notes" . mysql_error());
    	}
    }
    else {
    	if ($notes) {
			mysql_query("UPDATE user_links SET `notes` = '$notes' WHERE `key` = '$linkKey'") or die("an error occurred when updating link notes" . mysql_error());
    	}
    }
    
	mysql_close($con);
?>
