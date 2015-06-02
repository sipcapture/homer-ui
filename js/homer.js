/*
 * HOMER 5 UI (Xenophon)
 *
 * Copyright (C) 2011-2015 Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Copyright (C) 2011-2015 Lorenzo Mangani <lorenzo.mangani@gmail.com> QXIP B.V.
 * License AGPL-3.0 http://opensource.org/licenses/AGPL-3.0
 *
*/

(function (window) {
    'use strict';

    var homer = window.homer = window.homer || {};

    homer.modules = {
        app: {
            name: 'homerApp'
        }
    };
    
}(window));

function isUndefined(a) {
    return typeof a == "undefined"
}

function defineHomerAngularModule(a, b) { return angular.module(a, b) }

function defineHomerJsLibrary(b, a, d) {
    if (isUndefined(d)) {
        	d = a;
	        a = [];
        	if (d instanceof Array) {
	            for (var c = 0; c < d.length - 1; ++c) {
        	        a.push(d[c])
		    }
       		}
    }

    return angular.module(b, a).factory(b, d)
}
