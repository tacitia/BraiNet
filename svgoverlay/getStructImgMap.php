<? 
	/* this function retrieves the mapping between structures and section images (for allen brain institute)*/
	    
    $con = mysql_connect("localhost", "tacitia_brainIDC", "Ophelia621");
    if (!$con) {
        die('Could not connect: ' . mysql_error());
    }
    else {
        //echo 'Connection successful' . "\n";
    }

    mysql_select_db("brainconnect_brainData", $con);
    
    $query = "SELECT * FROM allen_struct_image;";

    try{
		$map = array(); 
		
		$result = mysql_query($query, $con);
		if(!$result) die("SELECT failed: ".mysql_error());
		
		while ($row = mysql_fetch_array($result)) {		
			$record = array();
			$link['structKey'] = $row['structKey'];
			$link['imageKey'] = $row['imageKey'];
			$map[] = $record;
		}
		
	    echo json_encode($result);
    
    }catch(Exception $e){
		echo "exception while processing brain data: ",  $e->getMessage(), "\n";
    }
?>
