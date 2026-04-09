<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Prevent deprecation notices from leaking into HTTP responses.
// PHP 8.5 deprecated PDO::MYSQL_ATTR_SSL_CA; the notice fires when database.php
// is parsed, before any error handler is registered. Errors are still logged.
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
