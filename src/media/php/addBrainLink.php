<? 
    /* all int*/
    $datasetKey = $_POST['datasetKey']; 
	$userId = $_POST['userID'];
	$sourceKey = $_POST['sourceKey'];
	$targetKey = $_POST['targetKey'];
	$notes = $_POST['notes'];
	$attrKey = $_POST['attrKey'];
	$attrValue = $_POST['attrValue'];
    $isClone = $_POST['isClone'];

    $con = mysql_connect("localhost", "tacitia_brainIDC", "Ophelia621");
    if (!$con) {
        die('Could not connect: ' . mysql_error());
    }
    else {
//        echo 'Connection successful' . "\n";
    }

    mysql_select_db("brainconnect_brainData", $con);

    echo mysql_error($con) . "\n";

	$linkTable = 'user_links';
	$datasetType = 'user';
	if ($isClone) {
		$linkTable = 'public_links';
		$datasetType = 'public';
	}

	// Check if the link already exists
    $query = "SELECT * FROM " . $linkTable .
    " WHERE sourceKey = " . $sourceKey . " AND targetKey = " . $targetKey . 
    " AND datasetKey = " . $datasetKey;
    
//    echo $query;

    try{
        	$result = mysql_query($query, $con);
    }catch(Exception $e){
    	    echo 'SQL Query: '.$query;
    	    echo ' caused exception: ',  $e->getMessage(), "\n";
    }

	// If the link does not exist, insert a new link
	if (mysql_num_rows($result) == 0) {
	    mysql_query("INSERT INTO " . $linkTable . " (sourceKey, targetKey, userID, datasetKey, notes) VALUES ('$sourceKey','$targetKey','$userId', '$datasetKey', '$notes')");   
	}
	
	// Now retrieve the link
    $query = "SELECT * FROM " . $linkTable .
    " WHERE sourceKey = " . $sourceKey . " AND targetKey = " . $targetKey . 
    " AND datasetKey = " . $datasetKey;

    try{
        	$result = mysql_query($query, $con);
    }catch(Exception $e){
    	    echo 'SQL Query: '.$query;
    	    echo ' caused exception: ',  $e->getMessage(), "\n";
    }
	
//    $links = array();
	$linkKey;
	$link = array();
	while ($row = mysql_fetch_array($result)) {
    	//$link['key'] = $row['key'];
    	$linkKey = (string)$row['key'];
        $link['sourceKey'] = $row['sourceKey'];
        $link['targetKey'] = $row['targetKey'];
    	$link['datasetKey'] = $row['datasetKey'];
   	    $link['notes'] = $row['notes'];
   	    $link['attributes'] = array();
    }

	// Insert the attributes
	
	if ($attrKey) {
		mysql_query("INSERT INTO link_attributes(linkKey, attributeKey, attrValue, datasetType) VALUES 
		('$linkKey', '$attrKey', '$attrValue', '$datasetType')");
	}
	
	// Retrieve all attributes	
	$query = "SELECT * FROM link_attributes WHERE linkKey = " . $linkKey . " AND datasetType = " . $datasetType;

    try{
        	$result = mysql_query($query, $con);
    }catch(Exception $e){
    	    echo 'SQL Query: '.$query;
    	    echo ' caused exception: ',  $e->getMessage(), "\n";
    }
	
	while ($row = mysql_fetch_array($result)) {
		$linkKey = (string)$row['linkKey'];
	
		$key = (string)$row['attributeKey'];
		$value = $row['attrValue'];
		$link['attributes'][$key] = $value;
	}

    echo json_encode($link);
	mysql_close($con);
?>
