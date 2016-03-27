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

    angular.module(homer.modules.core.name).factory(homer.modules.core.services.search, [
        '$q',
	'$http',
        'eventbus',
        function ($q, $http, eventbus) {
                                
               var searchValue = {};                                                                               
                                
                var timerange = {
			fromdate: new Date(new Date().getTime() - 300*1000),
			todate: new Date()
		};                                  

                /* actual search data */
		var searchdata = {
                        timestamp: {
			      from: new Date(new Date().getTime() - 300*1000),
                              to: new Date()
                        },
                        param: {
                          transaction: {
                              call: true,
                              registration: true,
                              rest: true
                          },
                          limit: 200
                        }
                };
                
                var setTimeRange = function (data)
                {                
                    timerange = data;                
                };
                
                var getTimeRange = function()
                {                
                    return timerange;
                };
                
                var setSearchData = function (data)
                {                
                    searchdata = data;                
                };
                
                var getSearchData = function()
                {          
                    return searchdata;
                };
                
                var setSearchValue = function (data)
                {                
                    searchValue = data;                
                };
                
                var getSearchValue = function()
                {          
                    return searchValue;
                };
                                                
                var searchByMethod = function (mdata) {
                
                        var defer = $q.defer();
                        
                        $http.post('api/v1/search/data', mdata, {handleStatus:[403,503]}).then(
        			/* good response */
	                    function (results) {
	        		    if(results.data.auth == "false") {				
                                        defer.reject('user not authorized');
	            		    }	
		        	    else {
                                        defer.resolve(results.data.data);                                                                        
                                    }
                            },
        			/* bad response */
	        		function (results) {
		        		defer.reject('bad response combination');
                                }
        		 );   
		    
        		return defer.promise;		                                                 
                };
                
                var searchMethod = function (data) {
                
                        var defer = $q.defer();
                                                            
                        $http.post('api/v1/search/method', data , {handleStatus:[403,503]}).then(
        			/* good response */
	                    function (results) {
	        		    if(results.data.auth == "false") {				
                                        defer.reject('user not authorized');
	            		    }	
		        	    else {
                                        defer.resolve(results.data.data);                                                                        
                                    }
                            },
        			/* bad response */
	        		function (results) {
		        		defer.reject('bad response combination');
                                }
        		 );   
		    
        		return defer.promise;		                                                 
                };
                
                var searchMessage = function (data) {
                
                        var defer = $q.defer();
                                                            
                        $http.post('api/v1/search/message', data, {handleStatus:[403,503]}).then(
        			/* good response */
	                    function (results) {
	        		    if(results.data.auth == "false") {				
                                        defer.reject('user not authorized');
	            		    }	
		        	    else {
                                        defer.resolve(results.data.data);                                                                        
                                    }
                            },
        			/* bad response */
	        		function (results) {
		        		defer.reject('bad response combination');
                                }
        		 );   
		    
        		return defer.promise;		                                                 
                };
                
                var searchTransaction = function (data) {
                
                        var defer = $q.defer();
                                                            
                        $http.post('api/v1/search/transaction', data, {handleStatus:[403,503]}).then(
        			/* good response */
	                    function (results) {
	        		    if(results.data.auth == "false") {				
                                        defer.reject('user not authorized');
	            		    }	
		        	    else {
                                        defer.resolve(results.data.data);                                                                        
                                    }
                            },
        			/* bad response */
	        		function (results) {
		        		defer.reject('bad response combination');
                                }
        		 );   
		    
        		return defer.promise;		                                                 
                };
                
                var searchRTCPReport = function (data) {
                
                        var defer = $q.defer();
                                                            
                        $http.post('api/v1/report/rtcp', data, {handleStatus:[403,503]}).then(
        			/* good response */
	                    function (results) {
	        		    if(results.data.auth == "false") {				
                                        defer.reject('user not authorized');
	            		    }	
		        	    else {
                                        defer.resolve(results.data.data);                                                                        
                                    }
                            },
        			/* bad response */
	        		function (results) {
		        		defer.reject('bad response combination');
                                }
        		 );   
		    
        		return defer.promise;		                                                 
                };
                
                var searchQOSReport = function (data) {
                
                        var defer = $q.defer();
                                                            
                        $http.post('api/v1/report/qos', data, {handleStatus:[403,503]}).then(
        			/* good response */
	                    function (results) {
	        		    if(results.data.auth == "false") {				
                                        defer.reject('user not authorized');
	            		    }	
		        	    else {
                                        defer.resolve(results.data.data);                                                                        
                                    }
                            },
        			/* bad response */
	        		function (results) {
		        		defer.reject('bad response combination');
                                }
        		 );   
		    
        		return defer.promise;		                                                 
                };

                var searchLogReport = function (data) {
                
                        var defer = $q.defer();
                                                            
                        $http.post('api/v1/report/log', data, {handleStatus:[403,503]}).then(
        			/* good response */
	                    function (results) {
	        		    if(results.data.auth == "false") {				
                                        defer.reject('user not authorized');
	            		    }	
		        	    else {
                                        defer.resolve(results.data.data);                                                                        
                                    }
                            },
        			/* bad response */
	        		function (results) {
		        		defer.reject('bad response combination');
                                }
        		 );   
		    
        		return defer.promise;		                                                 
                };                
                
                var searchQualityReport = function (type, data) {
                
                        var defer = $q.defer();                        
                                                            
                        $http.post('api/v1/report/quality/'+type, data, {handleStatus:[403,503]}).then(
        			/* good response */
	                    function (results) {
	        		    if(results.data.auth == "false") {				
                                        defer.reject('user not authorized');
	            		    }	
		        	    else {
                                        defer.resolve(results.data.data);                                                                        
                                    }
                            },
        			/* bad response */
	        		function (results) {
		        		defer.reject('bad response combination');
                                }
        		 );   
		    
        		return defer.promise;		                                                 
                };                                
                
                
                var loadNode = function () {
                
                        var defer = $q.defer();
                                                            
                        $http.get('api/v1/dashboard/node', {handleStatus:[403,503]}).then(
        			/* good response */
	                    function (results) {
	        		    if(results.data.auth == "false") {				
                                        defer.reject('user not authorized');
	            		    }	
		        	    else {
                                        defer.resolve(results.data.data);                                                                        
                                    }
                            },
        			/* bad response */
	        		function (results) {
		        		defer.reject('bad response combination');
                                }
        		 );   
		    
        		return defer.promise;		                                                 
                };
                
                var makePcapTextforTransaction = function (data, type) {
                
                        var defer = $q.defer();
                        
                        var url = 'api/v1/search/export/';
                        
                        var response = {responseType:'arraybuffer', handleStatus:[403,503]};
                        if(type == 1) url+= "text";
                        else if(type == 2) {
                            url+= "cloud";
                            response = { handleStatus:[403,503]};
                        }
                        else url+="pcap";
                        
                        console.log(response);

                        $http.post(url, data, response).then(
        			/* good response */
	                    function (results) {
	        		    if(results.data.auth == "false") {				
                                        defer.reject('user not authorized');
	            		    }	
		        	    else {
                                        defer.resolve(results.data);                                                                        
                                    }
                            },
        			/* bad response */
	        		function (results) {
		        		defer.reject('bad response combination');
                                }
        		 );   
		    
        		return defer.promise;		                                                 
                };
                
                var makePcapTextData = function (data, type) {
                

                        var defer = $q.defer();
                        
                        var response = {responseType:'arraybuffer', handleStatus:[403,503]};
                        var url = 'api/v1/search/export/data/';
                        if(type == 1) url+= "text";
                        else if(type == 2) {
                            url+= "cloud";
                            response = { handleStatus:[403,503]};
                        }
                        else if(type == 3) {
                            url+= "count";
                            response = { handleStatus:[403,503]};
                        }
                        else url+="pcap";

                        $http.post(url, data, response).then(
        			/* good response */
	                    function (results) {
	        		    if(results.data.auth == "false") {				
                                        defer.reject('user not authorized');
	            		    }	
		        	    else {
                                        defer.resolve(results.data);                                                                        
                                    }
                            },
        			/* bad response */
	        		function (results) {
		        		defer.reject('bad response combination');
                                }
        		 );   
		    
        		return defer.promise;		                                                 
                };
                
                var createShareLink = function (data) {
                
                        var defer = $q.defer();
                                                            
                        $http.post('api/v1/search/sharelink', data, {handleStatus:[403,503]}).then(
        			/* good response */
	                    function (results) {
	        		    if(results.data.auth == "false") {				
                                        defer.reject('user not authorized');
	            		    }	
		        	    else {
                                        defer.resolve(results.data.data);                                                                        
                                    }
                            },
        			/* bad response */
	        		function (results) {
		        		defer.reject('bad response combination');
                                }
        		 );   
		    
        		return defer.promise;		                                                 
                };

                return {
                   searchByMethod: searchByMethod,
                   searchMethod: searchMethod,
                   searchMessage: searchMessage,
                   searchTransaction: searchTransaction,
                   makePcapTextforTransaction: makePcapTextforTransaction,
                   makePcapTextData: makePcapTextData,
                   createShareLink: createShareLink,
                   getTimeRange: getTimeRange,                   
                   setTimeRange: setTimeRange,
                   getSearchData: getSearchData,                   
                   setSearchData: setSearchData,
                   getSearchValue: getSearchValue,                   
                   setSearchValue: setSearchValue,                   
                   searchValue: searchValue,
                   searchRTCPReport: searchRTCPReport,
                   searchQOSReport: searchQOSReport,
                   searchLogReport: searchLogReport,
                   searchQualityReport: searchQualityReport,
                   loadNode: loadNode
                };
          }
    ])
    .factory('sessionRecoverer', ['$q', 'eventbus', '$rootScope', '$location', function($q, eventbus, $rootScope, $location) {  
    	var sessionRecoverer = {
        	responseError: function(response) {
	            // Session has expired	            
        	    if (response.status == 403){
                        
                        $rootScope.loggedIn = false;
                        eventbus.broadcast(homer.modules.auth.events.userLoggedOut);                                                
                        $location.path(homer.modules.auth.routes.login);                                            
	            }
        	    return $q.reject(response);
        	}
	    };
	return sessionRecoverer;
     }])
     .config(['$httpProvider', function($httpProvider) {  
	    $httpProvider.interceptors.push('sessionRecoverer');
      }]);

}(angular, homer));
