<? 
    /* all int*/
    $datasetKey = $_POST['dataset']; 
	$userId = $_POST['user'];
	$sourceKey = $_POST['source'];
	$targetKey = $_POST['target'];
	$notes = $_POST['notes'];
	$attrKey = $_POST['attrKey'];
	$attrValue = $_POST['attrValue'];

    $con = mysql_connect("localhost", "tacitia_brainIDC", "Ophelia621");
    if (!$con) {
        die('Could not connect: ' . mysql_error());
    }
    else {
//        echo 'Connection successful' . "\n";
    }

    mysql_select_db("tacitia_brainData", $con);

    echo mysql_error($con) . "\n";

	// Check if the link already exists
    $query = "SELECT * FROM user_links 
    WHERE sourceKey = " . $sourceKey . " AND targetKey = " . $targetKey . 
    " AND datasetKey = " . $datasetKey;

    try{
        	$result = mysql_query($query, $con);
    }catch(Exception $e){
    	    echo 'SQL Query: '.$query;
    	    echo ' caused exception: ',  $e->getMessage(), "\n";
    }

	// If the link does not exist, insert a new link
	if (mysql_num_rows($result) == 0) {
	    mysql_query("INSERT INTO user_links (sourceKey, targetKey, userID, datasetKey, notes) VALUES ('$sourceKey','$targetKey','$userId', '$datasetKey', '$notes')");   
	}
	
	// Now retrieve the link
    $query = "SELECT * FROM user_links 
    WHERE sourceKey = " . $sourceKey . " AND targetKey = " . $targetKey . 
    " AND datasetKey = " . $datasetKey;

    try{
        	$result = mysql_query($query, $con);
    }catch(Exception $e){
    	    echo 'SQL Query: '.$query;
    	    echo ' caused exception: ',  $e->getMessage(), "\n";
    }
	
    $links = array();
	$linkKey;
	while ($row = mysql_fetch_array($result)) {
		$link = array();
    	//$link['key'] = $row['key'];
    	$linkKey = (string)$row['key'];
        $link['sourceKey'] = $row['sourceKey'];
        $link['targetKey'] = $row['targetKey'];
    	$link['datasetKey'] = $row['datasetKey'];
   	    $link['notes'] = $row['notes'];
   	    $link['attributes'] = array();
   	    
   	    $links[$linkKey] = $link;
    }
    //echo $linkKey;
    //echo $links;

	// Insert the attributes
	mysql_query("INSERT INTO link_attributes(linkKey, attributeKey, attrValue) VALUES 
	('$linkKey', '$attrKey', '$attrValue')");
	
	// Retrieve all attributes
	//$attrs = array();
	
	$query = "SELECT * FROM link_attributes WHERE linkKey = " . $linkKey;

    try{
        	$result = mysql_query($query, $con);
    }catch(Exception $e){
    	    echo 'SQL Query: '.$query;
    	    echo ' caused exception: ',  $e->getMessage(), "\n";
    }
	
//	$link['attrs'] = $attrs;	
	while ($row = mysql_fetch_array($result)) {
		$linkKey = (string)$row['linkKey'];
	
		$key = (string)$row['attributeKey'];
		$value = $row['attrValue'];
		$links[$linkKey]['attributes'][$key] = $value;
	}

    echo json_encode($links);
	mysql_close($con);
?>
