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

    angular.module(homer.modules.admin.name).config([
         '$stateProvider', '$urlRouterProvider',      
        function ($stateProvider, $urlRouterProvider) {
        
            $stateProvider.state(homer.modules.admin.state.users, { 
                    url: homer.modules.admin.routes.users,
                    controller: homer.modules.admin.controllers.users,
                    templateUrl: "js/modules/admin/html/users.tmpl.html",
                    access: {
                         loginRequired: true,  
                         permissions: ['Admin']
                    }
             });
        }]);

}(angular, homer));