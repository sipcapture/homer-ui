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

class Report {
    
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

    public function doRTCPReport($timestamp, $param){
    
        /* get our DB */
        $db = $this->getContainer('db');
                
        $data = array();        
        $lnodes = array();
        
        //if(array_key_exists('node', $param)) $lnodes = $param['node'];
        if(isset($param['location'])) $lnodes = $param['location']['node'];
                
                        
        $time['from'] = getVar('from', round((microtime(true) - 300) * 1000), $timestamp, 'long');
        $time['to'] = getVar('to', round(microtime(true) * 1000), $timestamp, 'long');        
        $time['from_ts'] = floor($time['from']/1000);
        $time['to_ts'] = round($time['to']/1000);
        
        /* lets make a range */
        $time['from_ts']-=600;
        $time['to_ts']+=60;
                
        /* search fields */        
        $node = getVar('node', NULL, $param['search'], 'string');
        $type = getVar('type', -1, $param['search'], 'int');
        $proto = getVar('proto', -1, $param['search'], 'int');
        $family = getVar('family', -1, $param['search'], 'int');
        $and_or = getVar('orand', NULL, $param['search'], 'string');        
        $limit_orig = getVar('limit', 100, $param, 'int');        
        $answer = array();                          
        $callids = getVar('callid', array(), $param['search'], 'array');                         
        $callwhere = array();

        $cn = count($callids);
        for($i=0; $i < $cn; $i++) $callids[] = substr($callids[$i], 0, -1);
        
        $search['correlation_id'] = implode(";", $callids);                
        //$callwhere[] = "`correlation_id` IN ('".implode("','", $callids)."')";
         
        $answer = array();  
        
        if(empty($callids))
        {                
                $answer['sid'] = session_id();
                $answer['auth'] = 'true';             
                $answer['status'] = 200;                
                $answer['message'] = 'no data';                             
                $answer['data'] = $data;
                $answer['count'] = count($data);                
                return $answer;                
        }
        
        $nodes = array();
        if(SINGLE_NODE == 1) $nodes[] = array( "dbname" =>  DB_HOMER, "name" => "single");
        else {
            foreach($lnodes as $lnd) $nodes[] = $this->getNode($lnd['name']);
        }

        foreach($nodes as $node)
        {        
            
	    $db->dbconnect_node($node);                            
            $limit = $limit_orig;
            if(empty($callwhere)) $callwhere = generateWhere($search, $and_or, $db, 0);

            for($ts = $time['from_ts']; $ts < $time['to_ts']; $ts+=86400) {
                         
                $table = "rtcp_capture";                            
                $query = "SELECT *, '".$node['name']."' as dbnode FROM ".$table." WHERE (`date` BETWEEN FROM_UNIXTIME(".$time['from_ts'].") AND FROM_UNIXTIME(".$time['to_ts']."))";
                if(count($callwhere)) $query .= " AND ( " .implode(" AND ", $callwhere). ")";
                $noderows = $db->loadObjectArray($query);
                $data = array_merge($data,$noderows);                
                $limit -= count($noderows);
            }
        }

	 /* RTCP report fix */
        for($i=0; $i < count($data); $i++) {
            if(!is_array($data[$i]["msg"])) $data[$i]["msg"] = json_decode($data[$i]["msg"]);
        }

        /* sorting */
        usort($data, create_function('$a, $b', 'return $a["micro_ts"] > $b["micro_ts"] ? 1 : -1;'));

                
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


    public function doLogReport($timestamp, $param){
    
        /* get our DB */
        $db = $this->getContainer('db');
        
        $data = array();
        $search = array();        
        $lnodes = array();
        $answer = array();  
        $callwhere = array();
        
        //if(array_key_exists('node', $param)) $lnodes = $param['node'];
        if(isset($param['location'])) $lnodes = $param['location']['node'];                
                                                  
        $time['from'] = getVar('from', round((microtime(true) - 300) * 1000), $timestamp, 'long');
        $time['to'] = getVar('to', round(microtime(true) * 1000), $timestamp, 'long');        
        $time['from_ts'] = floor($time['from']/1000);
        $time['to_ts'] = round($time['to']/1000);
        
        $time['from_ts']-=600;
        $time['to_ts']+=60;
        
        /* search fields */                
        $type = getVar('uniq', -1, $param['search'], 'int');                
        $node = getVar('node', NULL, $param['search'], 'string');
        $proto = getVar('proto', -1, $param['search'], 'int');
        $family = getVar('family', -1, $param['search'], 'int');
        $and_or = getVar('orand', NULL, $param['search'], 'string');        
        $limit_orig = getVar('limit', 100, $param, 'int');
        $callids = getVar('callid', array(), $param['search'], 'array');         
        $search['correlation_id'] = implode(";", $callids);
                                 
        if(empty($callids))
        {                
                $answer['sid'] = session_id();
                $answer['auth'] = 'true';             
                $answer['status'] = 200;                
                $answer['message'] = 'no data';                             
                $answer['data'] = $data;
                $answer['count'] = count($data);                
                return $answer;                
        }

        $nodes = array();
        if(SINGLE_NODE == 1) $nodes[] = array( "dbname" =>  DB_HOMER, "name" => "single");
        else {
            foreach($lnodes as $lnd) $nodes[] = $this->getNode($lnd['name']);
        }

        foreach($nodes as $node)
        {        
            
	    $db->dbconnect_node($node);                            
            $limit = $limit_orig;
            if(empty($callwhere)) $callwhere = generateWhere($search, $and_or, $db, 0);

            for($ts = $time['from_ts']; $ts < $time['to_ts']; $ts+=86400) {
                         
                $table = "logs_capture";                            
                $query = "SELECT *, '".$node['name']."' as dbnode FROM ".$table." WHERE (`date` BETWEEN FROM_UNIXTIME(".$time['from_ts'].") AND FROM_UNIXTIME(".$time['to_ts']."))";
                if(count($callwhere)) $query .= " AND ( " .implode(" AND ", $callwhere). ")";
                $noderows = $db->loadObjectArray($query);
                $data = array_merge($data,$noderows);                
                $limit -= count($noderows);
            }
        }

        /* sorting */
        usort($data, create_function('$a, $b', 'return $a["micro_ts"] > $b["micro_ts"] ? 1 : -1;'));

                
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


    public function doQualityReport($id, $timestamp, $param){
    
        /* get our DB */
        $db = $this->getContainer('db');
        
        $data = array();
        $search = array();        
        $lnodes = array();
        $callwhere = array();        
        
        //if(array_key_exists('node', $param)) $lnodes = $param['node'];
        if(isset($param['location'])) $lnodes = $param['location']['node'];
                
                                                          
        $time['from'] = getVar('from', round((microtime(true) - 300) * 1000), $timestamp, 'long');
        $time['to'] = getVar('to', round(microtime(true) * 1000), $timestamp, 'long');        
        $time['from_ts'] = floor($time['from']/1000);
        $time['to_ts'] = round($time['to']/1000);

        $time['from_ts']-=600;
        $time['to_ts']+=60;
        
        /* search fields */        
        $node = getVar('node', NULL, $param['search'], 'string');
        $type = getVar('type', -1, $param['search'], 'int');
        $proto = getVar('proto', -1, $param['search'], 'int');
        $family = getVar('family', -1, $param['search'], 'int');        
        $and_or = getVar('orand', NULL, $param['search'], 'string');        
        $limit_orig = getVar('limit', 100, $param, 'int');
                
        $callids = getVar('callid', array(), $param['search'], 'array');         
        $search['correlation_id'] = implode(";", $callids);
        $answer = array();  
        
        if(empty($callids))
        {                
                $answer['sid'] = session_id();
                $answer['auth'] = 'true';             
                $answer['status'] = 200;                
                $answer['message'] = 'no data';                             
                $answer['data'] = $data;
                $answer['count'] = count($data);                
                return $answer;                
        }
               
                        
        $nodes = array();
        if(SINGLE_NODE == 1) $nodes[] = array( "dbname" =>  DB_HOMER, "name" => "single");
        else {
            foreach($lnodes as $lnd) $nodes[] = $this->getNode($lnd['name']);
        }

        foreach($nodes as $node)
        {        
            
	    $db->dbconnect_node($node);                            
            $limit = $limit_orig;
            if(empty($callwhere)) $callwhere = generateWhere($search, $and_or, $db, 0);

            for($ts = $time['from_ts']; $ts < $time['to_ts']; $ts+=86400) {
                         
                $table = "report_capture";                            
                $query = "SELECT *, '".$node['name']."' as dbnode FROM ".$table." WHERE (`date` BETWEEN FROM_UNIXTIME(".$time['from_ts'].") AND FROM_UNIXTIME(".$time['to_ts']."))";
                            
                if(count($callwhere)) $query .= " AND ( " .implode(" AND ", $callwhere). ")";
                $noderows = $db->loadObjectArray($query);

                $data = array_merge($data,$noderows);                
                $limit -= count($noderows);
            }
        }

        /* sorting */
        usort($data, create_function('$a, $b', 'return $a["micro_ts"] > $b["micro_ts"] ? 1 : -1;'));
              
              
        $allowreport = array("LocalAddr", "RemoteAddr", "PacketLoss", "Delay", "QualityEst");
	foreach($data as $key=>$row) {
	        
	        if($row['type'] == 1 && $id != "raw")  
	        {
	                $ldata = array();
        		$mas = preg_split("/\r\n\r\n/", $row['msg']);
	        	$data[$key]['msg'] = $mas[1];
	        	$drs = preg_split("/\r\n/", $mas[1]);
	        	foreach($drs as $k=>$d)
	        	{	        
                            $v = preg_split("/:/", $d);                                                        
                            $a = explode(' ', $v[1]);

                            /* short report */
                            if($id == "short" && !in_array($v[0], $allowreport)) continue;                            
                            
                            $dval = array();
                            foreach ($a as $are) {
                                $b = explode('=', $are);
                                if(!empty($b[0])) {
                                    if($b[1] == null) $b[1] = $b[0];
                                    $dval[$b[0]] = $b[1];
                                }
                            }
                            if(!empty($v[0])) $ldata[$v[0]] = $dval;                                                                                    	        	
	        	}	        	
	        	
	        	$data[$key]['msg'] = $ldata;
                }
        }
    
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

    /*share */
    public function doLogReportById($param){

        $data = array();
        $db = $this->getContainer('db');
        $db->select_db(DB_CONFIGURATION);
        $db->dbconnect();

        $uuid = getVar('transaction_id', "", $param, 'string');

        $query = "SELECT data FROM link_share WHERE uuid='?' limit 1";
        $query  = $db->makeQuery($query, $uuid );
        $json = $db->loadObjectArray($query);

        if(!empty($json)) {

            $djson = json_decode($json[0]['data'], true);

            $timestamp = $djson['timestamp'];
            $param = $djson['param'];

            $data =  $this->doLogReport($timestamp, $param);

        }

        if(empty($data)) {

                $answer['sid'] = session_id();
                $answer['auth'] = 'true';
                $answer['status'] = 200;
                $answer['message'] = 'no data';
                $answer['data'] = $data;
                $answer['count'] = count($data);
                return $answer;
        } else {
                return $data;
        }
    }
    
      /*share */
    public function doRTCPReportById($param){

        $data = array();
        $db = $this->getContainer('db');
        $db->select_db(DB_CONFIGURATION);
        $db->dbconnect();

        $uuid = getVar('transaction_id', "", $param, 'string');

        $query = "SELECT data FROM link_share WHERE uuid='?' limit 1";
        $query  = $db->makeQuery($query, $uuid );
        $json = $db->loadObjectArray($query);

        if(!empty($json)) {

            $djson = json_decode($json[0]['data'], true);

            $timestamp = $djson['timestamp'];
            $param = $djson['param'];

            $data =  $this->doRTCPReport($timestamp, $param);

        }

        if(empty($data)) {

                $answer['sid'] = session_id();
                $answer['auth'] = 'true';
                $answer['status'] = 200;
                $answer['message'] = 'no data';
                $answer['data'] = $data;
                $answer['count'] = count($data);
                return $answer;
        } else {
                return $data;
        }
    }

  /*share */
    public function doQualityReportById($param){

        $data = array();
        $db = $this->getContainer('db');
        $db->select_db(DB_CONFIGURATION);
        $db->dbconnect();

        $uuid = getVar('transaction_id', "", $param, 'string');

        $query = "SELECT data FROM link_share WHERE uuid='?' limit 1";
        $query  = $db->makeQuery($query, $uuid );
        $json = $db->loadObjectArray($query);

        if(!empty($json)) {

            $djson = json_decode($json[0]['data'], true);

            $timestamp = $djson['timestamp'];
            $param = $djson['param'];
            $id =  "short";

            $data =  $this->doQualityReport($id, $timestamp, $param);

        }

        if(empty($data)) {

                $answer['sid'] = session_id();
                $answer['auth'] = 'true';
                $answer['status'] = 200;
                $answer['message'] = 'no data';
                $answer['data'] = $data;
                $answer['count'] = count($data);
                return $answer;
        } else {
                return $data;
        }
    }

    
    public function getNode($name){
        $db = $this->getContainer('db');
        $db->select_db(DB_CONFIGURATION);
        $db->dbconnect();
        $table = "node";
        $query = "SELECT * FROM ".$table." WHERE name='?' AND status = 1 LIMIT 1";
	$query  = $db->makeQuery($query, $name);
        $data = $db->loadObjectArray($query);
	if(empty($data)) return array();
	return $data[0];
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
