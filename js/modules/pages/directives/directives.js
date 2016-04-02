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
        .directive('resize', function ($window) {
        	return function (scope, element) {
		        var w = angular.element($window);
			scope.getWindowDimensions = function () {
		                return { 'h': w.height(), 'w': w.width() };
		        };

			scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
				// resize Grid to optimize height
				$('.gridStyle').height(newValue.h - 180);
			}, true);

			w.bind('resize', function () {
                		scope.$apply();
			});
        	}
	})
	.directive('pwCheck', [function () {
            return {
              require: 'ngModel',
              link: function (scope, elem, attrs, ctrl) {
                var firstPassword = '#' + attrs.pwCheck;

                elem.add(firstPassword).on('keyup', function () {
                  scope.$apply(function () {
                    var v = elem.val()===$(firstPassword).val();
                    ctrl.$setValidity('pwmatch', v);
                  });
                });
              }
            }
        }])  
        .directive('afterRender', ['$window', '$timeout', function($timeout) {
	        return {
	            restrict : 'A', 
	            terminal : true,
	            transclude : false,
        	    link: function(scope, element, attrs) {
	                var combineHeights, siblings;
	                if (attrs) { scope.$eval(attrs.afterRender) }
                        scope.$emit('onAfterRender')	                
	            }
        	};
	    }
        ])
        .directive('modal', function () {
    		return {
		      template: '<div class="modal fade">' + 
		          '<div class="modal-dialog">' + 
		            '<div class="modal-content">' + 
		              '<div class="modal-header">' + 
		                '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' + 
		                '<h4 class="modal-title">{{ title }}</h4>' + 
		              '</div>' + 
		              '<div class="modal-body" ng-transclude></div>' + 
		            '</div>' + 
		          '</div>' + 
		        '</div>',
		     restrict: 'E',
		     transclude: true,
		     replace:true,
		     scope:true,
		     link: function postLink(scope, element, attrs) {
		        scope.title = attrs.title;		
		        scope.$watch(attrs.visible, function(value){
			          if(value == true) $(element).modal('show');
			          else $(element).modal('hide');
		        });

			$(element).on('shown.bs.modal', function(){
				scope.$apply(function(){
			            scope.$parent[attrs.visible] = true;
				});
			});

			$(element).on('hidden.bs.modal', function(){
			         scope.$apply(function(){
					scope.$parent[attrs.visible] = false;
	 			 });
		        });
		    }
    	       };
	 })
	 .directive('draggable', function(){
	    return {
	      restrict: 'EA',
	      link: function(scope, element) {
	      	
	             	$(element).bind('mouseup', function(ui){
                                var elements=document.getElementsByClassName('opened');
                                for(i=0;i<elements.length;i++){if(!elements[i].style.zIndex){elements[i].style.zIndex=10001;}}
                                if (window.topZ){window.topZ++;ui.currentTarget.style.zIndex = window.topZ; }
                                else{ui.currentTarget.style.zIndex++;window.topZ = ui.currentTarget.style.zIndex;}
                                ui.currentTarget.style.opacity=1;
                        });

		        $(element)
		        .draggable({
		              cancel: ".homer-modal-body, .close",
		              handle: ".homer-modal-header",
		              start: function( event, ui ) {
		              	ui.helper[0].style.opacity=0.7;
                                var elements=document.getElementsByClassName('opened');
                                for(i=0;i<elements.length;i++){if(!elements[i].style.zIndex){elements[i].style.zIndex=10001;}}
                                if (window.topZ){window.topZ++;ui.helper[0].style.zIndex = window.topZ; }
                                else{ui.helper[0].style.zIndex++;window.topZ = ui.helper[0].style.zIndex;}
                              },
		              stop: function( event, ui ) {
                                if (ui.helper[0]) {
                                	ui.helper[0].style.opacity=1;
                                        if (ui.offset.top < 0) ui.helper[0].style.top = '0px';
                                        if (ui.offset.left < 0) {
                                                if ((ui.helper[0].offsetWidth + ui.offset.left ) < 100) ui.helper[0].style.left = '-' + (ui.helper[0].offsetWidth - 100) +'px';
                                        }
                                        if ((ui.offset.left + 100 ) > window.innerWidth) {
                                                ui.helper[0].style.left = (window.innerWidth - 100)+'px';
                                                window.scrollTo(0, 0);
                                        }
                                        if ((ui.offset.top + 50 ) > window.innerHeight) {
                                                ui.helper[0].style.top = (window.innerHeight - 50)+'px';
                                                window.scrollTo(0, 0);
                                        }

                                }
                              }

		        })
			.resizable({
			    resize: function (evt, ui) {
				var canv = $(element).find('#cflowcanv');
				if($(canv).length > 0) scope.reDrawCanvas();                                				
				var messagebody = $(element).find('.homer-modal-body');
				$(messagebody).width(ui.size.width - 10);
				$(messagebody).height(ui.size.height - 50);				
			    }
			});
	        }
	     }  
         });
}(angular, homer));





