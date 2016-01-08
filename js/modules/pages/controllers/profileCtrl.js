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
        .controller(homer.modules.pages.controllers.profile, [
        '$scope',       
        '$state',       
        '$stateParams',
        '$location',
        '$rootScope',
        'eventbus',
        homer.modules.auth.services.authentication,
        '$uibModal',
        function ($scope, $state, $stateParams, $location, $rootScope, eventbus, authentication, $uibModal) {
        
            this.name = $stateParams.boardID;            
            var that = this;
                        
	    this.editProfile = function(currentUser) {

		 var editProfileScope = $scope.$new();

                 editProfileScope.profile = currentUser;

	         var instance = $uibModal.open({
        	    scope: editProfileScope,   
	            templateUrl: 'templates/dialogs/profile-edit.html',
        	    backdrop: 'static',
	            windowClass: 'center-modal'
        	  });        	  
        	  
	         editProfileScope.saveProfile = function(){
        	    that.saveProfile(editProfileScope.profile);
        	    instance.close();
        	    editProfileScope.$destroy();        	                         
	         };
        	 
        	 editProfileScope.closeDialog = function(){
        	 
                    console.log(editProfileScope);
	            // copy the new title back to the model   
        	    //model.title = editProfileScope.copy.title;
	            // close modal and destroy the scope
        	    instance.close();
	            editProfileScope.$destroy();
        	 };
            };
            
            this.saveProfile = function(curentProfile) {
            
                  authentication.updateUser(curentProfile).then(function (curentProfile) {
                            console.log("updated");                            
                        }, function () {
                                
                        })['finally'](function () {
                                $scope.isBusy = false;
                        });                  
            };
           
            eventbus.subscribe(homer.modules.pages.events.showUserProfile, function(event,name, model) {
	    
			authentication.fullUser().then(function (user) {
                                if(user.auth == true) {
  				    that.editProfile(user.data);
                                }
                                else {
                                    console.log("couldnt retrieve user");
                                }
                        }, function () {
                                
                        })['finally'](function () {
                                $scope.isBusy = false;
                        });

            });
        }
    ]);
}(angular, homer));
