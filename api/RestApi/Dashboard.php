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

class Dashboard {
    
    private $authmodule = true;
    private $_instance = array();

    /**
    * Clears the cache of the app.
    *
    * @param boolean $withIndex If true, it clears the search index too.
    * @return boolean True if the cache has been cleared.
    */
    public function clearCache($withIndex = false){
        return true;
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
    

    public function getDashboard(){
        
        //if (!is_string($json)) $json = json_encode($json);                                

         if(count(($adata = $this->getLoggedIn()))) return $adata;

        $globalmenu = array();        
	$boards = array();	
	$menu = array();

	$db = $this->getContainer('db');
        $db->select_db(DB_CONFIGURATION);
        $db->dbconnect();

        $table = "user_menu";
        $query = "SELECT id,name,icon,active,alias FROM ".$table." WHERE active = 1 order by weight ASC";
        $data = $db->loadObjectArray($query);

	foreach($data as $row) {
		$menu = array();
		$menu['name'] = $row['name'];
		$menu['href'] = !empty($row['alias']) ? $row['alias'] : $row['id'];
		$menu['class'] = "fa ".$row['icon'];
		$globalmenu[] = $menu;
        }


	/*
	$menu['name'] = 'Home';
	$menu['href'] = 'home';
	$menu['class'] = 'fa fa-home';
	//	$menu['badgeclass'] = 'badge pull-right bg-red';
	//	$menu['badgeinfo'] = 'new';	
	$globalmenu[] = $menu;
	
	$menu = array();	
	$menu['name'] = 'Search';
	$menu['href'] = 'search';
	$menu['class'] = 'fa fa-search';
	$globalmenu[] = $menu;	
	
	$menu['name'] = 'Alarms';
	$menu['href'] = 'alarms';
	$menu['class'] = 'fa fa-home';
	$menu['badgeclass'] = 'badge pull-right bg-red';
	$menu['badgeinfo'] = '5 new';	
	$globalmenu[] = $menu;
	*/


	$menu = array();	
	$menu['name'] = 'Custom Panels';
	$menu['href'] = '#';
	$menu['class'] = 'fa fa-dashboard';
	$menu['rowclass'] = 'fa fa-angle-left pull-right';
	
	/* $parent = new \stdClass;
	$parent->boardid = 1;
	$parent->name = "new";
	$parent->class = "fa fa-plus-circle";
	$boards[] = $parent;
	*/


        /* store */    
        if ($handle = opendir(DASHBOARD_PARAM)) {
	   while (false !== ($file = readdir($handle))) {
		if ($file[0] == "_") {
		    $dar = DASHBOARD_PARAM."/".$file;
		    $myfile = fopen($dar, "r") or die("Unable to open file!");
		    $text =  fread($myfile, filesize($dar));
		    $json = json_decode($text, true);	
		    $parent = new \stdClass;
		    $parent->boardid = str_replace(".json", "", $file);
	            $parent->name = $json['title'];
	            $parent->class = "fa fa-angle-double-right";
		    $boards[] = $parent; 
		    fclose($myfile);		
        	}
	    }
	    closedir($handle);	     	    	    
	}
	
	$menu['subItems'] = $boards;
		
	$globalmenu[] = $menu;	

        return $globalmenu;
    }
    
    public function getIdDashboard($id){
        
        
        if(count(($adata = $this->getLoggedIn()))) return $adata;
         
        //if (!is_string($json)) $json = json_encode($json);                                        

	$db = $this->getContainer('db');
        $db->select_db(DB_CONFIGURATION);
        $db->dbconnect();

        $table = "user_menu";
        $query = "SELECT id FROM user_menu WHERE active = 1 AND alias='?' limit 1";
        $query  = $db->makeQuery($query, $id);
        $data = $db->loadObjectArray($query);
        foreach($data as $row) {  $id = $row['id']; }

	$dar = DASHBOARD_PARAM."/".$id.".json";
	$json = "";
	
	if(file_exists($dar)) 
	{	
        	$myfile = fopen($dar, "r") or die("Unable to open file!");
        	$text =  fread($myfile, filesize($dar));
        	$json = json_decode($text, true);	
        	fclose($myfile);		
        }
        
        return $json;
    }
    
    public function newDashboard(){
        
        //if (!is_string($json)) $json = json_encode($json);                                        
	$dar = DASHBOARD_PARAM."/".$id.".json";
	$json = "";
	
	if(file_exists($dar)) 
	{	
        	$myfile = fopen($dar, "r") or die("Unable to open file!");
        	$text =  fread($myfile, filesize($dar));
        	$json = json_decode($text, true);	
        	fclose($myfile);		
        }
        
        return $json;
    }
    
    public function postDashboard(){
        
        //if (!is_string($json)) $json = json_encode($json);                                

        if(count(($adata = $this->getLoggedIn()))) return $adata;
         
	$boards = array();
        
        if ($handle = opendir(DASHBOARD_PARAM)) {
	   while (false !== ($file = readdir($handle))) {
		if ($file != "." && $file != "..") {
		    $dar = DASHBOARD_PARAM."/".$file;
		    $myfile = fopen($dar, "r") or die("Unable to open file!");
		    $text =  fread($myfile, filesize($dar));
		    $json = json_decode($text, true);	
		    $parent = new \stdClass;
		    $parent->id = str_replace(".json", "", $file);
	            $parent->title = $json->title;
		    $boards[] = $parent; 
		    fclose($myfile);		
        	}
	    }
	    closedir($handle);
	}

        return $boards;
    }
    
    public function uploadDashboard(){
        
        //if (!is_string($json)) $json = json_encode($json);                                
        if(count(($adata = $this->getLoggedIn()))) return $adata;
  
	$answer = array();
      
 	if ( !empty( $_FILES ) ) {
		$tempPath = $_FILES[ 'file' ][ 'tmp_name' ];
		$uploadPath = DASHBOARD_PARAM."/_".time().".json";
		move_uploaded_file( $tempPath, $uploadPath );
		
		$answer['sid'] = session_id();
                $answer['auth'] = 'true';
                $answer['status'] = 200;
                $answer['message'] = 'File transfer completed';
                $answer['data'] = array();
        }
	else {
		$answer['sid'] = session_id();
                $answer['auth'] = 'true';
                $answer['status'] = 200;
                $answer['message'] = 'no file';
                $answer['data'] = array();
	}
        
        return $answer;
    }
    
    public function postIdDashboard($id){
        
         if(count(($adata = $this->getLoggedIn()))) return $adata;
        
        //if (!is_string($json)) $json = json_encode($json);                                        
	$dar = DASHBOARD_PARAM."/".$id.".json";
	$json = "";

	if(isset($GLOBALS['HTTP_RAW_POST_DATA'])){
        	$jd = json_decode($GLOBALS['HTTP_RAW_POST_DATA']);
        	$json = json_encode($jd, true);
        }

        $myfile = fopen($dar, "w") or die("Unable to open file!");
	fwrite($myfile, $json);
        fclose($myfile);		        
  
        $boards = array();    
        return $boards;
    }    
    
    public function postMenuDashboard($id, $param){
        
	$db = $this->getContainer('db');
        $db->select_db(DB_CONFIGURATION);
        $db->dbconnect();

        $data = array();

        $search = array();
        $callwhere = array();
        $calldata = array();
        $arrwhere = "";

        $protect = getVar('protect', false, $param, 'bool');
        $icon = getVar('icon', "", $param, 'string');
        $name = getVar('title', "", $param, 'string');
        $alias = getVar('alias', "", $param, 'string');
        $weight = getVar('weight', 10, $param, 'int');

        $table = "user_menu";
        if($protect)
        {        
            $query = "INSERT INTO ".$table." SET id='?', name='?', icon='?', weight=?, alias='?' ON DUPLICATE KEY UPDATE name = '?', icon = '?',  weight=?, alias='?'";
            $query  = $db->makeQuery($query, $id, $name, $icon, $weight, $alias, $name, $icon, $weight, $alias);            
        }
        else {
            $query = "DELETE FROM ".$table." WHERE id='?'";
            $query  = $db->makeQuery($query, $id);            
        }
                
        $db->executeQuery($query);
        return $boards;
    }    
    
    public function getNode(){
        
	$db = $this->getContainer('db');
        $db->select_db(DB_CONFIGURATION);
        $db->dbconnect();

        $table = "node";
        $query = "SELECT id,name FROM ".$table." WHERE status = 1 order by id ASC";
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
    
    
    public function deleteIdDashboard($id){
        
        if(count(($adata = $this->getLoggedIn()))) return $adata;
         
        //if (!is_string($json)) $json = json_encode($json);                                        
	$dar = DASHBOARD_PARAM."/".$id.".json";
	$json = "";
	
	if(file_exists($dar)) {	
	        unlink($dar);
        }
        
        return $json;
    }
    
    
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
    
}

?>
