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

class DefaultConnector {


	function dbconnect()
	{
		
	}

	//connect to database
	function dbconnect_node($node){
	
		return true;
	}

	function select_db($db) { 
	
	      return true;
        }
	                                                         
		
	//prevent injection
	function qry($query) {
	
        }
        
        //prevent injection
	function makeQuery($query) {

              return $query;
        }
  	
	function executeQuery($query) {			

	        return true;
	}

	function loadObjectList($query) {

	    return ;	        
	}
	
	function loadObjectArray($query) 
	{
	
    	    return;
	}
   
	function loadResult($query)
	{
              return;        	                                             	
        }		
   
        function quote($val) 
        {
            return;
        }
                                    
        function custom_sql_escape($inp) 
        {
        
              if(is_array($inp)) return array_map(__METHOD__, $inp);
 
              if(!empty($inp) && is_string($inp)) {
                      return str_replace(array('\\', "\0", "\n", "\r", "'", '"', "\x1a"), array('\\\\', '\\0', '\\n', '\\r', "\\'", '\\"', '\\Z'), $inp);
              }
 
              return $inp;
        }  
}

?>
