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

    angular.module(homer.modules.core.name).factory(homer.modules.core.services.store, [
        '$q',
	'$http',
        'eventbus',
        function ($q, $http, eventbus) 
        {
                                
                var getAll = function () 
                {
                
                        var defer = $q.defer();                                                            
                        $http.get('api/dashboard/store', {handleStatus:[403,503]}).then(
        			/* good response */
	                    function (results) {
	                        defer.resolve(results.data);                                                                        
                            },
                            /* bad response */
                            function (results) {
		                defer.reject();
                            }
        		 );   		    
        		return defer.promise;		                                                 
                },                
                getFunc = function (id) 
                {
                
                        var deferred = $q.defer();
			$http.get('api/dashboard/store/' + id, {handleStatus:[403,503]})
				.success(function(data){
	        			deferred.resolve(data.data);
				})
				.error(function(){
					deferred.reject();
				});
			
			return deferred.promise;
                },
                makeMenu = function (id, data) 
                {
                
                        var defer = $q.defer();                                                            
                        $http.post('api/dashboard/menu/'+id, data, {handleStatus:[403,503]}).then(
        			/* good response */
	                    function (results) {
	                        defer.resolve(results.data);                                                                        
                            },
                            /* bad response */
                            function (results) {
		                defer.reject();
                            }
        		 );   		    
        		return defer.promise;		                                                 
                },
                setFunc = function (id, data) 
                {
                
                        var defer = $q.defer();                                                            
                        $http.post('api/dashboard/store/'+id, data, {handleStatus:[403,503]}).then(
        			/* good response */
	                    function (results) {
	                        defer.resolve(results.data);                                                                        
                            },
                            /* bad response */
                            function (results) {
		                defer.reject();
                            }
        		 );   		    
        		return defer.promise;		                                                 
                },
                deleteFunc = function (id, data) 
                {
                
                        var defer = $q.defer();                                                            
                        $http.delete('api/dashboard/store/'+id, {handleStatus:[403,503]}).then(
        			/* good response */
	                    function (results) {
	                        defer.resolve(results.data);                                                                        
                            },
                            /* bad response */
                            function (results) {
		                defer.reject();
                            }
        		 );   		    
        		return defer.promise;		                                                 
                };

                return {
                   getAll: getAll,
                   get: getFunc,
                   set: setFunc,
                   delete: deleteFunc,
                   menu: makeMenu
                };
          }
    ]);
}(angular, homer));
