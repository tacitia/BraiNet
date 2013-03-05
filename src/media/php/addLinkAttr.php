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

    echo mysql_error($con) . "\n";
    
    mysql_query("INSERT INTO dataset_attributes (datasetKey, attrName, attrType)
VALUES ('$datasetKey', '$attrName', '$attrType')");

	echo mysql_error();

    $query = "SELECT * FROM dataset_attributes WHERE datasetKey = " . $datasetKey .
    " AND attrName = '" . $attrName . "'";
	
	$result = mysql_query($query, $con);
	if(!$result) die("SELECT dataset attributes failed: ".mysql_error());

	$attrs = array(); 
    while ($row = mysql_fetch_array($result)) {
    	$attr = array();
    	$attr['key'] = $row['key'];
        $attr['name'] = $row['attrName'];
        $attr['type'] = $row['attrType'];
        $attrs[] = $attr;
        
    }
	
    echo json_encode($attrs);
    
	mysql_close($con);
?>
