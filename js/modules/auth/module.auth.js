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

    homer.modules.auth = {
        name: 'auth',
        enums: {
            authorised: {
                authorised: 0,
                loginRequired: 1,
                notAuthorised: 2
            },
            permissionCheckType: {
                atLeastOne: 0,
                combinationRequired: 1
            }
        },
        events: {
          userLoggedIn: 'auth:user:loggedIn',
          usernotAuthorised: 'auth:user:notauthorised',
          userLoggedOut: 'auth:user:loggedOut'
        },
        controllers: {
            login: 'loginCtrl',
            logout: 'logoutCtrl'
        },
        services: {
            authentication: 'authentication',
            authorization: 'authorization'
        },
        routes: {
            login: '/login',
            logout: '/logout',
            notAuthorised: '/not-authorised'
        },
        state: {
            login: 'login',
            logout: 'logout',
            notAuthorised: 'notauthorised'
        }
    };

    angular.module(homer.modules.auth.name, [
        'ui.router',
        homer.modules.core.name
    ]);


}(angular, homer));