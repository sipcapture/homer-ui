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
    
    defineHomerAngularModule(homer.modules.app.name)
    .controller("homerAppController", [ 
             "$scope", 
             '$rootScope', 
             'eventbus',
             '$state', 
             homer.modules.auth.services.authentication, 
             '$location',      
             'dialogs',
             homer.modules.core.services.profile,
             function($scope, $rootScope, eventbus, $state, authentication, $location, $dialogs) {

		 $rootScope.homerApp = 'HOMER';
		 $rootScope.homerVersion = '5.0.0beta1';

		 console.log('HOMER INIT:',$rootScope.homerVersion);

                 $scope.header="templates/empty.html";
                 $scope.menu="templates/empty.html";
                 $scope.ribbon="templates/empty.html";
                 $scope.footer="templates/empty.html";
                 $scope.shortcut="templates/empty.html";
                 $scope.templateSet = false;
                 $rootScope.currentUser = {};
                 
                 $scope.addDashBoard = function() {
                         var dlg = $dialogs.create('templates/dialogs/newdialog.html','newDashboardCtrl',{},{key: false,back: 'static'});
                         dlg.result.then(function(dashboardname){
                             /* upload is reserved name!!! */
                             if(dashboardname != "upload") 
                             {
                                  $scope.dashboardname = dashboardname;                                                
                                  eventbus.broadcast(homer.modules.pages.events.newDashboardItem, dashboardname);                         
                             }
                             else {
                                  eventbus.broadcast(homer.modules.pages.events.dashBoardChanged, dashboardname);                         
                             }
                         
                    },function(){
                        $scope.name = 'No name, defaulting to New';
                    });                                                               
                 };
                                                                        
                 $scope.showLeftMenu = false;                                       
                 $scope.boolLeftMenu = false;                        
                 
                 //globalWidgetReload
                 $scope.boolDropDownAlert = false;                 
                 $scope.boolDropDownUserMenu = false;                 
                 $scope.boolDropDownSearch = false;                
                 
                 $scope.changeClass = function() { 
                     $scope.boolLeftMenu = !$scope.boolLeftMenu;
                     eventbus.broadcast('globalWidgetRecreate', 1);
                     
                 };                                                                                      

                 $scope.triggerDoSearch = function() { 
                     $scope.boolLeftMenu = false;
                     
                 };                                                                                      

                 $scope.expandLeftMenu = function() {
                     $scope.boolLeftMenu = false;                     
                 };                                                                                      
                                                               

                 $scope.showAlertBox = function() { $scope.boolDropDownAlert = !$scope.boolDropDownAlert; };              
                 $scope.showSearchBox = function() { $scope.boolDropDownSearch = !$scope.boolDropDownSearch; };                            
                 $scope.showUserMenuBox = function() { $scope.boolDropDownUserMenu = !$scope.boolDropDownUserMenu; };                              
                 $scope.showLastMenuBox = function() { $scope.boolDropDownLastMenu = !$scope.boolDropDownLastMenu; };               
                 $scope.showRefreshMenuBox = function() { $scope.boolDropDownRefreshMenu = !$scope.boolDropDownRefreshMenu; };               

		 $scope.searchClass = "btn btn-primary";

                 $scope.showMenu = function() {
                      $scope.showLeftMenu = !$scope.showLeftMenu;
                 }
                 
                 $scope.doLogout = function() {
                      $scope.showLeftMenu = false;                      
                      $scope.dropDownUserMenuClass = "";
                      $location.path(homer.modules.auth.routes.logout);
                 }
                                                                              
                 eventbus.subscribe(homer.modules.auth.events.userLoggedIn , function(event,args) {
                      if(!$scope.templateSet)
                      {
                           $scope.showLeftMenu = true;
                           $scope.header="templates/header.html";
                           $scope.menu="templates/left-panel.html";
                           $scope.ribbon="templates/ribbon.html";
                           $scope.footer="templates/footer.html";
                           $scope.shortcut="templates/shortcut.html";
                           $scope.templateSet = true;
                           
                           /* workaround for Reload */
                           if($state.current.name != "" && $state.current.name != "login") {
                               $state.go($state.current, {}, {reload: true});
                           }
                           
                           /*                           
                           $state.transitionTo($state.current, {}, {
                                reload: true,
                                inherit: false,
                                notify: true
                           });
                           */
                       }
                 });
                 
                 eventbus.subscribe(homer.modules.auth.events.userLoggedOut , function(event,args) {
                      $scope.showLeftMenu = false;
                      if($scope.templateSet) {
                           $scope.header=null;
                           $scope.menu=null;
                           $scope.ribbon=null;
                           $scope.footer=null;
                           $scope.shortcut=null;
                           $scope.templateSet = false;                           
                      }
                      
                 });
                 
                 eventbus.subscribe(homer.modules.pages.events.hideLeftMenu , function(event,args) {
                      $scope.boolLeftMenu = true;
                 });                                        
             }                          
    ])
    
    .controller("HomerDatepickerCtrlTest", [ "$scope",  '$rootScope', 
    
             function($scope, $rootScope) {

			$scope.today = function() {
				$scope.dt = new Date();
			};
			
			$scope.today();
			$scope.clear = function () {
				$scope.dt = null;
			};

			$scope.toggleMin = function() {
				$scope.minDate = $scope.minDate ? null : new Date().setFullYear(2013, 0, 1);;
				$scope.maxDate = $scope.maxDate ? null : new Date().setFullYear(2032, 0, 1);;
			};
			
			$scope.toggleMin();

			$scope.open = function($event, opened) {
			    $event.preventDefault();
			    $event.stopPropagation();
			    $scope[opened] = true;
			};
			
			$scope.dateOptions = {
				formatYear: 'yy',
				startingDay: 1
			};

			$scope.formats = ['yyyy/MM/dd', 'yyyy-MM-dd', 'dd.MM.yyyy', 'shortDate'];
			$scope.format = $scope.formats[1];

			$scope.deleteDashboard = function() {
				angular.element('#deleteThisDash').click();
			};

             }                          
    ])    
    
    .controller("HomerDatepickerCtrl", function($scope, dialogs, userProfile, eventbus, $interval) {
           //== Variables ==//
               
                var dt = new Date(new Date().setHours(new Date().getHours() - 2 ));
		$scope.timerange = userProfile.profileScope.timerange;
		var stop;

                /* update if timerange will be changed */
                (function () {
                      $scope.$watch(function () {
                            return userProfile.profileScope.timerange;
                      }, function (newVal, oldVal) {
                            if ( newVal !== oldVal ) {
                                $scope.timerange = newVal;
                            }
                        });
                }());
				
                $scope.toggleMin = function() {
                    $scope.minDate = $scope.minDate ? null : new Date().setFullYear(2013, 0, 1);;
                    $scope.maxDate = $scope.maxDate ? null : new Date().setFullYear(2032, 0, 1);;
                };
    
                $scope.toggleMin();                                        
                
		$scope.dateOptions = {
                	formatYear: 'yy',
                        startingDay: 1
                };
                          
		$scope.formats = ['yyyy/MM/dd', 'yyyy-MM-dd', 'dd.MM.yyyy', 'shortDate'];
		$scope.format = $scope.formats[1];		                         
    
		//== Methods ==//
		$scope.launch = function(){
			var dlg = dialogs.create('templates/dialogs/timerange.html','timerangeDialogCtrl',$scope.timerange);
			dlg.result.then(function(timerange){
			    $scope.timerange = timerange;
			    userProfile.setProfile("timerange", $scope.timerange);
	        	});
        	}; // end launch
		$scope.last = function(min){
	                var dt = new Date(new Date().setMinutes(new Date().getMinutes() - min ));
			$scope.timerange = {
			      from: dt,
			      to: new Date()
			};
			userProfile.setProfile("timerange", $scope.timerange);
			eventbus.broadcast('globalWidgetReload', 1);
        	}; // end last

		$scope.refresh = function(seconds){
			//eventbus.broadcast('globalWidgetReload', 1);
			console.log("REFRESH:"+seconds);
			
                        seconds = parseInt(seconds);
			
			if(seconds < 1) {
			      eventbus.broadcast('globalWidgetReload', 1);
			      return;			
			}			
			// Don't start a new fight if we are already fighting
			if ( angular.isDefined(stop) ) {
			        $scope.cancelRefresh();
			        return;
                        }
			
			$scope.activeInterval = true;
			
			stop = $interval(function() {			    
			    $scope.timerange.from.setSeconds($scope.timerange.from.getSeconds() + seconds);
			    $scope.timerange.to.setSeconds($scope.timerange.to.getSeconds() + seconds);						
      			    userProfile.setProfile("timerange", $scope.timerange);			     			
			    eventbus.broadcast('globalWidgetReload', 1);			    			    
			}, seconds * 1000);
	        };

        	$scope.cancelRefresh = function(){
			//eventbus.broadcast('globalWidgetReload', 1);
			if (angular.isDefined(stop)) {
				$interval.cancel(stop);
				stop = undefined;
				$scope.activeInterval = false;
			}

        	}; // end refresh

    }) 
    .controller('timerangeDialogCtrl',function($log,$scope,$modalInstance,data){

    	$scope.timerange = data;
    	
    	$scope.hstep = 1;
        
        $scope.mstep = 15;
        $scope.options = {
            hstep: [1, 2, 3],
            mstep: [1, 5, 10, 15, 25, 30]
        };                                    
                                 
	//== Listeners ==//
	$scope.$watch('timerange.from',function(val,old){
	      $log.info('Date Changed: ' + val);
	      $scope.opened = false;
	});
        
	//== Methods ==//
	$scope.setDate = function(){
	      if(!angular.isDefined($scope.timerange.from)) $scope.timerange.from = new Date(); // today
	      if(!angular.isDefined($scope.timerange.to)) $scope.timerange.to = new Date(); // today
	};

	$scope.setDate();
    
	$scope.open = function($event, opened) {
        	$event.preventDefault();
                $event.stopPropagation();
                $scope[opened] = true;
        };

	$scope.done = function(){
		$modalInstance.close($scope.timerange);
	}; // end done
    }) // end customDialogCtrl
    .config(function(dialogsProvider){
	    // this provider is only available in the 4.0.0+ versions of angular-dialog-service
	    dialogsProvider.useBackdrop(true);
	    dialogsProvider.useEscClose(true);
	    dialogsProvider.useCopy(false);
	    dialogsProvider.setSize('sm');
    }) // end config
    .controller('newDashboardCtrl',function($scope,$modalInstance,data, FileUploader){
	  $scope.dashboard = {name : ''};
	  $scope.cancel = function(){
	    $modalInstance.dismiss('canceled');  
	  }; // end cancel
    
	   $scope.hitEnter = function(evt){
		if(angular.equals(evt.keyCode,13) && !(angular.equals($scope.dashboard,null) || angular.equals($scope.dashboard,'')))
		$scope.save();
	   }; // end hitEnter


	   var uploader = $scope.uploader = new FileUploader({
          		url: '/api/dashboard/upload'
           });

	   $scope.save = function(){
	       if($scope.uploader.queue.length > 0) {
	               uploader.uploadAll();
	       }
	       else {
	              if($scope.nameDialog.$valid) $modalInstance.close($scope.dashboard.name);
               }
	   }; // end save

	    // FILTERS
	   uploader.filters.push({
           	name: 'customFilter',
		fn: function(item /*{File|FileLikeObject}*/, options) {
                	return this.queue.length < 1;
		}
	   });  
  
            uploader.onCompleteAll = function() {
            	console.info('onCompleteAll');
            	$modalInstance.close("upload");
	    };
  	    

    }) // 
    ;
                                                                                              
}(angular, homer));
