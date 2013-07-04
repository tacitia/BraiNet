<? 

    $datasetKey = $_POST['datasetKey']; 								/*int*/
    $nodeName = $_POST['nodeName'];										/*string*/
    $parentKey = $_POST['parentKey'];									/*int*/
    $depth = $_POST['depth'];											/*int*/
    $userID = $_POST['userID'];											/*int*/
    $notes = $_POST['notes'];           								/*string*/
    $isClone = $_POST['isClone'];
    
    $con = mysql_connect("localhost", "tacitia_brainIDC", "Ophelia621");
    $nodeName = mysql_real_escape_string($nodeName);
    $notes = mysql_real_escape_string($notes);
    
    if (!$con) {
        die('Could not connect: ' . mysql_error());
    }
    
    mysql_select_db("brainconnect_brainData", $con);
    echo mysql_error($con) . "\n";
    
    $nodeTable = 'user_nodes';
    $parentTable = 'node_parents';
    if ($isClone) {
    	$nodeTable = 'public_nodes';
    	$parentTable = 'public_node_parents';
    }
    
	$insertNode = mysql_query("INSERT INTO " . $nodeTable . "(name, userID, datasetKey, notes)
								VALUES ('$nodeName', '$userID', '$datasetKey', '$notes')");
				
	if(!$insertNode){
		echo "Error in node insertion: " . mysql_errno($con);
	}else{
		//get the key of the node just inserted
		$getNodeQuery = "SELECT `key` FROM " . $nodeTable . " WHERE `name` = '" .$nodeName. "' AND `datasetKey` = " . $datasetKey;
		//echo "get node query: ", $get_node_query, "\n";
		$getNode = mysql_query($getNodeQuery) or die ("getting node's key query failed: ".mysql_errno());
		$newNode = mysql_fetch_row($getNode);//assuming returns single node	
		$newNodeKey = $newNode[0];//if use $new_node['key'] here, the result may not be correct.
		//echo "new node key:", $new_node_key, "\n";
		
		//If there is a problem, abort
		if($newNodeKey==0)
		{
			echo "There is a problem inserting nodes into database. The node may not be inserted.";
			mysql_close($con);
		}
		
		//use key to insert parent
		$insertNodeParentQuery = mysql_query("INSERT INTO " . $parentTable .  " (node, parent, depth) VALUES ('$newNodeKey', '$parentKey', '$depth')") or die ("insert node parent failed: ".mysql_errno());
		
		//finally returns all information of the node just added
		$query = "
		SELECT 	nodes.key, nodes.name, parents.parent as parentKey, parents.depth, nodes.datasetKey, nodes.notes, nodes.brodmannKey
		FROM 	" . $nodeTable . " nodes 
		LEFT JOIN 
			(SELECT np.node, un.key as parent, np.depth, un.name as parentName 
			FROM " . $parentTable . " np 
			LEFT JOIN " . $nodeTable . " un 
			ON un.key = np.parent) as parents
		ON nodes.key = parents.node WHERE nodes.datasetKey = ".$datasetKey. " AND nodes.key = ".$newNodeKey;
		
		$result = mysql_query($query, $con) or die("getting node+parent info unsuccessful");
		
		$node = array();
		while ($row = mysql_fetch_array($result)) {
			$node['key'] = $row['key'];
			$node['name'] = $row['name'];
			$node['parentKey'] = $row['parentKey'];
			$node['depth'] = $row['depth'];
			$node['datasetKey'] = $row['datasetKey'];
			$node['notes'] = $row['notes'];
		}
	
		echo json_encode($node);
	}
	mysql_close($con);
?>
