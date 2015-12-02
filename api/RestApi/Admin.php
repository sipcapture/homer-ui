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

namespace RestApi;

class Admin {
    
    protected $_instance = array();
   
    private $authmodule = true;

    function __construct()
    {

    }

    /**
    * Checks if a user is logged in.
    *
    * @return boolean
    */
    public function getLoggedIn(){

	$answer = array();

	if($this->authmodule == false) return $answer;

        if(!$this->getContainer('auth')->checkSession())
	{
		$answer['sid'] = session_id();
                $answer['auth'] = 'false';
                $answer['status'] = 403;
                $answer['message'] = 'bad session';
                $answer['data'] = array();
                
                return $answer;
	}	
	else if(!$this->getContainer('auth')->checkAdmin())
	{
		$answer['sid'] = session_id();
                $answer['auth'] = 'false';
                $answer['status'] = 401;
                $answer['message'] = 'need admin';
                $answer['data'] = array();
                
                return $answer;
	}
	else return $answer;
    }
    
    public function getUser($raw_get_data){
    
	/* auth */
        if(count(($adata = $this->getLoggedIn()))) return $adata;                

        /* get our DB */
        $db = $this->getContainer('db');
        $db->select_db(DB_CONFIGURATION);
        $db->dbconnect();
                         
        $data = array();
        
        $table = "user";            
        $query = "SELECT uid,gid,username,grp,firstname,lastname,email, department, regdate, lastvisit, active FROM ".$table." order by uid DESC;";
        $query  = $db->makeQuery($query);                
        $data = $db->loadObjectArray($query);

        $answer = array();          
                
        if(empty($data)) {
        
                $answer['sid'] = session_id();
                $answer['auth'] = 'true';             
                $answer['status'] = 200;                
                $answer['message'] = 'no data';                             
                $answer['data'] = $data;
                $answer['count'] = count($data);
        }                
        else {
                $answer['status'] = 200;
                $answer['sid'] = session_id();
                $answer['auth'] = 'true';             
                $answer['message'] = 'ok';                             
                $answer['data'] = $data;
                $answer['count'] = count($data);
        }
        
        return $answer;
    }
    
        
    public function doNewUser($param){
    
	/* auth */
        if(count(($adata = $this->getLoggedIn()))) return $adata;                

        /* get our DB */
        $db = $this->getContainer('db');
        $db->select_db(DB_CONFIGURATION);
        $db->dbconnect();
                         
        $data = array();

        $search = array();
        $callwhere = array();
        $calldata = array();
        $arrwhere = "";
        
        $update['active'] = getVar('active', true, $param, 'bool');
        $update['department'] = getVar('department', '', $param, 'string');
        $update['email'] = getVar('email', '', $param, 'string');
        $update['firstname'] = getVar('firstname', '', $param, 'string');        
        $update['lastname'] = getVar('lastname', '', $param, 'string');        
        $update['grp'] = getVar('grp', 'users', $param, 'string');        
        $update['username'] = getVar('username', '', $param, 'string');              
        $update['gid'] = getVar('gid', 10, $param, 'int');              
        $update['lastvisit'] = getVar('lastvisit', date_format(date_create(), 'Y-m-d H:i:s'), $param, 'string');
        $password = getVar('password', '', $param, 'string');
          
        $exten = "";
        $callwhere = generateWhere($update, 1, $db, 0);
        if(count($callwhere)) {
                $exten = "`password` = PASSWORD('".$password."'),";        
                $exten .= implode(", ", $callwhere);                
        }
                              
        $table = "user";            
        $query = "INSERT INTO ".$table." SET ".$exten;        
        $db->executeQuery($query);        
        
        $uid = $db->getLastId();             
        
        $answer = $this->getUser("");
        
        return $answer;
    }


    public function doEditUser($param){
    
	/* auth */
        if(count(($adata = $this->getLoggedIn()))) return $adata;                

        /* get our DB */
        $db = $this->getContainer('db');
        $db->select_db(DB_CONFIGURATION);
        $db->dbconnect();
                         
        $data = array();

        $search = array();
        $callwhere = array();
        $calldata = array();
        $arrwhere = "";
                
        $update['active'] = getVar('active', true, $param, 'bool');
        $update['department'] = getVar('department', '', $param, 'string');
        $update['email'] = getVar('email', '', $param, 'string');
        $update['firstname'] = getVar('firstname', '', $param, 'string');        
        $update['lastname'] = getVar('lastname', '', $param, 'string');        
        $update['grp'] = getVar('grp', 'users', $param, 'string');        
        $update['username'] = getVar('username', '', $param, 'string'); 
        $update['gid'] = getVar('gid', 10, $param, 'int');                           
        $password = getVar('password', '', $param, 'string');            
        $uid = getVar('uid', 0, $param, 'int');            
          
        $exten = "";
        $callwhere = generateWhere($update, 1, $db, 0);
        if(count($callwhere)) {
                if(strlen($password) > 0) $exten = "`password` = PASSWORD('".$password."'),";        
                $exten .= implode(", ", $callwhere);                
        }
                              
        $table = "user";            
        $query = "UPDATE ".$table." SET ".$exten. " WHERE uid=".$uid;        
        $db->executeQuery($query);        
        
        $answer = $this->getUser("");        
        return $answer;
    }
    
    public function deleteUser($id){
    
	/* auth */
        if(count(($adata = $this->getLoggedIn()))) return $adata;                

        /* get our DB */
        $db = $this->getContainer('db');
        $db->select_db(DB_CONFIGURATION);
        $db->dbconnect();
                         
        $data = array();

        $search = array();
        $callwhere = array();
        $calldata = array();
        $arrwhere = "";
        
        $query = "DELETE FROM user WHERE uid=".$id;
        $db->executeQuery($query);

        $answer = $this->getUser("");                
        return $answer;
    }

    /* ALIAS */

    public function getAlias($raw_get_data){
    
	/* auth */
        if(count(($adata = $this->getLoggedIn()))) return $adata;                

        /* get our DB */
        $db = $this->getContainer('db');
        $db->select_db(DB_CONFIGURATION);
        $db->dbconnect();
                         
        $data = array();
        
        $table = "alias";            
        $query = "SELECT id,gid,ip,port,capture_id,alias,status,created FROM ".$table." order by id DESC;";
        $query  = $db->makeQuery($query);                
        $data = $db->loadObjectArray($query);

        $answer = array();          
                
        if(empty($data)) {
        
                $answer['sid'] = session_id();
                $answer['auth'] = 'true';             
                $answer['status'] = 200;                
                $answer['message'] = 'no data';                             
                $answer['data'] = $data;
                $answer['count'] = count($data);
        }                
        else {
                $answer['status'] = 200;
                $answer['sid'] = session_id();
                $answer['auth'] = 'true';             
                $answer['message'] = 'ok';                             
                $answer['data'] = $data;
                $answer['count'] = count($data);
        }
        
        return $answer;
    }
    
        
    public function doNewAlias($param){
    
	/* auth */
        if(count(($adata = $this->getLoggedIn()))) return $adata;                

        /* get our DB */
        $db = $this->getContainer('db');
        $db->select_db(DB_CONFIGURATION);
        $db->dbconnect();
                         
        $data = array();

        $search = array();
        $callwhere = array();
        $calldata = array();
        $arrwhere = "";
        
        $update['status'] = getVar('status', true, $param, 'bool');
        $update['ip'] = getVar('ip', '', $param, 'string');
        $update['port'] = getVar('port', 0, $param, 'int');
        $update['capture_id'] = getVar('capture_id', '', $param, 'string');
        $update['alias'] = getVar('alias', '', $param, 'string');        
        $update['gid'] = getVar('gid', 10, $param, 'int');              
          
        $exten = "";
        $callwhere = generateWhere($update, 1, $db, 0);
        if(count($callwhere)) {
                $exten .= implode(", ", $callwhere);                
        }
                              
        $table = "alias";            
        $query = "INSERT INTO ".$table." SET ".$exten;        
        $db->executeQuery($query);        
        
        $uid = $db->getLastId();             
        
        $answer = $this->getAlias("");
        
        return $answer;
    }


    public function doEditAlias($param){
    
	/* auth */
        if(count(($adata = $this->getLoggedIn()))) return $adata;                

        /* get our DB */
        $db = $this->getContainer('db');
        $db->select_db(DB_CONFIGURATION);
        $db->dbconnect();
                         
        $data = array();

        $search = array();
        $callwhere = array();
        $calldata = array();
        $arrwhere = "";
    
        $update['status'] = getVar('status', true, $param, 'bool');
        $update['ip'] = getVar('ip', '', $param, 'string');
        $update['port'] = getVar('port', 0, $param, 'int');
        $update['capture_id'] = getVar('capture_id', '', $param, 'string');
        $update['alias'] = getVar('alias', '', $param, 'string');        
        $update['gid'] = getVar('gid', 10, $param, 'int');                  
        $id = getVar('id', 0, $param, 'int');            
          
        $exten = "";
        $callwhere = generateWhere($update, 1, $db, 0);
        if(count($callwhere)) {
                $exten .= implode(", ", $callwhere);                
        }
                              
        $table = "alias";            
        $query = "UPDATE ".$table." SET ".$exten. " WHERE id=".$id;        
        $db->executeQuery($query);        
        
        $answer = $this->getAlias("");        
        return $answer;
    }
    
    public function deleteAlias($id){
    
	/* auth */
        if(count(($adata = $this->getLoggedIn()))) return $adata;                

        /* get our DB */
        $db = $this->getContainer('db');
        $db->select_db(DB_CONFIGURATION);
        $db->dbconnect();
                         
        $data = array();

        $search = array();
        $callwhere = array();
        $calldata = array();
        $arrwhere = "";
        
        $query = "DELETE FROM alias WHERE id=".$id;
        $db->executeQuery($query);

        $answer = $this->getAlias("");                
        return $answer;
    }


    /* Host */

    public function getNode($raw_get_data){
    
	/* auth */
        if(count(($adata = $this->getLoggedIn()))) return $adata;                

        /* get our DB */
        $db = $this->getContainer('db');
        $db->select_db(DB_CONFIGURATION);
        $db->dbconnect();
                         
        $data = array();
        
        $table = "node";            
        $query = "SELECT id, host, dbname, dbport, dbusername, dbpassword, dbtables, name, status FROM ".$table." order by id DESC;";
        $query  = $db->makeQuery($query);                
        $data = $db->loadObjectArray($query);

        $answer = array();          
                
        if(empty($data)) {
        
                $answer['sid'] = session_id();
                $answer['auth'] = 'true';             
                $answer['status'] = 200;                
                $answer['message'] = 'no data';                             
                $answer['data'] = $data;
                $answer['count'] = count($data);
        }                
        else {
                $answer['status'] = 200;
                $answer['sid'] = session_id();
                $answer['auth'] = 'true';             
                $answer['message'] = 'ok';                             
                $answer['data'] = $data;
                $answer['count'] = count($data);
        }
        
        return $answer;
    }
    
        
    public function doNewNode($param){
    
	/* auth */
        if(count(($adata = $this->getLoggedIn()))) return $adata;                

        /* get our DB */
        $db = $this->getContainer('db');
        $db->select_db(DB_CONFIGURATION);
        $db->dbconnect();
                         
        $data = array();

        $search = array();
        $callwhere = array();
        $calldata = array();
        $arrwhere = "";
        
        $update['status'] = getVar('status', true, $param, 'bool');
        $update['host'] = getVar('host', '127.0.0.1', $param, 'string');
        $update['dbname'] = getVar('dbname', 'homer_data', $param, 'string');        
        $update['dbport'] = getVar('dbport', 3306, $param, 'int');
        $update['dbusername'] = getVar('dbusername', 'homer_user', $param, 'string');
        $update['dbpassword'] = getVar('dbpassword', '', $param, 'string');        
        $update['dbtables'] = getVar('dbtables', '', $param, 'string');        
        $update['name'] = getVar('name', '', $param, 'string');        
          
        $exten = "";
        $callwhere = generateWhere($update, 1, $db, 0);
        if(count($callwhere)) {
                $exten .= implode(", ", $callwhere);                
        }
                              
        $table = "node";            
        $query = "INSERT INTO ".$table." SET ".$exten;        
        $db->executeQuery($query);        
        
        $uid = $db->getLastId();             
        
        $answer = $this->getNode("");
        
        return $answer;
    }


    public function doEditNode($param){
    
	/* auth */
        if(count(($adata = $this->getLoggedIn()))) return $adata;                

        /* get our DB */
        $db = $this->getContainer('db');
        $db->select_db(DB_CONFIGURATION);
        $db->dbconnect();
                         
        $data = array();

        $search = array();
        $callwhere = array();
        $calldata = array();
        $arrwhere = "";

        $update['status'] = getVar('status', true, $param, 'bool');
        $update['host'] = getVar('host', '127.0.0.1', $param, 'string');
        $update['dbname'] = getVar('dbname', 'homer_data', $param, 'string');        
        $update['dbport'] = getVar('dbport', 3306, $param, 'int');
        $update['dbusername'] = getVar('dbusername', 'homer_user', $param, 'string');
        $update['dbpassword'] = getVar('dbpassword', '', $param, 'string');        
        $update['dbtables'] = getVar('dbtables', '', $param, 'string');        
        $update['name'] = getVar('name', '', $param, 'string');            
        $id = getVar('id', 0, $param, 'int');            
          
        $exten = "";
        $callwhere = generateWhere($update, 1, $db, 0);
        if(count($callwhere)) {
                $exten .= implode(", ", $callwhere);                
        }
                              
        $table = "node";            
        $query = "UPDATE ".$table." SET ".$exten. " WHERE id=".$id;        
        $db->executeQuery($query);        
        
        $answer = $this->getNode("");        
        return $answer;
    }
    
    public function deleteNode($id){
    
	/* auth */
        if(count(($adata = $this->getLoggedIn()))) return $adata;                

        /* get our DB */
        $db = $this->getContainer('db');
        $db->select_db(DB_CONFIGURATION);
        $db->dbconnect();
                         
        $data = array();

        $search = array();
        $callwhere = array();
        $calldata = array();
        $arrwhere = "";
        
        $query = "DELETE FROM node WHERE id=".$id;
        $db->executeQuery($query);

        $answer = $this->getNode("");                
        return $answer;
    }


    /*************************************************************/


    
    public function getAdminData($raw_get_data){
    
        $timestamp = $raw_get_data['timestamp'];
        $param = $raw_get_data['param'];

        return doAdminData($timestamp, $param);
    }

    /* api: statistic/ip */
    
    
    public function getContainer($name)
    {
        if (!$this->_instance || !isset($this->_instance[$name]) || $this->_instance[$name] === null) {
            //$config = \Config::factory('configs/config.ini', APPLICATION_ENV, 'auth');
            if($name == "auth") $containerClass = sprintf("Authentication\\".AUTHENTICATION);
            else if($name == "db") $containerClass = sprintf("Database\\".DATABASE_CONNECTOR);            
            $this->_instance[$name] = new $containerClass();
        }
        return $this->_instance[$name];
    }

    /**
     * @param string $server
     * @url stats/([0-9]+)
     * @url stats
     * @return string
     */
    public function getStats($server = '1'){
        return $this->getServerStats($server);
    }
    
    
    public function pcapCheckSum($data) {

	if( strlen($data)%2 ) $data .= "\x00";
	$bit = unpack('n*', $data);
	$sum = array_sum($bit);
	while ($sum >> 16) $sum = ($sum >> 16) + ($sum & 0xffff);
	$sum = ~$sum;
	$sum = $sum & 0xffff;
	return $sum;    

    } 
    
}

?>
