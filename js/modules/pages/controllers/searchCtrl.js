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

    angular.module(homer.modules.pages.name)
     .controller(homer.modules.pages.controllers.search, [
	'$scope',
        '$rootScope',
        'eventbus',        
        '$http',
        '$location',
        homer.modules.core.services.search,
        homer.modules.core.services.store,
        function ($scope,$rootScope, eventbus, $http, $location, search, storeService) {
        
            //$rootScope.loggedIn = false;
            $scope.expandme = true;
            $scope.showtable = false;
            
            if($rootScope.loggedIn == false) {
                console.log("AUTH FALSE");
                $location.path(homer.modules.auth.routes.login);
                return;                                         
            }
            else {
                console.log("AUTH TRUE");            
            }
                        
             $scope.colapseForm = function() {
		 $scope.expandme = !$scope.expandme;
                // $scope.expandme = true;
             };
             
             $scope.removeForm = function() {
                 $scope.expandme = false;
             };


             // process the form
             $scope.processSearchForm = function(t) {
                  
                  $scope.showtable = true;
                  $scope.expandme = false;
                  
                  var timedate = search.getTimeRange();

                  var data = {
                        timestamp: {
                              from: timedate.fromdate.getTime(),
                              to: timedate.todate.getTime()
                        },
                        param: {
                          transaction: {
                              call: true,                                                
                              registration: true,                                                
                              rest: true                                                
                          },                          
                          limit: 100
                        }
                  }                                    

                  /* save data for next search */
                  search.setSearchData(data);                  
                  search.setSearchValue(search.searchValue);
                  search.searchValue = {};                                                      

                  var batch = [                  
                      {name: 'timestamp', value: data.timestamp},
                      {name: 'param', value: data.param}                     
                  ];                  
                  
                  
		   storeService.setProfile(null, batch).then( function (sdata) {

                   });
                                                      
                   eventbus.broadcast(homer.modules.pages.events.resultSearchSubmit, "fullsearch");                                                      
                    
                    /* now redirect to result */
                   $location.path('/result');                                    
             }; 
        }        
    ]);           
}(angular, homer));
