<?php

namespace ChefOS\Database;

use PDO;
use PDOException;

class Database {
    private static ?PDO $pdo = null;

    /**
     * Establishes and returns a PDO connection to the MariaDB database.
     * * @return PDO
     * @throws PDOException
     */
    public static function getConnection(): PDO {
        if (self::$pdo === null) {
            // Coolify/Hostinger environment variables
            $host = getenv('MARIADB_URL') ?: '127.00.1';
            $db   = getenv('MARIADB_DATABASE');
            $user = getenv('MARIADB_USER');
            $pass = getenv('MARIADB_PASSWORD');
            $port = getenv('MARIADB_PORT') ?: '3306';

            if (!$db || !$user || !$pass) {
                // This exception should only be hit if running locally without .env or 
                // in an environment where variables are not set.
                throw new PDOException("Database connection parameters missing from environment variables.");
            }

            $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            try {
                self::$pdo = new PDO($dsn, $user, $pass, $options);
            } catch (PDOException $e) {
                throw new PDOException("Connection failed: " . $e->getMessage(), (int)$e->getCode());
            }
        }
        return self::$pdo;
    }
}