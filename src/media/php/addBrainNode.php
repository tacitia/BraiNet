<? 
    $datasetKey = $_POST['datasetKey']; 	/*int*/
    $nodeName = $_POST['nodeName'];			/*string*/
    $parentKey = $_POST['parentKey'];		/*int*/
    $depth = $_POST['depth'];			/*int*/
    $userID = $_POST['userID'];			/*int*/
    
    $con = mysql_connect("localhost", "tacitia_brainIDC", "Ophelia621");
    if (!$con) {
        die('Could not connect: ' . mysql_error());
    }
    else {
        //echo 'Connection successful' . "\n";
    }

    mysql_select_db("tacitia_brainData", $con);


	/*
    $nodeTableName = $datasetName . '_nodes';
    
    mysql_query("
        INSERT INTO Vision_nodes (name)
        VALUES ($uid, $sessionLength);
    ", $con);
	*/
    echo mysql_error($con) . "\n";
    
    
    mysql_query("INSERT INTO user_nodes (name, parent, depth, userID, datasetKey)
VALUES ('$nodeName', '$parentKey','$depth','$userID', '$datasetKey')");

    $query = "SELECT * FROM user_nodes 
    WHERE name = '" . $nodeName. "' AND datasetKey = " . $datasetKey;

    try{
        	$result = mysql_query($query, $con);
    }catch(Exception $e){
    	    echo 'SQL Query: '.$query;
    	    echo ' caused exception: ',  $e->getMessage(), "\n";
    }

    $node = array();
    while ($row = mysql_fetch_array($result)) {
    	    $node['key'] = $row['key'];
        	$node['name'] = $row['name'];
        $node['parentKey'] = $row['parent'];
        	$node['depth'] = $row['depth'];
        $node['datasetKey'] = $row['datasetKey'];
    }

    echo json_encode($node);
	
	mysql_close($con);
?>
