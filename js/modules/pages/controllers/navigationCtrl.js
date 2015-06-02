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
        .controller(homer.modules.pages.controllers.navigation, [
        '$scope',        
        '$location',
        '$rootScope',
        'eventbus',
        homer.modules.auth.services.authentication,
        homer.modules.core.services.store,
        function ($scope, $location, $rootScope, eventbus, authentication, storeService) {
        
                $scope.showChilds = function(item){
                        console.log(item);
      			  item.active = !item.active;
		};		
		
		$scope.addNewDashboard = function(name){
			var id = '_' + new Date().getTime();
			var q = storeService.set(id, {
			        "title": name,
			        "structure": "4-8",
			        "rows": [{
			          "columns": [{
			            "styleClass": "col-md-4",
			            "widgets": []
			          },{
			            "styleClass": "col-md-8",
			            "widgets": []
			          }]
			        }]
			});

		   	storeService.getAll().then(function (status) {
        	                //that.model = status;
                	        $scope.items = status.data;
                	        $scope.items[2].active = true;
                	        console.log($scope.items[2]);
	                }, function () {
	                 })['finally'](function () {
			});     
		        		        
		};

		eventbus.subscribe(homer.modules.pages.events.newDashboardItem, function(event,args) {
                      $scope.addNewDashboard(args);
                });		
		    
		eventbus.subscribe(homer.modules.pages.events.dashBoardChanged , function(event,args) {
                      storeService.getAll().then(function (status) {
	                        console.log(status.data);
        	                //that.model = status;
                	        $scope.items = status.data;
                	        /* ugly hack ID of Dashboard == 2 */
                	        $scope.items[2].active = true;                	                                        
	                }, function () {
	                 })['finally'](function () {
                      });                           
                });


		storeService.getAll().then(function (status) {
                        //that.model = status;
                        $scope.items = status.data;
                }, function () {
                 })['finally'](function () {
		});                
        }
    ]);
}(angular, homer));
