<? 
    define('DRUPAL_ROOT', '/home/tacitia/public_html/brain');
    $base_url = 'http://hivizexplorer.com';
    require_once DRUPAL_ROOT . '/includes/bootstrap.inc';
    drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);
    global $user;
    echo($user->uid);
?>
