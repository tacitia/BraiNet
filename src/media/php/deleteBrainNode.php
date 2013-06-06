<? 
    $nodeKey = $_POST['nodeKey'];			/*int*/
    $isClone = $_POST['isClone'];
    $origin = $_POST['origin'];
    $userID = $_POST['userID'];
    
    $con = mysql_connect("localhost", "tacitia_brainIDC", "Ophelia621");
    if (!$con) {
        die('Could not connect: ' . mysql_error());
    }
    else {
        //echo 'Connection successful' . "\n";
    }

    mysql_select_db("brainconnect_brainData", $con);

    echo mysql_error($con) . "\n";   
    
    //make data safe before sending it to SQL
    //may not need it here since nodeKey is an int
    //$nodeKey = mysql_real_escape_string($nodeKey);
    
    //If the node to be deleted is a parent node
    //need to delete all children nodes, 
    //but right now, we just update all immediate child parent and set it to -1
    //also need to delete all links associated with the node

	echo $nodeKey;
	echo $userID;
	
	if ($isClone) {
		mysql_query("INSERT INTO diff_nodes (nodeKey, diff, userID, origin) VALUES ('$nodeKey', 'Delete', '$userID', '$origin')") or die("an error occurred when deleting cloned node");
	}
	else {
    	mysql_query("UPDATE node_parents SET parent = -1 WHERE parent = ".$nodeKey) or die("an error occured when updating parent");
    	mysql_query("DELETE FROM user_nodes WHERE key = " . $nodeKey) or die("an error occured when deleting node");
    	mysql_query("DELETE FROM user_links WHERE sourceKey = ".$nodeKey." OR targetKey = ".$nodeKey) or die("an error occured when deleting node's links");
    }
    
    echo mysql_error($con);

	mysql_close($con);
?>