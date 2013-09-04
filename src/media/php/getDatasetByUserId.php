<? #Tested in v3.0#
	/* this function returns an array of dataset given a valid user id */ 
	
    $userID = $_POST['userID']; 
    
    $con = mysql_connect("localhost", "tacitia_brainIDC", "Ophelia621");
    if (!$con) {
        die('Could not connect: ' . mysql_error());
    }
    else {
//        echo 'Connection successful' . "\n";
    }

    mysql_select_db("brainconnect_brainData", $con);
    
    $query = "SELECT `key`, `name`, `isClone`, `origin` FROM user_datasets WHERE userID = '" . $userID . "'";
    
    try{
        	$result = mysql_query($query, $con);
    }catch(Exception $e){
    	    echo 'SQL Query: '.$query;
    	    echo ' caused exception: ',  $e->getMessage(), "\n";
    }
    
        
    $datasets = array();
    while ($row= mysql_fetch_array($result)) {
    	$record = array();
    	$record['key'] = $row['key'];
    	$record['name'] = $row['name'];
    	$record['isClone'] = $row['isClone'];
    	$record['origin'] = $row['origin'];
    	$record['isCustom'] = 1 - $row['isClone'];
    	$datasets[] = $record;
    }

    echo mysql_error($con) . "\n";

    echo json_encode($datasets);
?>
