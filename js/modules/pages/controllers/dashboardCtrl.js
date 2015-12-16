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
        .controller(homer.modules.pages.controllers.dashboard, [
        '$scope',       
        '$state',       
        '$stateParams',
        '$location',
        '$rootScope',
        'eventbus',
        homer.modules.auth.services.authentication,
        homer.modules.core.services.store,
        'SweetAlert',
        function ($scope, $state, $stateParams, $location, $rootScope, eventbus, authentication, storeService, SweetAlert) {
        
            if($rootScope.loggedIn == false) {
                console.log("AUTH FALSE DASHBOARD");
                $location.path(homer.modules.auth.routes.login);
                return;                                         
            }
            else {
                console.log("AUTH TRUE DASHBOARD");

                if (sipcaptureWdgt) { // Clear d3 events
                    sipcaptureWdgt.d3.clear();
                }  
            }            
        
            if($state.current.name == "search") $stateParams.boardID = "search";
            else if($state.current.name == "home") $stateParams.boardID = "home";
            else if($state.current.name == "alarm") $stateParams.boardID = "alarm";

            this.name = $stateParams.boardID;            
            var that = this;

            storeService.get($stateParams.boardID).then(function (status) {
            
                        var currentUser = authentication.getCurrentLoginUser();
                        $rootScope.dashboardEditable = false;
                        if(currentUser.permissions.indexOf("admin") > -1) $rootScope.dashboardEditable = true;
			that.model = status;
            });

	    this.delete = function(id){
        		SweetAlert.swal({
				title: "Are you sure?",
                		text: "Your will not be able to recover this!",
				type: "warning",
				showCancelButton: true,
		                confirmButtonColor: "#DD6B55",
                		confirmButtonText: "Yes, delete it!",
		                closeOnConfirm: true,
                		closeOnCancel: true  
	                },
        	        function(isConfirm){
	
        	                if(isConfirm)
                	        {
					storeService.delete(id);
					$location.path('/home');
					eventbus.broadcast(homer.modules.pages.events.dashBoardChanged, id); 		                
	                        }
        		});
	    };
            
	    eventbus.subscribe(homer.modules.pages.events.adfEvent , function(event,name, model) {
	        storeService.set(name, model);
	        var protect = false;
	        var icon = "";
	        var title = "";
	        var weight = 10;
	        var alias = "";
	        if(model.hasOwnProperty("protect")) protect = model.protect;
	        if(model.hasOwnProperty("title")) title = model.title;
	        if(model.hasOwnProperty("weight")) weight = model.weight;
	        if(model.hasOwnProperty("alias")) alias = model.alias;
	        if(model.hasOwnProperty("selectedItem")) icon = model.selectedItem;	       	       
	        
	        var data = {
                   param: {
    	               protect: protect,
    	               title: title,
    	               weight: weight,
    	               alias: alias,
	               icon: icon	       
                   }
                }
	       
	        storeService.menu(name, data).then(function (status) {
			console.log("update");
        	}, function () {
                	console.log("wrong reply");
                 })['finally'](function () {
                        eventbus.broadcast(homer.modules.pages.events.dashBoardChanged, name);	                              
                });

            });
            
            eventbus.subscribe(homer.modules.pages.events.adfDeleteEvent , function(event, name) {
                    that.delete(name);
            });
        }
    ]);
}(angular, homer));
