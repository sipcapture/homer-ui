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
        .controller(homer.modules.pages.controllers.default, [
        '$location',
        '$rootScope',
        homer.modules.auth.services.authentication,
        function ($location, $rootScope, authentication) {

            if($rootScope.loggedIn == false) {
                console.log("AUTH FALSE");
                $location.path(homer.modules.auth.routes.login);
                return;                                         
            }
            else {
                console.log("AUTH TRUE");            
            }            
        }        
    ]);           
}(angular, homer));
