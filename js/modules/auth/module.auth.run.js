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

angular.module(homer.modules.auth.name).run([
    '$rootScope',
    '$location',
    '$state',
    '$stateParams',
    homer.modules.auth.services.authorization,
    homer.modules.auth.services.authentication,    
    homer.modules.core.services.profile,            
    function ($rootScope, $location, $state, $stateParams, authorization, authentication, userProfile, $q) {
    
        var routeChangeRequiredAfterLogin = false, loginRedirectUrl;    
        $rootScope.loggedIn = false;

        authentication.session().then(
		function (status) {
                	if(status.isAuthenticated) {                	    
	                    if(status.isAuthenticated == false) $location.path(homer.modules.auth.routes.login);
        	            else {
                	        $rootScope.loggedIn = true;
				$rootScope.currentUser.name = status.name;
				/* get user profile */
				userProfile.getAll();
				var path = $location.path();
				if(path == "/login" || path == "/logout") $location.path(homer.modules.pages.routes.home);
	                    }
        	        }
	                $rootScope.loggedIn = true;
	        },
		 /* bad response */
		function (results) {
        		console.log(results);
                        console.log("bad result");
			$location.path(homer.modules.auth.routes.login);
		}
	);
                
        $rootScope.$on('$routeChangeStart', function (event, next) {
        
                var authorised;            
            
                if (routeChangeRequiredAfterLogin && next.originalPath !== homer.modules.auth.routes.login) {
                    routeChangeRequiredAfterLogin = false;
                    $location.path(loginRedirectUrl).replace();
                } else if (next.access !== undefined) {
                
                    authorised = authorization.authorize(next.access.loginRequired, next.access.permissions, next.access.permissionCheckType);
                
                    if (authorised === homer.modules.auth.enums.authorised.loginRequired) {
                
                        routeChangeRequiredAfterLogin = true;
                        loginRedirectUrl = next.originalPath;
                        $location.path(homer.modules.auth.routes.login);
                    
                    } else if (authorised === homer.modules.auth.enums.authorised.notAuthorised) {
                
                        $location.path(homer.modules.auth.routes.notAuthorised).replace();                    
                    }
                }
         });                        
                                                                                                 
    }]);
}(angular, homer));
