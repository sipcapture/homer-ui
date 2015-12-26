/**
 * homerModal - An angularJS modal directive / service with multiple window, resizing and draggable
 * @version v0.0.1
 * @license AGPLv2
 * @author Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 *
 * Based on ocModal
 * @author Olivier Combe <olivier.combe@gmail.com>
 */
(function() {
	'use strict';

	var homerModal = angular.module('homer.modal', []);

	homerModal.factory('$homerModal', ['$rootScope', '$controller', '$location', '$timeout', '$compile', '$sniffer', '$q', function($rootScope, $controller, $location, $timeout, $compile, $sniffer, $q) {
		var $body = angular.element(document.body),
			$dialogsWrapper = angular.element('<div role="dialog" tabindex="-1" class="modal2"></div>'),
			//$dialogsWrapper = angular.element('<div aria-hidden="true" aria-labelledby="myModalLabel" class="modal" draggable="" id="myModal" role="dialog" tabindex="-1">'),
			$modalWrapper = angular.element('<div class="modal-wrapper"></div>'),
			modals = {},
			openedModals = [],
			baseOverflow;

		// include the modal in DOM at start for animations
		$modalWrapper.css('display', 'none');
		$modalWrapper.append($dialogsWrapper);
		$body.append($modalWrapper);
		$dialogsWrapper.on('click', function(e) {
			if(angular.element(e.target).hasClass('modal-backdrop')) { // only if clicked on backdrop
				$rootScope.$apply(function() {
					self.closeOnEsc();
				});
			}
			e.stopPropagation();
		});

		var parseMaxTime = function parseMaxTime(str) {
			var total = 0, values = angular.isString(str) ? str.split(/\s*,\s*/) : [];
			angular.forEach(values, function(value) {
				total = Math.max(parseFloat(value) || 0, total);
			});
			return total;
		}

		var getAnimDuration = function getDuration($element) {
			var duration = 0;
			if(($sniffer.transitions || $sniffer.animations)) {
				//one day all browsers will have these properties
				var w3cAnimationProp = 'animation';
				var w3cTransitionProp = 'transition';

				//but some still use vendor-prefixed styles
				var vendorAnimationProp = $sniffer.vendorPrefix + 'Animation';
				var vendorTransitionProp = $sniffer.vendorPrefix + 'Transition';

				var durationKey = 'Duration',
					delayKey = 'Delay',
					animationIterationCountKey = 'IterationCount';

				//we want all the styles defined before and after
				var ELEMENT_NODE = 1;
				angular.forEach($element, function(element) {
					if(element.nodeType == ELEMENT_NODE) {
						var elementStyles = window.getComputedStyle(element) || {};

						var transitionDelay = Math.max(parseMaxTime(elementStyles[w3cTransitionProp + delayKey]),
							parseMaxTime(elementStyles[vendorTransitionProp + delayKey]));

						var animationDelay = Math.max(parseMaxTime(elementStyles[w3cAnimationProp + delayKey]),
							parseMaxTime(elementStyles[vendorAnimationProp + delayKey]));

						var transitionDuration = Math.max(parseMaxTime(elementStyles[w3cTransitionProp + durationKey]),
							parseMaxTime(elementStyles[vendorTransitionProp + durationKey]));

						var animationDuration = Math.max(parseMaxTime(elementStyles[w3cAnimationProp + durationKey]),
							parseMaxTime(elementStyles[vendorAnimationProp + durationKey]));

						if(animationDuration > 0) {
							animationDuration *= Math.max(parseInt(elementStyles[w3cAnimationProp + animationIterationCountKey]) || 0,
								parseInt(elementStyles[vendorAnimationProp + animationIterationCountKey]) || 0, 1);
						}

						duration = Math.max(animationDelay + animationDuration, transitionDelay + transitionDuration, duration);
					}
				});
			}

			return duration * 1000;
		}

		angular.element(document).on('keyup', function(e) {
			if (e.keyCode == 27 && openedModals.length > 0) {
				e.stopPropagation();
				$rootScope.$apply(function() {
					self.closeOnEsc(openedModals[openedModals.length - 1]);
				});
			}
		});

		var self = {
			waitingForOpen: false,

			getOpenedModals: function() {
				return openedModals;
			},

			register: function(params) {
				modals[params.id || '_default'] = params;
			},

			remove: function(id) {
				delete modals[id || '_default'];
			},

			open: function(opt) {
				if(typeof opt === 'string') {
					if(opt.match('<')) { // if html code
						opt = {
							template: opt
						}
					} else {
						opt = {
							url: opt
						}
					}
				}
				var modal = modals[opt.id || '_default'];
				if(!modal) {
					$dialogsWrapper.append($compile('<div homer-modal="'+(opt.id ? opt.id : '_default')+'"></div>')($rootScope));
					$timeout(function() { // let the ng-include detect that it's now empty
						self.open(opt);
					});
					return;
				} else if(modal && openedModals.indexOf(opt.id || '_default') !== -1) { // if modal already opened
					if(self.waitingForOpen) {
						return;
					}
					self.waitingForOpen = true;
					self.close(opt.id).then(function() {
						self.open(opt);
					})
					return;
				}
				// ok let's open the modal
				if(!self.waitingForOpen) {
					if(openedModals.length === 0) { // if no modal opened
						baseOverflow = document.body.style.overflow;
						document.body.style.overflow = 'hidden';
						$modalWrapper.css('display', 'block');
					} else {
						for(var i = 0, len = openedModals.length; i < len; i++) {
							var $e = modals[openedModals[i]].$element;
							modals[openedModals[i]].baseZIndex = $e.css('z-index');
							$e.css('z-index', '-1');
							$e.addClass('no-backdrop');
						}
					}
				}
				self.waitingForOpen = false;
				openedModals.push(opt.id || '_default');
				modal.params = opt;
				modal.$scope.customClass = modal.params.cls;
				modal.$scope.customId = opt.id ? opt.id : '_default';
				modal.$scope.divLeft = opt.divLeft ? opt.divLeft : '100px';
				modal.$scope.divTop = opt.divTop ? opt.divTop : '100px';

				// timeout for animations (if any)
				$rootScope.$digest();
				$body[0].offsetWidth; // force paint to be sure the element is in the page
				$timeout(function() {
					modal.$scope.modalShow = true;
				}, 100);

				if(typeof modal.params.onOpen === 'function') {
					modal.params.onOpen();
				}

				var off = modal.$scope.$on('$includeContentLoaded', function(event) { // on view load
					if(modal.params.init && !modal.params.isolate) {
						angular.extend(event.targetScope, modal.params.init);
					}
					if(typeof modal.params.controller === 'string') {
						$controller(modal.params.controller, {$scope: event.targetScope, $init: modal.params.init, $homerModalParams: modal.params}); // inject controller
					}
					off();
				});

				if(modal.params.template) {
					modal.$scope.modalTemplate = modal.params.template; // load the view
				} else if(modal.params.url) {
					modal.$scope.modalUrl = modal.params.url; // load the view
				} else {
					throw "You need to define a template or an url";
					return;
				}

				if(typeof callback === 'function') {
					modal.$scope.callbacksList.push(callback);
				}

				if(typeof modal.params.onOpen === 'function') {
					modal.params.onOpen();
				}

			},

			closeOnEsc: function(id) {
				if(modals[id || openedModals[openedModals.length -1]].params.closeOnEsc !== false) {
					return self.close(id);
				}
			},

			close: function(id) {
				var args,
					deferred = $q.defer();
				if(typeof id === 'string' && openedModals.indexOf(id) !== -1) {
					args = Array.prototype.slice.call(arguments, 1);
				} else {
					args = arguments;
				}
				if(typeof id === 'undefined' || openedModals.indexOf(id) === -1) {
					id = openedModals[openedModals.length -1];
				}
				var modal = modals[id || openedModals[openedModals.length -1]];
				if(modal && modal.$scope.modalShow === true) { // if the modal is opened
					var animDuration = getAnimDuration(angular.element(modal.$element[0].querySelector('.modal-content')));
					$timeout(function() {
						modal.$scope.modalShow = false;

						$timeout(function() {
							modal.$scope.$destroy();
							modal.$element.remove(); // destroy the modal

							modal.callbacksList = []; // forget all callbacks
							openedModals.splice(openedModals.indexOf(id || openedModals[openedModals.length -1]), 1);
							if(openedModals.length === 0) { // if no modal left opened
								if(!self.waitingForOpen) { // in case the current modal is closed because another opened with the same id (avoid backdrop flickering in firefox)
									document.body.style.overflow = baseOverflow; // restore the body overflow
									$modalWrapper.css('display', 'none');
								}
							} else {
								var topModal = modals[openedModals[openedModals.length - 1]];
								topModal.$element.css('z-index', topModal.baseZIndex);
								topModal.$element.removeClass('no-backdrop');
							}
							if(typeof modal.params.onClose === 'function') {
								modal.params.onClose.apply(undefined, args);
							}

							deferred.resolve();
						}, animDuration);
					});
				} else {
					deferred.resolve();
				}
				return deferred.promise;
			}
		};

		return self;
	}]);

	homerModal.directive('homerModal', ['$homerModal', '$compile', '$timeout', function($homerModal, $compile, $timeout) {
		return {
			restrict: 'AE',
			replace: true,
			scope: true,
			//template: '<div draggable class="modal-content white_content {{customClass}}" ng-class="{opened: modalShow}" ng-if="modalTemplate"></div>' +
			//	'<div draggable class="modal-content white_content {{customClass}}" ng-class="{opened: modalShow}" ng-include="modalUrl"></div>',

			template: '<div>' +
				'<div draggable class="modal-content {{customClass}}" ng-class="{opened: modalShow}" ng-if="modalTemplate"></div>' +
				'<div draggable id="{{customId}}" class="modal-content {{customClass}}" ng-class="{opened: modalShow}" ng-include="modalUrl" style="top: {{divTop}}; left: {{divLeft}}"></div>' +
			'</div>',
			

			link: function link($scope, $element, $attrs) {
				var id = $attrs.homerModal,
					$templateWrapper;

				$scope.closeModal = function() {
					var args = Array.prototype.slice.call(arguments);
					args.unshift(id);
					$homerModal.close.apply(undefined, args);
				};

				$homerModal.register({
					id: id,
					$scope: $scope,
					$element: $element
				});

				$element.on('$destroy', function() {
					$homerModal.remove(id);
				});

				$scope.$watch('modalTemplate', function(newVal, oldVal) {
					if(typeof newVal !== 'undefined') {
						if(!$templateWrapper) {
							$templateWrapper = angular.element($element.children()[1]);
						}
						$templateWrapper.append($compile(newVal)($scope));
						$scope.$emit('$includeContentLoaded');
					}
				});
			}
		}
	}]);

	homerModal.directive('homerModalOpen', ['$homerModal', function($homerModal) {
		return {
			restrict: 'A',
			require: '?modal',
			link: function($scope, $element, $attrs) {
				$element.on('click touchstart', function(e) {
					e.preventDefault();
					e.stopPropagation();
					var newScope = $scope.$new();
					var params = newScope.$eval($attrs.homerModalOpen);
					if(params) {
						if(typeof params === "number") {
							params = { url: $attrs.homerModalOpen };
						} else if(typeof params === "string") {
							params = { url: params };
						}
						if(!params.url) {
							throw "You need to set the modal url";
						}
						$scope.$apply(function() {
							$homerModal.open(params);
						});
					}
				});
			}
		};
	}]);

})();

/* Modernizr 2.8.2 (Custom Build) | MIT & BSD
 * Build: http://modernizr.com/download/#-flexbox-flexboxlegacy-cssclasses-testprop-testallprops-domprefixes
 */
(function(e,t,n){function x(e){f.cssText=e}function T(e,t){return x(prefixes.join(e+";")+(t||""))}function N(e,t){return typeof e===t}function C(e,t){return!!~(""+e).indexOf(t)}function k(e,t){for(var r in e){var i=e[r];if(!C(i,"-")&&f[i]!==n){return t=="pfx"?i:true}}return false}function L(e,t,r){for(var i in e){var s=t[e[i]];if(s!==n){if(r===false)return e[i];if(N(s,"function")){return s.bind(r||t)}return s}}return false}function A(e,t,n){var r=e.charAt(0).toUpperCase()+e.slice(1),i=(e+" "+p.join(r+" ")+r).split(" ");if(N(t,"string")||N(t,"undefined")){return k(i,t)}else{i=(e+" "+d.join(r+" ")+r).split(" ");return L(i,t,n)}}var r="2.8.2",i={},s=true,o=t.documentElement,u="modernizr",a=t.createElement(u),f=a.style,l,c={}.toString,h="Webkit Moz O ms",p=h.split(" "),d=h.toLowerCase().split(" "),v={},m={},g={},y=[],b=y.slice,w,E={}.hasOwnProperty,S;if(!N(E,"undefined")&&!N(E.call,"undefined")){S=function(e,t){return E.call(e,t)}}else{S=function(e,t){return t in e&&N(e.constructor.prototype[t],"undefined")}}if(!Function.prototype.bind){Function.prototype.bind=function(t){var n=this;if(typeof n!="function"){throw new TypeError}var r=b.call(arguments,1),i=function(){if(this instanceof i){var e=function(){};e.prototype=n.prototype;var s=new e;var o=n.apply(s,r.concat(b.call(arguments)));if(Object(o)===o){return o}return s}else{return n.apply(t,r.concat(b.call(arguments)))}};return i}}v["flexbox"]=function(){return A("flexWrap")};v["csstransforms"]=function(){return!!A("transform")};for(var O in v){if(S(v,O)){w=O.toLowerCase();i[w]=v[O]();y.push((i[w]?"":"no-")+w)}}i.addTest=function(e,t){if(typeof e=="object"){for(var r in e){if(S(e,r)){i.addTest(r,e[r])}}}else{e=e.toLowerCase();if(i[e]!==n){return i}t=typeof t=="function"?t():t;if(typeof s!=="undefined"&&s){o.className+=" "+(t?"":"no-")+e}i[e]=t}return i};x("");a=l=null;(function(e,t){function c(e,t){var n=e.createElement("p"),r=e.getElementsByTagName("head")[0]||e.documentElement;n.innerHTML="x<style>"+t+"</style>";return r.insertBefore(n.lastChild,r.firstChild)}function h(){var e=y.elements;return typeof e=="string"?e.split(" "):e}function p(e){var t=f[e[u]];if(!t){t={};a++;e[u]=a;f[a]=t}return t}function d(e,n,r){if(!n){n=t}if(l){return n.createElement(e)}if(!r){r=p(n)}var o;if(r.cache[e]){o=r.cache[e].cloneNode()}else if(s.test(e)){o=(r.cache[e]=r.createElem(e)).cloneNode()}else{o=r.createElem(e)}return o.canHaveChildren&&!i.test(e)&&!o.tagUrn?r.frag.appendChild(o):o}function v(e,n){if(!e){e=t}if(l){return e.createDocumentFragment()}n=n||p(e);var r=n.frag.cloneNode(),i=0,s=h(),o=s.length;for(;i<o;i++){r.createElement(s[i])}return r}function m(e,t){if(!t.cache){t.cache={};t.createElem=e.createElement;t.createFrag=e.createDocumentFragment;t.frag=t.createFrag()}e.createElement=function(n){if(!y.shivMethods){return t.createElem(n)}return d(n,e,t)};e.createDocumentFragment=Function("h,f","return function(){"+"var n=f.cloneNode(),c=n.createElement;"+"h.shivMethods&&("+h().join().replace(/[\w\-]+/g,function(e){t.createElem(e);t.frag.createElement(e);return'c("'+e+'")'})+");return n}")(y,t.frag)}function g(e){if(!e){e=t}var n=p(e);if(y.shivCSS&&!o&&!n.hasCSS){n.hasCSS=!!c(e,"article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}"+"mark{background:#FF0;color:#000}"+"template{display:none}")}if(!l){m(e,n)}return e}var n="3.7.0";var r=e.html5||{};var i=/^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i;var s=/^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i;var o;var u="_html5shiv";var a=0;var f={};var l;(function(){try{var e=t.createElement("a");e.innerHTML="<xyz></xyz>";o="hidden"in e;l=e.childNodes.length==1||function(){t.createElement("a");var e=t.createDocumentFragment();return typeof e.cloneNode=="undefined"||typeof e.createDocumentFragment=="undefined"||typeof e.createElement=="undefined"}()}catch(n){o=true;l=true}})();var y={elements:r.elements||"abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output progress section summary template time video",version:n,shivCSS:r.shivCSS!==false,supportsUnknownElements:l,shivMethods:r.shivMethods!==false,type:"default",shivDocument:g,createElement:d,createDocumentFragment:v};e.html5=y;g(t)})(this,t);i._version=r;i._domPrefixes=d;i._cssomPrefixes=p;i.testProp=function(e){return k([e])};i.testAllProps=A;o.className=o.className.replace(/(^|\s)no-js(\s|$)/,"$1$2")+(s?" js "+y.join(" "):"");return i})(this,this.document)
