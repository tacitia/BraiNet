<? 
    $actionData = $_POST['actionDataArray']; 
    $sessionLength = $_POST['sessionLength'];
    $uid = $_POST['userID'];

    $con = mysql_connect("localhost", "tacitia_brainIDC", "Ophelia621");
    if (!$con) {
        die('Could not connect: ' . mysql_error());
    }
    else {
        echo 'Connection successful' . "\n";
    }

    mysql_select_db("tacitia_brainIDC", $con);
    
    
    mysql_query("
        INSERT INTO General (user_id, duration)
        VALUES ($uid, $sessionLength);
    ", $con);

    echo mysql_error($con) . "\n";
          
    $result = mysql_query("
        SELECT session_id FROM General ORDER BY session_id DESC LIMIT 1;
    ", $con);
    
    echo mysql_error($con) . "\n";
    $sessionId;
    
    while ($row = mysql_fetch_array($result)) {
        $sessionId = $row["session_id"];
    }
                      
    $actionDataLength = count($actionData);
        
    for ($i = 0; $i < $actionDataLength; ++$i) {
        $obj = $actionData[$i];
        $timeElapsed = doubleval($obj["timeElapsed"]);
        $mouseTrace = '\'' . $obj["mouseTrace"] . '\'';
        $actionBasic = '\'' . $obj["actionBasic"] . '\'';
        $actionDetail = '\'' . $obj["actionDetail"] . '\'';
        $time = '\'' . $obj["time"] . '\'';
        mysql_query("
            INSERT INTO Action (session_id, time_elapsed, mouse_trace, action_basic, action_detail, time)
            VALUES ($sessionId, $timeElapsed, $mouseTrace, $actionBasic, $actionDetail, $time);
        ", $con);
    }
 
    echo mysql_error($con) . "\n";
          
    mysql_close($con);

    echo $sessionId;
    echo $actionData;
?>
