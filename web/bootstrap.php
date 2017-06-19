<?php
// bootstrap.php
// Include Composer Autoload (relative to project root).

$loader = require 'vendor/autoload.php';

require_once "vendor/autoload.php";

use Doctrine\ORM\Tools\Setup;
use Doctrine\ORM\EntityManager;

// the connection configuration
$dbParams = array(
    'host'     => '127.0.0.1',
    'port'     => '3307',
    'driver'   => 'pdo_mysql',
    'user'     => 'root',
    'password' => '',
    'dbname'   => 'francetv360',
);


$config = Setup::createYAMLMetadataConfiguration(["mappings/"], /* isDevMode*/ true);

$entityManager = EntityManager::create($dbParams, $config);