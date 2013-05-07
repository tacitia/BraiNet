<? 
	/* this function uses dataset id to 
	retrieve all nodes and links in that dataset */ 
	
    $datasetKey = $_POST['datasetKey']; 
    
    $con = mysql_connect("localhost", "tacitia_brainIDC", "Ophelia621");
    if (!$con) {
        die('Could not connect: ' . mysql_error());
    }
    else {
        //echo 'Connection successful' . "\n";
    }

    mysql_select_db("brainconnect_brainData", $con);
    
    $brainData = array();
	
    $nodeTableName = 'user_nodes';
    $linkTableName = 'user_links';
    $parentTableName = 'node_parents';
    
    // Use pubmed tables if the dataset is a system table
    if ($datasetKey == 2130) {
    	$nodeTableName = 'public_nodes';
    	$linkTableName = 'pubmed_links';
    	$parentTableName = 'public_node_parents';
    }
    
    $nodes_query = "
    SELECT 	nodes.key, nodes.name, parents.parent as parentKey, 
    		parents.parentName as parentName, parents.depth, nodes.userID, nodes.datasetKey, nodes.notes, nodes.brodmannKey
	FROM " . $nodeTableName . " nodes 
	LEFT JOIN 
		(SELECT np.node, un.key as parent, np.depth, un.name as parentName 
		FROM " . $parentTableName . " np 
		LEFT JOIN user_nodes un 
		ON un.key = np.parent) as parents
	ON nodes.key = parents.node WHERE nodes.datasetKey = ".$datasetKey;
    
    $links_query = "SELECT * FROM " .$linkTableName." WHERE datasetKey = ".$datasetKey;
    
    //echo $links_query;
    
    $nodes_result = mysql_query($nodes_query, $con) or die("SELECT nodes failed: ".mysql_error());

    try{
		$nodes = array(); 
		while ($row = mysql_fetch_array($nodes_result)) {
			$node = array();
			$node['key'] = $row['key'];
			$node['name'] = $row['name'];
			$node['parentName'] = $row['parentName'];
			$node['parentKey'] = $row['parentKey'];
			$node['depth'] = $row['depth'];
			$node['datasetKey'] = $row['datasetKey'];
			$node['notes'] = $row['notes'];
			$node['brodmannKey'] = $row['brodmannKey'];
			$nodes[] = $node;
			//array_push($nodes, $row);
		}
		
		$links_result = mysql_query($links_query, $con);
		if(!$links_result) die("SELECT links failed: ".mysql_error());
		
		$links = array(); 
		while ($row = mysql_fetch_array($links_result)) {
		
			$link = array();
			$link['key'] = $row['key'];
			$link['sourceKey'] = $row['sourceKey'];
			$link['targetKey'] = $row['targetKey'];
			$link['datasetKey'] = $row['datasetKey'];
			$link['notes'] = $row['notes'];
			$links[] = $link;
			//array_push($links, $row);
		}
		
		$result = array();
		$result['nodes'] = $nodes;
		$result['links'] = $links;
	    echo json_encode($result);
    
    }catch(Exception $e){
		echo "exception while processing brain data: ",  $e->getMessage(), "\n";
    }
?>
