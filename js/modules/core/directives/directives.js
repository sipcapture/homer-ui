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
    
    //angular.module(homer.modules.app.name, [])
    angular.module(homer.modules.core.name)
        // initiate body
	.directive('compareTo', function() {
	        return {
        	    scope: {
                	targetModel: '=compareTo'
	            },
        	    require: 'ngModel',
	            link: function postLink(scope, element, attrs, ctrl) {

        	        var compare = function() {

                	    var e1 = element.val();
	                    var e2 = scope.targetModel;

        	            if (e2 !== null) {
                	        return e1 === e2;
	                    }
	                    	                    	                                        
        	            return false;
	                };

                	scope.$watch(compare, function(newValue) {
        	            ctrl.$setValidity('errorCompareTo', newValue);
	                });

        	    }
	        };
	})
        .directive("scroll", function ($window) {
   		 return function(scope, element, attrs) {
		        angular.element($window).bind("scroll", function() {
			     if (this.pageYOffset >= 50) {
        		         scope.boolChangeClass = true;
		             } else {
				scope.boolChangeClass = false;
			     }
			     scope.$apply();
			});
		};
        })         
        .directive('autoHeight', ['$window', '$timeout', function($window, $timeout) {
                return function (scope, element) {
			var w = angular.element($window);
			scope.getWindowDimensions = function () {
				return { 'h': w.height(), 'w': w.width() };
			};
			scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
				scope.windowHeight = newValue.h;
				scope.windowWidth = newValue.w;
        			scope.style = function () {
				return { 
			                    'height': (newValue.h - 100) + 'px',
			                    'width': (newValue.w - 100) + 'px' 
			                };
				};
			}, true);

			w.bind('resize', function () {
				scope.$apply();
			});
		}
           }
        ]);

}(angular, homer));
	
