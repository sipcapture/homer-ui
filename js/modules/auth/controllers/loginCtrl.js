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

    angular.module(homer.modules.auth.name).controller(homer.modules.auth.controllers.login, [
        '$rootScope',
        '$scope',
        '$location',
        '$uibModal',
        homer.modules.auth.services.authentication,
        homer.modules.core.services.profile,
        function ($rootScope, $scope, $location, $uibModal, authentication, userProfile) {
            $scope.loginModel = {};
            $scope.isBusy = false;
            $scope.invalidLogin = false;
            $rootScope.loggedIn = false;
            
            $scope.login = function () {
	                    console.log('Submiting user info.');
	                    $scope.invalidLogin = false;
                            $scope.isBusy = true;
                            authentication.login($scope.loginModel.username, $scope.loginModel.password).then(function (status) {
                                $scope.isBusy = false;                                                            
                                if(status.isAuthenticated == true) {
                                    $rootScope.loggedIn = true;
                                    /* retrive our profile */
                                    console.log(userProfile);
                                    userProfile.getAll();
                                    $location.path(homer.modules.pages.routes.home);                                        
                                }
                                else {
                                    $scope.invalidLogin = true;
                                }                    
                            }, function () {
                                $scope.invalidLogin = true;
                            })['finally'](function () {
                                $scope.isBusy = false;
                            });	                    	                    
            };            
        }
    ]);
    
    angular.module(homer.modules.auth.name).controller(homer.modules.auth.controllers.logout, [
        '$rootScope',
        '$scope',
        '$location',
        homer.modules.auth.services.authentication,
        function ($rootScope, $scope, $location, authentication) {

            $rootScope.loggedIn = false;
            
            authentication.logout().then(function (status) {            
                $location.path(homer.modules.auth.routes.login);
            },
            function () {
                $location.path(homer.modules.auth.routes.login);
            }
            
            );
                                                                    
        }
    ]);
    
}(angular, homer));