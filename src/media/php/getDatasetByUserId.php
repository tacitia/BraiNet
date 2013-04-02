<? 
	/* this function returns an array of dataset given a valid user id */ 
	
    $userID = $_POST['userID']; 
    
    $con = mysql_connect("localhost", "tacitia_brainIDC", "Ophelia621");
    if (!$con) {
        die('Could not connect: ' . mysql_error());
    }
    else {
//        echo 'Connection successful' . "\n";
    }

    mysql_select_db("tacitia_brainData", $con);
    
    $query = "SELECT `key`, `name` FROM user_datasets WHERE userID = ".$userID;

    try{
        	$result = mysql_query($query, $con);
    }catch(Exception $e){
    	    echo 'SQL Query: '.$query;
    	    echo ' caused exception: ',  $e->getMessage(), "\n";
    }
    
        
    $datasets = array();
    while ($row= mysql_fetch_row($result)) {
        array_push($datasets, $row);
    }

    echo mysql_error($con) . "\n";

    echo json_encode($datasets);
?>
