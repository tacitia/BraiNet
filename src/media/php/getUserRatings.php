<? 
    $dsn = "mysql:host=localhost;dbname=tacitia_hiviz";
    $username = "tacitia_hiviz";
    $password = "48278059";

    $pdo = new PDO($dsn, $username, $password);

    echo $pdo.errorInfo();
    
    link_ratings = array();
    if (isset($_GET['linkId'])) {
        $stmt = $pdo->prepare("SELECT * FROM user_ratings WHERE user_id = ?");
    }
?>
