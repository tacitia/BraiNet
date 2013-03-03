<? 

    $datasetKey = $_POST['datasetKey']; 								/*int*/
    $nodeName = $_POST['nodeName'];										/*string*/
    $parentKey = $_POST['parentKey'];									/*int*/
    $depth = $_POST['depth'];											/*int*/
    $userID = $_POST['userID'];											/*int*/
    $notes = $_POST['notes'];           								/*string*/
    $brodmannKey = $_POST['brodmannKey'];								/*int*/
    
    $con = mysql_connect("localhost", "tacitia_brainIDC", "Ophelia621");
    $nodeName = mysql_real_escape_string($nodeName);
    $notes = mysql_real_escape_string($notes);
    
    if (!$con) {
        die('Could not connect: ' . mysql_error());
    }
    
    mysql_select_db("tacitia_brainData", $con);
    echo mysql_error($con) . "\n";
    
	$insertNode = mysql_query("INSERT INTO user_nodes (name, userID, datasetKey, notes, brodmannKey)
								VALUES ('$nodeName', '$userID', '$datasetKey', '$notes', '$brodmannKey')");
	if(!$insertNode){
		echo "".mysql_errno($con);
	}else{
		//get the key of the node just inserted
		$getNodeQuery = "SELECT user_nodes.key FROM user_nodes WHERE user_nodes.name = '" .$nodeName. "' AND user_nodes.datasetKey = " . $datasetKey;
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
		$insertNodeParentQuery = mysql_query("INSERT INTO node_parents (node, parent, depth) VALUES ('$newNodeKey', '$parentKey', '$depth')") or die ("insert node parent failed: ".mysql_errno());
		
		//finally returns all information of the node just added
		$query = "
		SELECT 	nodes.key, nodes.name, parents.parent as parentKey, parents.depth, nodes.datasetKey, nodes.notes, nodes.brodmannKey
		FROM 	user_nodes nodes 
		LEFT JOIN 
			(SELECT np.node, un.key as parent, np.depth, un.name as parentName 
			FROM node_parents np 
			LEFT JOIN user_nodes un 
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
			$node['brodmannKey'] = $row['brodmannKey'];
		}
	
		echo json_encode($node);
	}
	mysql_close($con);
?>
