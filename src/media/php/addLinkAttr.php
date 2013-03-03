<? 
    /* all int*/
    $datasetKey = $_POST['datasetKey']; 
	$attrName = $_POST['attrName'];
	$attrType = $_POST['attrType'];

    $con = mysql_connect("localhost", "tacitia_brainIDC", "Ophelia621");
    if (!$con) {
        die('Could not connect: ' . mysql_error());
    }
    else {
//        echo 'Connection successful' . "\n";
    }

    mysql_select_db("tacitia_brainData", $con);
    
    /*
    $brainData = array();

    $nodeTableName = $datasetName . '_nodes';
    $linkTableName = $datasetName . '_links';
    
    $result = mysql_query("
        SELECT * FROM " . $nodeTableName;
    ", $con);
    
    while ($row = mysql_fetch_array($result)) {
        
    }*/

    echo mysql_error($con) . "\n";

	/*
    echo json_encode($result);
    */
    
    mysql_query("INSERT INTO user_links (sourceKey, targetKey, userID, datasetKey, notes)
VALUES ('$sourceKey','$targetKey','$userId', '$datasetKey', '$notes')");

    $query = "SELECT * FROM user_links 
    WHERE sourceKey = " . $sourceKey . " AND targetKey = " . $targetKey . 
    " AND datasetKey = " . $datasetKey;

    try{
        	$result = mysql_query($query, $con);
    }catch(Exception $e){
    	    echo 'SQL Query: '.$query;
    	    echo ' caused exception: ',  $e->getMessage(), "\n";
    }

    $link = array();
    while ($row = mysql_fetch_array($result)) {
        $link['key'] = $row['key'];
        $link['sourceKey'] = $row['sourceKey'];
        $link['targetKey'] = $row['targetKey'];
        $link['datasetKey'] = $row['datasetKey'];
        $link['notes'] = $row['notes'];
    }

    echo json_encode($link);
    
	mysql_close($con);
?>
