/*
 * HOMER 5 UI (Xenophon)
 *
 * Copyright (C) 2011-2015 Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Copyright (C) 2011-2015 Lorenzo Mangani <lorenzo.mangani@gmail.com> QXIP B.V.
 * License AGPL-3.0 http://opensource.org/licenses/AGPL-3.0
 *
*/

'use strict';

angular.module('homer.widgets.alarm', ['adf.provider'])
  .value('alarmServiceUrl', 'api/v1/alarm/config')
  .config(function(dashboardProvider){
    dashboardProvider
      .widget('alarm', {
        title: 'Alarm Settings',
        group: 'Admin',
        name: 'alarm',
        description: 'Configure Alarm Triggers',
        templateUrl: 'js/widgets/alarm/alarm.html',
        controller: 'alarmCtrl',
        resolve: {
          alarms: function(alarmService, config){
              return alarmService.get();
          }
        },
        edit: {
          templateUrl: 'js/widgets/alarm/edit.html'
        }
      });
  })
  .service('alarmService', function($q, $http, alarmServiceUrl){
    return {
      get: function(){
        var deferred = $q.defer();
        $http.get(alarmServiceUrl+"/get")
          .success(function(data){
            if (data && data.data){
              deferred.resolve(data.data);
            } else {
              deferred.reject();
            }
          })
          .error(function(){
            deferred.reject();
          });

        return deferred.promise;
      },      
      save: function(ldata){
        var deferred = $q.defer();
        console.log(ldata);
        $http.post(alarmServiceUrl+"/new", ldata)
          .success(function(data){
            if (data && data.data){
              deferred.resolve(data.data);
            } else {
              deferred.reject();
            }
          })
          .error(function(){
            deferred.reject();
          });

        return deferred.promise;
      },
      update: function(ldata){
        var deferred = $q.defer();
        console.log(ldata);
        $http.post(alarmServiceUrl+"/edit", ldata)
          .success(function(data){
	      // console.log('ADM-ROW_DATA');
            if (data && data.data){
	      // console.log('ADM-ROW_DATA_IN');
              deferred.resolve(data.data);
            } else {
              deferred.reject();
            }
          })
          .error(function(){
            deferred.reject();
          });

        return deferred.promise;
      },
      delete: function($uid){
        var deferred = $q.defer();
        $http.delete(alarmServiceUrl+"/delete/"+$uid)
          .success(function(data){
	      // console.log('ADM-ROW_DATA');
            if (data && data.data){
	      // console.log('ADM-ROW_DATA_IN');
              deferred.resolve(data.data);
            } else {
              deferred.reject();
            }
          })
          .error(function(){
            deferred.reject();
          });

        return deferred.promise;
      }      
    };
  })
  .controller('alarmCtrl', function($scope, alarms, dialogs, alarmService, $timeout, $window, SweetAlert){

    // TAB FUNCTIONS DEFAULTS
    $scope.showtable = true;    
    $scope.inactiveTab = false;
    $scope.activeTab = true; $scope.editTab = false; $scope.newTab = false;    
    $scope.activeMainTab = true;
    $scope.disabled = false;

    $scope.removeAlarmTab = function (index) {
        $scope.activeTab = true; 
    	$scope.activeMainTab = true;
    	$scope.editTab = false; 
    	$scope.newTab = false;
    	$scope.activeNewTab = false; 
    	$scope.tabShown = true;
    };

    $scope.newAlarm = function() {
      	 $scope.newalarm = [];    
      	 $scope.activeTab = false; 
      	 $scope.activeNewTab = true;
      	 $scope.editTab = false; 
      	 $scope.newTab = true;
      	 $scope.activeMainTab = false;
     	 $scope.tabShown = false;    
    };
    $scope.editAlarm = function() {
      	 $scope.newalarm = [];    
      	 $scope.activeTab = false; 
      	 $scope.activeNewTab = true;
      	 $scope.editTab = true; 
      	 $scope.newTab = false;
      	 $scope.activeMainTab = false;
     	$scope.tabShown = false;    
    
    };
    
    $scope.addNewAlarm = function() {
      
        console.log("NEW Alarm");        
	$scope.errorNewAlarmShow = false;                                                
        $scope.removeAlarmTab();                             
        
	var ldata = {};        
        ldata['param'] = {
	        email: $scope.newalarm.email,
		name: $scope.newalarm.name,
		startdate: $scope.newalarm.startdate,
		stopdate: $scope.newalarm.stopdate,
		type: $scope.newalarm.type,
		value: $scope.newalarm.value,
		notify: $scope.newalarm.notify,
		active: $scope.newalarm.active				        
        };
        
        alarmService.save(ldata).then(function (mdata) {
		$scope.gridOptions.data.length = 0;
		$timeout(function(){
			$scope.gridOptions.data = mdata;
		});
        });                  
    };
    
    $scope.doEditAlarm = function() {
        
                console.log("Edit USER");
                $scope.editTab = false;
                $scope.newTab = false;
                $scope.activeNewTab = false;
                $scope.activeMainTab = true;
                $scope.activeTab = true;                                             
                $scope.errorEditAlarmShow = false;
                $scope.tabShown = true;

                var id = $scope.recalarm.id;

                console.log($scope.recalarm);
                console.log($scope.recalarm.value);
               
                var ldata = {};        
                ldata['param'] = {
                    email: $scope.recalarm.email,
                    name: $scope.recalarm.name,
                    startdate: $scope.recalarm.startdate,
                    stopdate: $scope.recalarm.stopdate,
                    value: $scope.recalarm.value,
                    type: $scope.recalarm.type,
                    notify: $scope.recalarm.notify,
                    active: $scope.recalarm.active,				        
                    id: id
                };
                
                console.log(ldata);
        
                alarmService.update(ldata).then(function (mdata) {
			$scope.gridOptions.data.length = 0;
			$timeout(function(){
				$scope.gridOptions.data = mdata;
			});
                });
        
    };
    
    $scope.doDeleteAlarm = function() {
      
        console.log("Delete USER");
        
        
        SweetAlert.swal({
   		title: "Are you sure?",
		text: "Your will not be able to recover this!",
		type: "warning",
		showCancelButton: true,
		confirmButtonColor: "#DD6B55",
		confirmButtonText: "Yes, delete it!",
		closeOnConfirm: true,
		closeOnCancel: true
		}, 
		function(isConfirm){ 

			if(isConfirm) 
			{
				console.log("DELEEEEEEEEEEEEEEEEEE");
				$scope.editTab = false;
			        $scope.newTab = false;
			        $scope.activeNewTab = false;
			        $scope.activeMainTab = true;
		        	$scope.activeTab = true;       
			        $scope.tabShown = true;                                      
        
		        	var uid = $scope.recalarm.id;
                
				alarmService.delete(uid).then(function (mdata) {
					$scope.gridOptions.data.length = 0;
					$timeout(function(){
						$scope.gridOptions.data = mdata;
					});
			        });
		        
	        		$scope.removeAlarmTab();
			}
		}
	);	
                
    };

    $scope.gridOptions = {
	showFooter: false,
	enableSorting: true,
	enableFiltering: true,
	multiSelect: false,
	enableRowSelection: false, 
	enableSelectAll: false,
	enableRowHeaderSelection: false,  
	rowTemplate: "<div ng-click=\"grid.appScope.onDblClickRow(row)\" ng-dblclick=\"grid.appScope.onDblClickRow(row)\" ng-repeat=\"(colRenderIndex, col) in colContainer.renderedColumns track by col.colDef.name\" class=\"ui-grid-cell\" ng-class=\"{ 'ui-grid-row-header-cell': col.isRowHeader }\" ui-grid-cell ></div>",
	noUnselect: true
    };

    $scope.gridOptions.rowIdentity = function(row) {
          return row.id;
    };

    $scope.gridOptions.onRegisterApi = function(gridApi){
                $scope.gridApi = gridApi;
    };      


    $scope.onDblClickRow = function(rowItem) {
	    // tab management
	    $scope.editTab = true;
    	    $scope.activeTab = false;
    	    $scope.newTab = false;
    	    $scope.recalarm = rowItem.entity;
    };
    
    $scope.Delete = function(row) {
          var index = $scope.gridOptions.data.indexOf(row.entity);
          $scope.gridOptions.data.splice(index, 1);
    };
     
    $scope.gridOptions.columnDefs = [
		{ name: 'id', enableCellEdit: false, width: 50 },
		{ name: 'name', displayName: 'Name' },
		{ name: 'startdate', displayName: 'Start date' , type: 'date', cellFilter: 'date:"yyyy-MM-dd"'},
		{ name: 'stopdate', displayName: 'Stop date' , type: 'date', cellFilter: 'date:"yyyy-MM-dd"'},
		{ name: 'type', displayName: 'Type' },
		{ name: 'value', displayName: 'Value' },
		{ name: 'notify', displayName: 'Notify' },
		{ name: 'email', displayName: 'Email' },
		{ name: 'createdate', displayName: 'Create date' , type: 'date', cellFilter: 'date:"yyyy-MM-dd"'},
		{ name: 'active', displayName: 'Active', type: 'boolean', width: 50 }
	      
      ];
    
      console.log('ADM-ROW_USER');
      console.log(alarms);
      $scope.gridOptions.data = alarms;
      //$scope.myData = users;

  })
   .controller('alarmSelectDialogCtrl',function($log,$scope,$modalInstance,data){

	// console.log('ADM-ROW_DBLCLICK');
        $scope.alarm = data;

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

        $scope.open = function($event, opened) {
                $event.preventDefault();
                $event.stopPropagation();
                $scope[opened] = true;
        };

        $scope.done = function(){
                $modalInstance.close($scope.timerange);
        }; // end done
    });

