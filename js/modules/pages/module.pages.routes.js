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

     homer.modules.pages.instance.config([
        '$stateProvider',                         
        function ($stateProvider) {
            $stateProvider.state(homer.modules.pages.state.home, {
                    url: homer.modules.pages.routes.home,
                    controller: homer.modules.pages.controllers.dashboard,
                    controllerAs: 'dashboard',
                    templateUrl: 'js/modules/pages/html/home.tmpl.html'
            })            
            
            $stateProvider.state(homer.modules.pages.state.search, {
                    url: homer.modules.pages.routes.search,
                    controller: homer.modules.pages.controllers.dashboard,
                    controllerAs: 'dashboard',
                    templateUrl: 'js/modules/pages/html/search.tmpl.html'
            })            
            
            $stateProvider.state(homer.modules.pages.state.result, {
                    url: homer.modules.pages.routes.result,
                    controller: homer.modules.pages.controllers.result,
                    templateUrl: 'js/modules/pages/html/result.tmpl.html',
                    resolve: {
                            user: function($q, userProfile) {
                              return userProfile.getAll();
                            }
                     }                     
            })            
                                    
            $stateProvider.state(homer.modules.pages.state.dashboard, {
                    url: homer.modules.pages.routes.dashboard,
                    controller: homer.modules.pages.controllers.dashboard,
                    controllerAs: 'dashboard',                            
                    templateUrl: 'js/modules/pages/html/dashboard.tmpl.html'
            })            
            
        }]);

}(angular, homer));