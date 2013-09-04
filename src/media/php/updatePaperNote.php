<? 
    $datasetKey = $_POST['datasetKey']; 								/*int*/
	$linkKey = $_POST['linkKey'];
    $userID = $_POST['userID'];											/*int*/
    $notes = $_POST['notes'];           								/*string*/
    $isClone = $_POST['isClone'];
    $origin = $_POST['origin'];
    
    $con = mysql_connect("localhost", "tacitia_brainIDC", "Ophelia621");
    $notes = mysql_real_escape_string($notes);
    
    if (!$con) {
        die('Could not connect: ' . mysql_error());
    }
    
    mysql_select_db("brainconnect_brainData", $con);
    echo mysql_error($con) . "\n";

	if ($isClone) {
		$query = "INSERT INTO diff_links (linkKey, diff, userID, origin) VALUES ('$linkKey', 'AddNote')";
	}
	else {
	}    

	mysql_close($con);
?>
