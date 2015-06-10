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
                        
                        $http.post('api/search/data', mdata, {handleStatus:[403,503]}).then(
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
                                                            
                        $http.post('api/search/method', data , {handleStatus:[403,503]}).then(
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
                                                            
                        $http.post('api/search/message', data, {handleStatus:[403,503]}).then(
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
                                                            
                        $http.post('api/search/transaction', data, {handleStatus:[403,503]}).then(
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
                                                            
                        $http.post('api/report/rtcp', data, {handleStatus:[403,503]}).then(
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
                                                            
                        $http.post('api/report/log', data, {handleStatus:[403,503]}).then(
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
                                                            
                        $http.post('api/report/quality/'+type, data, {handleStatus:[403,503]}).then(
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
                                                            
                        $http.get('api/dashboard/node', {handleStatus:[403,503]}).then(
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
                
                var makePcapTextforTransaction = function (data, text) {
                
                        var defer = $q.defer();
                        
                        var url = 'api/search/export/';
                        
                        if(text == true) url+= "text";
                        else url+="pcap";
                                                            
                        $http.post(url, data, {responseType:'arraybuffer', handleStatus:[403,503]}).then(
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
                
                var makePcapTextData = function (data, text) {
                

                        var defer = $q.defer();
                        
                        var url = 'api/search/export/data/';
                        if(text == true) url+= "text";
                        else url+="pcap";

                        $http.post(url, data, {responseType:'arraybuffer', handleStatus:[403,503]}).then(
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
                                                            
                        $http.post('api/search/sharelink', data, {handleStatus:[403,503]}).then(
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
