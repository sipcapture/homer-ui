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

namespace RestAPI;

class Profile {
    
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
        }

        return $answer;
    }


    public function getProfile(){
        
        //if (!is_string($json)) $json = json_encode($json);                                

        if(count(($adata = $this->getLoggedIn()))) return $adata;        
	
	$json = "";
	$uid = $_SESSION['uid'];     
	$bigobj = array();
	
        if(PROFILE_STORE == "file") {

	        $dar = PROFILE_PARAM."/".$uid.".json";	
        	if(file_exists($dar)) 
        	{	
        	    $myfile = fopen($dar, "r") or die("Unable to open file!");
        	    $json =  fread($myfile, filesize($dar));
        	    //$json = json_decode($text, true);	
        	    fclose($myfile);		
                }
        	
                $bigobj = json_decode($json);	
        }        
        else if(PROFILE_STORE == "db") {
                   
                 /* get our DB */
                 $db = $this->getContainer('db');
                 $db->dbconnect();

        	 $query = "SELECT param_name, param_value FROM setting WHERE uid='?' limit 200";
        	 $query  = $db->makeQuery($query, $uid);
                 $rows = $db->loadObjectArray($query);
		 foreach($rows as $row) {
		      $name = $row["param_name"];
		      $value = $row["param_value"];
		      $bigobj[$name] =  $value;
                 }
        }

        return $bigobj;
    }
    
    public function getIdProfile($id){
        
	if(count(($adata = $this->getLoggedIn()))) return $adata;	
	$json = "";
	$uid = $_SESSION['uid'];     
	$bigobj = array();
	
        if(PROFILE_STORE == "file") {

	        $dar = PROFILE_PARAM."/".$uid.".json";	
        	if(file_exists($dar)) 
        	{	
        	    $myfile = fopen($dar, "r") or die("Unable to open file!");
        	    $json =  fread($myfile, filesize($dar));
        	    //$json = json_decode($text, true);	
        	    fclose($myfile);		
                }
        	
                $obj = json_decode($json);	
                $bigobj = $obj[$id];                                
        }        
        else if(PROFILE_STORE == "db") {
                   
                 /* get our DB */
                 $db = $this->getContainer('db');
                 $db->dbconnect();

        	 $query = "SELECT param_name, param_value FROM setting WHERE uid='?' AND param_name = '?' limit 200";
        	 $query  = $db->makeQuery($query, $uid, $id);
                 $rows = $db->loadObjectArray($query);
		 foreach($rows as $row) $bigobj[$row->param_name] =  $row->param_value;		 		 
        }

        return $bigobj;
    }
        
    public function postIdProfile($id, $param){
        

        if(count(($adata = $this->getLoggedIn()))) return $adata;        
	
	$json = "";
	$uid = $_SESSION['uid'];     
	
        if(PROFILE_STORE == "file") {

	        $dar = PROFILE_PARAM."/".$uid.".json";	
        	if(file_exists($dar)) 
        	{	
        	    $myfile = fopen($dar, "r") or die("Unable to open file!");
        	    $json =  fread($myfile, filesize($dar));
        	    //$json = json_decode($text, true);	
        	    fclose($myfile);		
                }
        	
                $bigobj = json_decode($json, true);	
        	$bigobj[$id] = $param;
        	$json = json_encode($bigobj, true);
                $myfile = fopen($dar, "w") or die("Unable to open file!");
                fwrite($myfile, $json);
                fclose($myfile);		        
        }        
        else if(PROFILE_STORE == "db") {
                   
                 /* get our DB */
                 $db = $this->getContainer('db');
                 $db->dbconnect();

                 if($id == "search") $json = json_encode($param, JSON_FORCE_OBJECT);
                 else $json = json_encode($param);
                 
        	 $query = "INSERT INTO setting set uid='?', param_name='?', param_value = '?' ON DUPLICATE KEY UPDATE param_value = '?'";
        	 $query  = $db->makeQuery($query, $uid, $id, $json, $json );
                 $db->executeQuery($query);
        }

        $boards = array();    
        return $boards;
    }
    
    public function deleteProfile(){
        
        //if (!is_string($json)) $json = json_encode($json);                                        
        if(count(($adata = $this->getLoggedIn()))) return $adata;
                
        $uid = $_SESSION['uid'];
        $bigobj = array();

        if(PROFILE_STORE == "file") {                
                                        
            $dar = PROFILE_PARAM."/".$uid.".json";
            if(file_exists($dar)) unlink($dar);
        }
        else if(PROFILE_STORE == "db") {
             /* get our DB */
             $db = $this->getContainer('db');
             $db->dbconnect();

             $query = "DELETE FROM setting WHERE uid='?'";
             $query  = $db->makeQuery($query, $uid);
             $db->executeQuery($query);        
        } 
         
        return $bigobj;
    }
    
    public function deleteIdProfile($id) {
    
     	if(count(($adata = $this->getLoggedIn()))) return $adata;	
	
	$json = "";
	$uid = $_SESSION['uid'];     
	$bigobj = array();
	
        if(PROFILE_STORE == "file") {

	        $dar = PROFILE_PARAM."/".$uid.".json";	
        	if(file_exists($dar)) 
        	{	
        	    $myfile = fopen($dar, "r") or die("Unable to open file!");
        	    $json =  fread($myfile, filesize($dar));
        	    fclose($myfile);		
                }
        	
                $bigobj = json_decode($json, true);	                
                unset($obj[$id]);
                $json = json_encode($bigobj, true);
                $myfile = fopen($dar, "w") or die("Unable to open file!");
                fwrite($myfile, $json);
                fclose($myfile);		        

        }        
        else if(PROFILE_STORE == "db") {
                   
                 /* get our DB */
                 $db = $this->getContainer('db');
                 $db->dbconnect();

        	 $query = "DELETE FROM setting WHERE uid='?' AND param_name = '?' limit 1";
        	 $query  = $db->makeQuery($query, $uid, $id);
                 $rows = $db->loadObjectArray($query);
        }

        return array();        
    }
    
    
    public function getContainer($name)
    {
        if (!$this->_instance || !array_key_exists($name, $this->_instance) || $this->_instance[$name] === null) {
            if($name == "auth") $containerClass = sprintf("Authentication\\".AUTHENTICATION);
            else if($name == "db") $containerClass = sprintf("Database\\".DATABASE_CONNECTOR);
            $this->_instance[$name] = new $containerClass();
        }
        return $this->_instance[$name];
    }
    
}

?>
