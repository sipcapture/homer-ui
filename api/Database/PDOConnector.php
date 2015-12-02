<?php

/*
 * HOMER API Engine
 *
 * Copyright (C) 2011-2015 Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Copyright (C) 2011-2015 Lorenzo Mangani <lorenzo.mangani@gmail.com> QXIP B.V.
 *
 * The Initial Developers of the Original Code are
 *
 * Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Lorenzo Mangani <lorenzo.mangani@gmail.com> QXIP B.V.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
*/

namespace Database;

defined( '_HOMEREXEC' ) or die( 'Restricted access' );

use \PDO;

class PDOConnector extends DefaultConnector {
	private $hostname;		//Database server LOCATION
	private $port;			//Database PORT default MYSQL
	private $dbname;		//Database NAME
	private $username;		//Database USERNAME
	private $password;		//Database PASSWORD

	//encryption
	private $encrypt = true;	//set to true to use md5 encryption for the password

	/* CONNECT */
	protected $connection;		//Our connection
	protected $resultCount;		//number of rows affected by a query. 

        function __construct($connect = 0, $host = DB_HOSTNAME, $port = DB_PORT, $db = DB_CONFIGURATION, $username = DB_USERNAME, $password = DB_PASSWORD) {
	    $this->hostname = $host;
	    $this->port = $port;
	    $this->dbname = $db;
	    $this->username = $username;
	    $this->password = $password;
	    if($connect == 1) {
		$this->dbconnect();
	    }
	}

	function select_db($db) {
	    $this->dbname = $db;
	    return true;
	}

	function dbconnect() {
	    try {
		$dbstring = DATABASE_DRIVER.":host=".$this->hostname. (($this->port) ? ";port=".$this->port : "" ) . ";dbname=".$this->dbname;
		$this->connection = new PDO($dbstring, $this->username, $this->password);
		$this->executeQuery('SET time_zone = "+00:00";');
	    } catch (PDOException $e){
		die($e->getMessage());
	    }
	    return;
	}

	//connect to database
	function dbconnect_node($node) {
		$host = isset ($node['host']) ? $node['host'] : $this->hostname;
		$dbname = isset ($node['dbname']) ? $node['dbname'] : NULL;
		$dbusername = isset ($node['dbusername']) ? $node['dbusername'] : $this->username;
		$dbpassword = isset ($node['dbpassword']) ? $node['dbpassword'] : $this->password;
		$dbport = isset ($node['dbport']) ? $node['dbport'] : NULL;

		if(!$host) $host = $this->hostname;

		try {
			$dbstring = DATABASE_DRIVER.":host=".$host.(($dbport) ? ";port=".$dbport : "" ).";dbname=".$dbname;
			$this->connection = new PDO($dbstring, $dbusername, $dbpassword);
			$this->executeQuery('SET time_zone = "+00:00";');

		} catch (PDOException $e){
			try {
				// if connection is not establish, use HOMER_HOSTNAME from configuration.php
				$host = $this->hostname;
				$dbstring = DATABASE_DRIVER.":host=".$host.(($this->port) ? ";port=".$this->port : "" ).";dbname=".$this->database;
				$this->connection = new PDO($dbstring, $this->username, $this->password);
			} catch (PDOException $e){
				die($e->getMessage());
			}
		}

		return true;
	}

	//prevent injection
	function qry($query) {
	    $this->dbconnect();
	    $args  = func_get_args();
	    $query = array_shift($args);
	    $query = str_replace("?", "%s", $query);

	    if (DATABASE_DRIVER == 'pgsql') $query = $this->toPgSql($query);
	    if (property_exists($this->connection, 'quote')) $args  = array_map($this->connection->quote, $args);
	    array_unshift($args,$query);

	    $query = call_user_func_array('sprintf', $args);

	    $statement = $this->connection->prepare($query);
	    $statement->execute();
	    $this->resultCount = $statement->rowCount();
	    $result = $statement->fetch();

	    if ($result){ 
		return $result;
	    } else {
		$error = "Error";
		return $result;
	    }
	}

	//prevent injection
	function makeQuery($query) {
	    $this->dbconnect();
	    $args  = func_get_args();
	    $query = array_shift($args);
	    $query = str_replace("?", "%s", $query);
	    if(DATABASE_DRIVER == 'pgsql') $query = $this->toPgSql($query);
	    if (property_exists($this->connection, 'quote')) $args  = array_map($this->connection->quote, $args);

	    array_unshift($args,$query);
	    $query = call_user_func_array('sprintf',$args);
	    return $query;
	}

	function executeQuery($query) {
		//$result = mysql_query($query);
		if(DATABASE_DRIVER == 'pgsql') $query = $this->toPgSql($query);
		$statement = $this->connection->prepare($query);
		if($statement->execute()) {
		    $this->resultCount = $statement->rowCount();
		    return true;
		} else {
		    error_log("Fail to execute query: [".$query."]");
		    error_log(print_r($statement->errorInfo(), true));
		    return false;
		}
	}

	function loadObjectList($query) {
	    if(DATABASE_DRIVER == 'pgsql') $query = $this->toPgSql($query);
	    $statement = $this->connection->prepare($query);
            if($statement->execute()) {
		$this->resultCount = $statement->rowCount();
		$result = $statement->fetchAll(PDO::FETCH_CLASS);
		return $result;
            } else {
		error_log("Fail to execute query: [".$query."]");
		error_log(print_r($statement->errorInfo(), true));
		$result = array();
            }
	}

	function loadObjectArray($query) 
	{
	    if(DATABASE_DRIVER == 'pgsql') $query = $this->toPgSql($query);
	    $statement = $this->connection->prepare($query);
	    if($statement->execute()) {
		$this->resultCount = $statement->rowCount();
		$result = $statement->fetchAll(PDO::FETCH_ASSOC);
            } else {
		error_log("Fail to execute query: [".$query."]");
		error_log(print_r($statement->errorInfo(), true));
		$result = array();
            }
	    return $result;
	}

	function toPgSql($query) {
	    $query = str_replace("`", '"', $query);
	    return preg_replace('/[Ll][Ii][Mm][Ii][Tt]\s+([0-9]+)\s*,\s*([0-9]+)/', ' LIMIT ${2} OFFSET ${1}', $query);
	}

	function loadResult($query) {
	    if (DATABASE_DRIVER == 'pgsql') $query = $this->toPgSql($query);

	    $statement = $this->connection->prepare($query);
	    if($statement->execute()) {
		$this->resultCount = $statement->rowCount();
		$result = $statement->fetch(PDO::FETCH_NUM);
		return $result[0];
	    } else {
		error_log("Fail to execute query: [".$query."]");
		error_log(print_r($statement->errorInfo(), true));
	    }
	}

	function getResultCount() {
	    return $this->resultCount;
	}

	function getLastId() {
	    return $this->connection->lastInsertId();
	}

	function quote($val) {
	    return $this->connection->quote($val);
	}

	function custom_sql_escape($inp) {
	    if (is_array($inp)) return array_map(__METHOD__, $inp);

	    if (!empty($inp) && is_string($inp)) {
                      return str_replace(array('\\', "\0", "\n", "\r", "'", '"', "\x1a"), array('\\\\', '\\0', '\\n', '\\r', "\\'", '\\"', '\\Z'), $inp);
	    }

	    return $inp;
	}
}

?>
