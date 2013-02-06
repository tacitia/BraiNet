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

    mysql_select_db("tacitia_brainData", $con);
    
    $brainData = array();

    $nodeTableName = 'user_nodes';
    $linkTableName = 'user_links';
    
    //select un1.*, un2.name as parent from user_nodes un1 left join user_nodes un2 on un1.parent = un2.key
    $nodes_query = "SELECT un1.*, un2.key as parentKey, un2.name as parent FROM ".$nodeTableName.
    " un1 LEFT JOIN user_nodes un2 ON un1.parent = un2.key WHERE un1.datasetKey = ".$datasetKey;    
    
    $links_query = "SELECT * FROM " .$linkTableName." WHERE datasetKey = ".$datasetKey;
    
    //echo $links_query;
    
    $nodes_result = mysql_query($nodes_query, $con);
    
    if(!$nodes_result) die("SELECT nodes failed: ".mysql_error());
    //echo mysql_error($con). "\n";
    
	$nodes = array(); 
    while ($row = mysql_fetch_array($nodes_result)) {
    	$node = array();
    	$node['key'] = $row['key'];
    	$node['name'] = $row['name'];
        $node['parentName'] = $row['parent'];
        $node['parentKey'] = $row['parentKey'];
    	$node['depth'] = $row['depth'];
        $node['datasetKey'] = $row['datasetKey'];
        
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
        
        $links[] = $link;
        //array_push($links, $row);
    }
    

    $result = array();
	$result['nodes'] = $nodes;
	$result['links'] = $links;
	
    echo json_encode($result);
?>
