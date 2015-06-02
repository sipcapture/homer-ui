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

    angular.module('homerCore', []).factory('search', [
        '$q',
	'$http',
        function ($q, $http) {
                                                                                                                
                
                var searchMessageById = function (data) {
                
                        var defer = $q.defer();
                                                            
                        $http.post('/api/search/share/message', data).then(
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
                
                var searchTransactionById = function (data) {
                
                        var defer = $q.defer();
                                                            
                        $http.post('/api/search/share/transaction', data).then(
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
                
                var makePcapTextforTransactionById = function (data, text) {
                
                        var defer = $q.defer();
                        
                        var url = '/api/search/share/export/';
                        
                        if(text == true) url+= "text";
                        else url+="pcap";
                                                            
                        $http.post(url, data, {responseType:'arraybuffer'}).then(
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
                
                return {
                   searchMessageById: searchMessageById,
                   searchTransactionById: searchTransactionById,
                   makePcapTextforTransactionById: makePcapTextforTransactionById
                };
          }
    ]);
}(angular, homer));
