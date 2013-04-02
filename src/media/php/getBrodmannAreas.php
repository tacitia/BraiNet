<?     
    $con = mysql_connect("localhost", "tacitia_brainIDC", "Ophelia621");
    if (!$con) {
        die('Could not connect: ' . mysql_error());
    }
    else {
        //echo 'Connection successful' . "\n";
    }

    mysql_select_db("tacitia_brainData", $con);
        
    $areas_query = "SELECT * FROM brodmann_areas";
	
	$areas_result = mysql_query($areas_query, $con);
	if(!$areas_result) die("SELECT areas failed: ".mysql_error());

	$areas = array(); 
    while ($row = mysql_fetch_array($areas_result)) {
    
    	$area = array();
        $area['id'] = $row['area_id'];
        $area['name'] = $row['area_name'];
        $areas[] = $area;
    }
	
    echo json_encode($areas);
?>
