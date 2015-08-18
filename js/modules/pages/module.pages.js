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

    homer.modules.pages = {
        name: 'pages',
        controllers: {
            default: 'defaultCtrl',
            search: 'searchCtrl',
            result: 'resultCtrl',
            dashboard: 'dashboardCtrl',
            navigation: 'navigationCtrl'
        },
        routes: {
            home: '/dashboard/home',
            search: '/dashboard/search',
            alarm: '/dashboard/alarm',
            result: '/result',
            dashboard: '/dashboard/:boardID'
        },
	events: {
            dashBoardChanged: 'dashboard:item:changed',
	    newDashboardItem: 'dashboard:new:item',
	    adfEvent: 'adfDashboardChanged',
	    adfDeleteEvent: 'adfDashboardRequestedForDelete',
	    widgetsReload: 'widgetReload',
	    resultSearchSubmit: 'resultSearchSubmit',
	    hideLeftMenu: 'hideLeftMenu',
	    destroyRefresh: 'destroyRefresh'	    
        },
        state: {
            home: 'home',
            search: 'search',
            result: 'result',
            dashboard: 'dashboard'
        }
    };

    homer.modules.pages.instance = angular.module(homer.modules.pages.name, ['ui.router']);
    
}(angular, homer));
