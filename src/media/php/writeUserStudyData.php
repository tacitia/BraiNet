<? 
    $extWorkData = $_POST['extWorkDataArray']; 
    $sessionLength = $_POST['sessionLength'];

    $con = mysql_connect("localhost", "tacitia_usrStdy", "48278059");
    if (!$con) {
        die('Could not connect: ' . mysql_error());
    }
    else {
        echo 'Connection successful' . "\n";
    }

    mysql_select_db("tacitia_userStudy", $con);
    
    
    mysql_query("
        INSERT INTO General (duration, interface_type, is_pilot)
        VALUES ($sessionLength, 1, 1);
    ", $con);

    echo mysql_error($con) . "\n";
          
    $result = mysql_query("
        SELECT session_id FROM General ORDER BY session_id DESC LIMIT 1;
    ", $con);
    
    echo mysql_error($con) . "\n";
    $sessionId;
    
    while ($row = mysql_fetch_array($result)) {
        echo $row;
        var_dump($row);
        $sessionId = $row["session_id"];
    }
                      
    $extWorkDataLength = count($extWorkData);
        
    for ($i = 0; $i < $extWorkDataLength; ++$i) {
        $obj = $extWorkData[$i];
        $length = intval($obj["extWorkLength"]);
        $mouseTrace = '\'' . $obj["mouseTrace"] . '\'';
        $recoveryTime = intval($obj["recoveryTime"]);
        mysql_query("
            INSERT INTO ExternalWorkData (session_id, external_work_time, mouse_trajectory, recovery_time, is_pilot)
            VALUES ($sessionId, $length, $mouseTrace, $recoveryTime, 1);
        ", $con);
    }
 
    echo mysql_error($con) . "\n";
          
    mysql_close($con);
?>