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

class Auth {
    

    private $_instance = null;
    
    function __construct()
    {

    }

    /**
    * Checks if a user is logged in.
    *
    * @return boolean
    */
    public function getLoggedIn(){
        return $this->getContainer('auth')->checkSession();
    }

    /**
    * @param string $username
    * @param string $password
    * return boolean
    */
    public function postLogin($username, $password){
        return $this->getContainer('auth')->doLogin($username, $password);
    }
    
    /**
    * @param string $username
    * @param string $password
    * return boolean
    */
    public function doLogin($username, $password){
        //return $this->getContainer('auth')->doLogin($username, $password);
        return $this->getContainer('auth')->logIn(array('username'=>$username, 'password'=>$password));
    }
    
    public function doLogout(){

        $this->getContainer('auth')->logOut();        
        
        $answer = array();  
        
        $answer['sid'] = session_id();          
        $answer['auth'] = 'true';              
        $answer['status'] = 200;                
        $answer['message'] = 'session deleted';
        
        return $answer;
    }
    
    public function doSession($username, $password){
    
        $data = $this->getContainer('auth')->logIn(array('username'=>$username, 'password'=>$password));

        $answer = array();  
                
        if(empty($data)) {
        
                $answer['sid'] = session_id();
                $answer['auth'] = 'false';             
                $answer['status'] = 404;                
                $answer['message'] = 'bad password or username';                             
                $answer['data'] = $data;
        }                
        else {
                $answer['status'] = 200;
                $answer['sid'] = session_id();
                $answer['auth'] = 'true';             
                $answer['message'] = 'ok';                             
                $answer['data'] = $data;
        }
        
        return $answer;
    }
    
    public function getSession(){
        
        $answer = array();        
                            
        if($this->getContainer('auth')->checkSession()) {
                $answer['sid'] = session_id();
                $answer['auth'] = 'true';             
                $answer['status'] = 200;
   		$answer['data']['username'] = $_SESSION['username'];
                $answer['data']['gid'] = $_SESSION['gid'];
                $answer['data']['grp'] = $_SESSION['grp'];
        }
        else {
                $answer['sid'] = session_id();
                $answer['auth'] = 'false';             
                $answer['status'] = 403;        
                $answer['message'] = 'wrong session';
                $answer['data'] = array();
        }        
        
        return $answer;
    }


    public function getContainer()
    {
        if ($this->_instance === null) {
            //$config = \Config::factory('configs/config.ini', APPLICATION_ENV, 'auth');
            $containerClass = sprintf("Authentication\\".AUTHENTICATION);
            $this->_instance = new $containerClass();
        }
        return $this->_instance;
    }
    
    public function getTestAPI() {

        echo "<h1>Your api call works! Well done!</h1>";
        exit;
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

}

?>