<?php
$page = 'didacticiel';
$layout = 'day';
$controller = '';

require_once 'bootstrap.php';
require_once 'functions.php';

if(!empty($_GET['p'])) {
    $page = $_GET['p'];
}

$template = $page;

if(!empty($_GET['c'])) {
    $controller = $_GET['c'];
}

// Controller
if(file_exists('Controllers/'.$controller.'/'.$page.'.php')) {
    include 'Controllers/'.$controller.'/'.$page.'.php';
}

include 'Views/theme/'.$layout.'.php';