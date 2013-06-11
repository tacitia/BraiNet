<? 
	/* this function uses dataset id to 
	retrieve all nodes and links in that dataset */ 
	
    $datasetKey = $_POST['datasetKey'];
    $userID = $_POST['userID'];
    
    $con = mysql_connect("localhost", "tacitia_brainIDC", "Ophelia621");
    if (!$con) {
        die('Could not connect: ' . mysql_error());
    }
    else {
        //echo 'Connection successful' . "\n";
    }

    mysql_select_db("brainconnect_brainData", $con);

	/* Determine if the dataset is cloned or not */
	$query = "SELECT `isClone`, `origin` FROM `user_datasets` WHERE `key` = " . $datasetKey;
	$result = mysql_query($query, $con) or die("SELECT isClone failed: ".mysql_error());
	$isClone = 0;
	$origin = 0;

    while ($row = mysql_fetch_array($result)) {
        $isClone = $row["isClone"];
        $origin = $row["origin"];
    }
    
    /* Get the main data */ 
    $brainData = array();
	
    $nodeTableName = 'user_nodes';
    $linkTableName = 'user_links';
    $parentTableName = 'node_parents';
    
    // Use pubmed tables if the dataset is a system table
    // TODO: populate public_links table and change it here
    if ($datasetKey == 2130 || ($isClone && $origin == 2130)) {
    	$nodeTableName = 'public_nodes';
    	$linkTableName = 'public_links';
    	$parentTableName = 'public_node_parents';
    }
    else if ($datasetKey == 1000002 || ($isClone && $origin == 1000002)) {
    	$nodeTableName = 'public_nodes';
    	$linkTableName = 'pubmed_links';
    	$parentTableName = 'public_node_parents';
    }
    
    $queryDatasetKey = $datasetKey;
    if ($isClone) {
    	$queryDatasetKey = $origin;
    }
    
    $nodes_query = "
    SELECT 	nodes.key, nodes.name, parents.parent as parentKey, 
    		parents.parentName as parentName, parents.depth, nodes.datasetKey, nodes.notes, nodes.brodmannKey
	FROM " . $nodeTableName . " nodes 
	LEFT JOIN 
		(SELECT np.node, un.key as parent, np.depth, un.name as parentName 
		FROM " . $parentTableName . " np 
		LEFT JOIN " . $nodeTableName . " un 
		ON un.key = np.parent) as parents
	ON nodes.key = parents.node WHERE nodes.datasetKey = ".$queryDatasetKey;
        
    $links_query = "SELECT * FROM " .$linkTableName." WHERE datasetKey = ".$queryDatasetKey;
        
    $nodes_result = mysql_query($nodes_query, $con) or die("SELECT nodes failed: ".mysql_error());


    try{
		/* Produce the final nodes and links to be returned */
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
			$link['numPub'] = $row['numPub'];
			$links[] = $link;
		}


		$diff_nodes = array();
		$diff_links = array();
		$extra_nodes = array();
		$extra_links = array();
		if ($isClone) {
			/* Get the difference data*/
			$query = "SELECT `diff` FROM `diff_nodes` WHERE `userID` = " . $userID . " AND `origin` = " . $origin;
			$results = mysql_query($query, $con) or die("SELECT diff node failed: ".mysql_error());
			while ($row = mysql_fetch_array($results)) {
				$diff_node = array();
				$diff_node['nodeKey'] = $row['nodeKey'];
				$diff_node['diff'] = $row['diff'];
				$diff_node['content'] = $row['content'];
				$diff_nodes[] = $diff_node;
			}

			$query = "SELECT `diff` FROM `diff_links` WHERE `userID`  = " . $userID . " AND `origin` = " . $origin;
			$results = mysql_query($query, $con) or die("SELECT diff link failed: ".mysql_error());
			while ($row = mysql_fetch_array($results)) {
				$diff_link = array();
				$diff_link['linkKey'] = $row['linkKey'];
				$diff_link['diff'] = $row['diff'];
				$diff_node['content'] = $row['content'];
				$diff_links[] = $diff_link;
			}
		}
		

		
		$result = array();
		$result['nodes'] = $nodes;
		$result['links'] = $links;
		$result['diff_nodes'] = $diff_nodes;
		$result['diff_links'] = $diff_links;
	    echo json_encode($result);
    
    }catch(Exception $e){
		echo "exception while processing brain data: ",  $e->getMessage(), "\n";
    }
?>
