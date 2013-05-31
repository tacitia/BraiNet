<? 
    $datasetName = $_POST['datasetName']; 	/*string*/
    $userID = $_POST['userID'];			/*int*/
    $isClone = $_POST['isClone'];		/*bool*/
    $origDatasetID = $_POST['origDatasetID'];	/*int*/
    
    $con = mysql_connect("localhost", "tacitia_brainIDC", "Ophelia621");
    if (!$con) {
        die('Could not connect: ' . mysql_error());
    }
    else {
        //echo 'Connection successful' . "\n";
    }

    mysql_select_db("brainconnect_brainData", $con);
    
    mysql_query("INSERT INTO user_datasets (name, userID, isClone, origin)
VALUES ('$datasetName', '$userID', '$isClone', '$origDatasetID')");

    $query = "SELECT * FROM user_datasets 
    WHERE name = '" . $datasetName. "' AND userID = " . $userID;

    try{
        	$result = mysql_query($query, $con);
    }catch(Exception $e){
    	    echo 'SQL Query: '.$query;
    	    echo ' caused exception: ',  $e->getMessage(), "\n";
    }

    $datasetID = -1;

    while ($row = mysql_fetch_array($result)) {
        $datasetID = $row["key"];
    }

    echo $datasetID;
    	
	mysql_close($con);
?>
