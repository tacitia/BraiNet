<? #Tested for v3.0 under clone condition#
    $datasetName = "'" . $_POST['datasetName'] . "'"; 	/*string*/
    $userID = "'" . $_POST['userID'] . "'";			/*string*/
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
    
    mysql_query("INSERT INTO datasets (name, userID, isClone, origin, type)
VALUES ($datasetName, $userID, $isClone, $origDatasetID, 'private')") or die ("insert dataset failed: ".mysql_errno());

    $query = "SELECT * FROM datasets 
    WHERE name = " . $datasetName. " AND userID = " . $userID;
    
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
