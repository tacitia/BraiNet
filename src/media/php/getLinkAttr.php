<?  
    $datasetKey = $_POST['datasetKey']; 
   
    $con = mysql_connect("localhost", "tacitia_brainIDC", "Ophelia621");
    if (!$con) {
        die('Could not connect: ' . mysql_error());
    }
    else {
        //echo 'Connection successful' . "\n";
    }

    mysql_select_db("tacitia_brainData", $con);
        
    $query = "SELECT * dataset_attributes WHERE datasetKey = " . $datasetKey;
	
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
?>