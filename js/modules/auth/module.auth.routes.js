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

     angular.module(homer.modules.auth.name).config([
         '$stateProvider', '$urlRouterProvider',

        function ($stateProvider, $urlRouterProvider) {

           $stateProvider.state(homer.modules.auth.state.login, {
                 url: homer.modules.auth.routes.login,
                 controller: homer.modules.auth.controllers.login,
		 templateUrl: 'js/modules/auth/html/login.tmpl.html'
           });
           
           $stateProvider.state(homer.modules.auth.state.logout, {
                 url: homer.modules.auth.routes.logout,
                 controller: homer.modules.auth.controllers.logout,
		 templateUrl: 'js/modules/auth/html/logout.tmpl.html'
           });

           $stateProvider.state(homer.modules.auth.state.notAuthorised, {
                 url: homer.modules.auth.routes.notAuthorised,
                 controller: homer.modules.auth.controllers.login,
		 templateUrl: 'js/modules/auth/html/not-authorised.tmpl.html'
           });

	    //$urlRouterProvider.otherwise(homer.modules.auth.state.login);
	    $urlRouterProvider.otherwise(homer.modules.pages.routes.home);

	}]);

}(angular, homer));