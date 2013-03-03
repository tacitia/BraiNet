<? 
    $nodeKey = $_POST['nodeKey'];			/*int*/
    
    $con = mysql_connect("localhost", "tacitia_brainIDC", "Ophelia621");
    if (!$con) {
        die('Could not connect: ' . mysql_error());
    }
    else {
        //echo 'Connection successful' . "\n";
    }

    mysql_select_db("tacitia_brainData", $con);

    echo mysql_error($con) . "\n";   
    
    //make data safe before sending it to SQL
    //may not need it here since nodeKey is an int
    //$nodeKey = mysql_real_escape_string($nodeKey);
    
    //If the node to be deleted is a parent node
    //need to delete all children nodes, 
    //but right now, we just update all immediate child parent and set it to -1
    //also need to delete all links associated with the node

    mysql_query("UPDATE user_nodes SET parent = -1 WHERE parent = ".$nodeKey) or customDie("/error");;
    mysql_query("DELETE FROM user_nodes WHERE key = ".$nodeKey) or customDie("/error");;
    mysql_query("DELETE FROM user_links WHERE sourceKey = ".$nodeKey." OR targetKey = ".$targetKey) or customDie("/error");

	mysql_close($con);
?>