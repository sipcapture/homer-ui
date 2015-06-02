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

    homer.modules.admin = {
        name: 'admin',
        controllers: {
            users: 'userListCtrl'
        },
        routes: {
            users: '/users'
        },
        state: {
            users: 'users'
        }
    };

    defineHomerAngularModule(homer.modules.admin.name, [
        'ui.router'
    ]);


}(angular, homer));