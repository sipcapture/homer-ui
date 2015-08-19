/*
 * HOMER 5 UI (Xenophon)
 *
 * Copyright (C) 2011-2015 Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Copyright (C) 2011-2015 Lorenzo Mangani <lorenzo.mangani@gmail.com> QXIP B.V.
 * License AGPL-3.0 http://opensource.org/licenses/AGPL-3.0
 *
*/

(function (angular, homer) {
    'use strict';

    angular.module(homer.modules.auth.name).factory(homer.modules.auth.services.authentication, [
        '$q',
	'$http',
        'eventbus',
        function ($q, $http, eventbus) {

                var currentUser,
                            
                createUser = function (name, auth,  permissions) {
                
                    return {
                        isAuthenticated:auth,
                        name: name,
                        permissions: permissions
                    }
                },
                
                login = function (username, password) {
                        var defer = $q.defer();
                                        
                           $http.post('api/v1/session', { username: username, password: password }).then(
        			/* good response */
	                        function (results) {
		        	    console.log(results.data);
			            if(results.data.auth == "false") {				
                                         defer.reject('Unknown Username / Password combination');                                                             
	        		    }	
		        	    else {
        				var group = results.data.data.grp.split(",") 
	        		        console.log(group);
		        		
        				currentUser = createUser(username, true, group);
	            			console.log(results.data.data.grp);
                                        eventbus.broadcast(homer.modules.auth.events.userLoggedIn, currentUser);				
                                        defer.resolve(currentUser);                                                        
                                    }
                	   	},
		        	/* bad response */
        			function (results) {
	        			console.log(results);
        				defer.reject('Unknown Username / Password combination');				                            				                        
	        		}
		            );                    
		            
		            return defer.promise;		                                
                },
                
                
                session = function () {
                        var defer = $q.defer();
                                                            
                        $http.get('api/v1/session').then(
			/* good response */
	                function (results) {
			    if(results.data.auth == "false") {				
			        currentUser = createUser("", false, "");			                                        
			        eventbus.broadcast(homer.modules.auth.events.usernotAuthorised, currentUser);			                                        
                                defer.reject('Unknown Username / Password combination');
			    }	
			    else {
				var group = results.data.data.grp.split(",") 
				currentUser = createUser(results.data.data.username, true, group);				
                                eventbus.broadcast(homer.modules.auth.events.userLoggedIn, currentUser);				
                                defer.resolve(currentUser);                                                                        
                            }
        	   	},
			/* bad response */
			function (results) {
				defer.reject('Unknown Username / Password combination');
			}
		    );   
		    
		    return defer.promise;		                                                 
                },
                
                user = function () {
                    
                   var defer = $q.defer();
                   
                   $http.get('api/v1/user').then(
			/* good response */
	                function (results) {
			    if(results.data.auth == "false") {							    
			        console.log("SESSION:" + results.data.auth);
			        defer.reject('unknown username');			                                        
			    }	
			    else {
				var group = results.data.data.user.grp.split(",") 
				currentUser = createUser(results.data.data.user.username, true, group);
                                eventbus.broadcast(homer.modules.auth.events.userLoggedIn, currentUser);				
                                defer.resolve(currentUser);                                                                                                             
                            }
        	   	},
			/* bad response */
			function (results) {
				defer.reject('Unknown Username');				                                
			}
		    );   
		    
		    return defer.promise;                 
                },
                

                logout = function () {
                    // we should only remove the current user.
                    // routing back to login login page is something we shouldn't
                    // do here as we are mixing responsibilities if we do.
                    var defer = $q.defer();
                    
                    currentUser = undefined;
                    eventbus.broadcast(homer.modules.auth.events.userLoggedOut);

                    $http.delete('api/v1/session').then(
			/* good response */
	                function (results) {
	                    defer.resolve(false);
        	   	},
			/* bad response */
			function (results) {
			    defer.reject(false);                                             			                                
			}
		    );                                        

		    return defer.promise;
		                        
                },

                getCurrentLoginUser = function () {
                    return currentUser;
                };

            return {
                login: login,
                logout: logout,
                session: session,
                user: user,
                getCurrentLoginUser: getCurrentLoginUser
            };
        }
    ]);
}(angular, homer));