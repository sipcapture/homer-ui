<?php
/*
 * HOMER API
 * Homer's internal auth
 *
 * Copyright (C) 2011-2014 Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Copyright (C) 2011-2012 Lorenzo Mangani <lorenzo.mangani@gmail.com>
 *
 * The Initial Developers of the Original Code are
 *
 * Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Lorenzo Mangani <lorenzo.mangani@gmail.com>
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

namespace Authentication;

defined( '_HOMEREXEC' ) or die( 'Restricted access' );

class Internal extends Authentication {
	
	private $encrypt = true;
	private $group_column = "gid";
	private $id_column = "uid";
	private $pass_column = "password";
	private $user_column = "username";
	private $user_table = "user";
	private $user_level = "userlevel"; 
	private $db;
	private $_instance = null;

	function __construct($utable = NULL)
	{
		if($utable != NULL) $this->user_table = $utable;
        }

	public function getContainer()
	{
        	if ($this->_instance === null) { 
	            // extract name of the storage class
        	    $containerClass = "Database\\".DATABASE_CONNECTOR;
	            $this->_instance = new $containerClass(1, DB_HOSTNAME, DB_PORT, DB_CONFIGURATION, DB_USERNAME, DB_PASSWORD);
        	}
        	
	        return $this->_instance;
	}

	function logIn($param) {

           $mydb = $this->getContainer('db');
           $query  = $mydb->makeQuery("SELECT * FROM ".$this->user_table." WHERE ".$this->user_column."='?' AND ".$this->pass_column." = PASSWORD('?');" , $param['username'], $param['password']);
           $rows = $mydb->loadObjectList($query);

           if(count($rows) > 0) {
                $row = $rows[0]; 
                $_SESSION['loggedin']   = $row->uid;
                $_SESSION['uid']        = $row->uid;
                $_SESSION['username']   = $param['username'];
                $_SESSION['gid']        = $row->gid;
                $_SESSION['grp']        = $row->grp;
                
                
                //update lastvisit
                $query = "UPDATE ".$this->user_table." SET lastvisit = NOW() WHERE ".$this->id_column."='".$row->uid."'";
                $mydb->executeQuery($query);

                $user['uid']     = $row->uid;
                $user['username'] = $row->username;
                $user['gid']        = $row->gid;   
                $user['grp']      = $row->grp;   
                $user['firstname']  = $row->firstname;
                $user['lastname']   = $row->lastname; 
                $user['email']      = $row->email;    
                $user['lastvisit']  = $row->lastvisit;

                return $user;
                  
           } else{
               $_SESSION['loggedin'] = "-1";
               return array();
           }
        }
        
        //logout function 
        function logOut(){
                $_SESSION['loggedin'] = '-1';
         	session_destroy();
         	
                return;
	}

	function checkSession () {
        	if(!isset($_SESSION['loggedin'])) $_SESSION['loggedin'] = '-1';
		if($_SESSION['loggedin'] == "-1") return false;        
	        return true;
	}
	
	function checkAdmin () {
		if(preg_match('/admins/',$_SESSION['grp'])) return true;
	        else return false;
	}
	
	function getUser() {

           if(!isset($_SESSION['loggedin'])) $_SESSION['loggedin'] = '-1';
           if($_SESSION['loggedin'] == "-1") return array();

           $mydb = $this->getContainer('db');

           $query  = $mydb->makeQuery("SELECT uid, gid, username, `grp`, firstname, lastname, email, lastvisit  FROM users WHERE ".$this->id_column." = ? limit 1;", $_SESSION['loggedin']);
           $rows = $mydb->loadObjectList($query);

           if(count($rows)) {
                $row = $rows[0];
                $user['uid']     = $row->uid;
                $user['username'] = $row->username;
                $user['gid']        = $row->gid;
                $user['grp']      = $row->grp;
                $user['firstname']  = $row->firstname;
                $user['lastname']   = $row->lastname;
                $user['email']      = $row->email;
                $user['lastvisit']  = $row->lastvisit;
                return $user;
           }                                
           else return array();
        }

	
	//reset password
	function passwordReset($username, $user_table, $pass_column, $user_column){

		//generate new password
		$newpassword = $this->createPassword();
		
		//update database with new password
		$query = "UPDATE ".$this->user_table." SET ".$this->pass_column."='".$newpassword."' WHERE ".$this->user_column."='".stripslashes($username)."'";
		if(!$db->executeQuery($query)) {
			die("No update possible");		
			exit;		
		}
		
		$to = stripslashes($username);
		//some injection protection
		$illigals=array("n", "r","%0A","%0D","%0a","%0d","bcc:","Content-Type","BCC:","Bcc:","Cc:","CC:","TO:","To:","cc:","to:");
		$to = str_replace($illigals, "", $to);
		$getemail = explode("@",$to);
		
		//send only if there is one email
		if(sizeof($getemail) > 2){
			return false;	
		}else{
			//send email
			$from = $_SERVER['SERVER_NAME'];
			$subject = "Password Reset: ".$_SERVER['SERVER_NAME'];
			$msg = "<p>Your new password is: ".$newpassword."</p>";
			
			//now we need to set mail headers
			$headers = "MIME-Version: 1.0 rn" ;
			$headers .= "Content-Type: text/html; rn" ;
			$headers .= "From: $from  rn" ;
			
			//now we are ready to send mail
			$sent = mail($to, $subject, $msg, $headers);
			if($sent){
				return true; 
			}else{
				return false;	
			}
		}
	}
	
	//create random password with 8 alphanumerical characters
	function createPassword() {
		$chars = "abcdefghijkmnopqrstuvwxyz023456789";
		srand((double)microtime()*1000000);
		$i = 0;
		$pass = '' ;
		while ($i <= 7) {
			$num = rand() % 33;
			$tmp = substr($chars, $num, 1);
			$pass = $pass . $tmp;
			$i++;
		}
		return $pass;
	}
}

?>