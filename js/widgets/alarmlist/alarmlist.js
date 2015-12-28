/*
 * HOMER 5 UI (Xenophon)
 *
 * Copyright (C) 2011-2015 Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Copyright (C) 2011-2015 Lorenzo Mangani <lorenzo.mangani@gmail.com> QXIP B.V.
 * License AGPL-3.0 http://opensource.org/licenses/AGPL-3.0
 *
*/

'use strict';

angular.module('homer.widgets.alarmlist', ['adf.provider'])
  .value('alarmListServiceUrl', 'api/v1/alarm/list')
  .config(function(dashboardProvider){
    dashboardProvider
      .widget('alarmlist', {
        title: 'Alarm List',
        group: 'Admin',
        name: 'alarmlist',
        description: 'Display Alarm Detections',
        templateUrl: 'js/widgets/alarmlist/alarmlist.html',
        controller: 'alarmListCtrl',
        reload: true,
        resolve: {
          alarms: function(alarmListService, config){
              return alarmListService.get();
          }
        },
        edit: {
          templateUrl: 'js/widgets/alarmlist/edit.html'
        }
      });
  })
  .service('alarmListService', function($q, $http, alarmListServiceUrl, userProfile){
    return {
      get: function($scope, config, path, query){
      
        var deferred = $q.defer();        
        var url = alarmListServiceUrl + "/get";
	var objQuery = {};

        objQuery = alarmlistWdgt.query($scope, objQuery, userProfile);

	$http.post(url, objQuery).success(function(data) {
		//config.debugresp = JSON.stringify(data);
                if (data && data.status) {
                    var status = data.status;
                    if (status < 300) {
                        deferred.resolve(data.data);
                    } else {
                        deferred.reject(data.data);
                    }
                }
	}).error(function() {
                deferred.reject();
        });
        
	return deferred.promise;        
      },      
      save: function(ldata){
        var deferred = $q.defer();
        $http.post(alarmListServiceUrl+"/new", ldata)
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
        $http.post(alarmListServiceUrl+"/edit", ldata)
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
      delete: function($uid){
        var deferred = $q.defer();
        $http.delete(alarmListServiceUrl+"/delete/"+$uid)
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
      }      
    };
  })
  .controller('alarmListCtrl', [
     '$scope',
     'alarms',
     'dialogs',
     'alarmListService',
     '$timeout',
     '$window',
     'SweetAlert',
     homer.modules.core.services.profile,
     'eventbus',
     '$location',
     function($scope, alarms, dialogs, alarmListService, $timeout, $window, SweetAlert, userProfile, eventbus, $location){


	$scope.getBkgColorTable = function (status) {

			var color = "#EDFBFF";
			if(status == 1) color = "#FF8080";
                        return {
                                "background-color": color
                        }                  
        };

	//var rowtpl='<div ng-style="row.isSelected && {} || grid.appScope.getBkgColorTable(row.entity.status)">'
	//    		+ '<div ng-click="grid.appScope.onDblClickRow(row)"   ng-repeat="(colRenderIndex, col) in colContainer.renderedColumns track by col.colDef.name" class="ui-grid-cell" ng-class="{ \'ui-grid-row-header-cell\': col.isRowHeader }" ui-grid-cell></div>'
	//    		+'</div>';
	    		
        var rowtpl='<div ng-style="row.isSelected && {} || grid.appScope.getBkgColorTable(row.entity.status)">'
	    		+ '<div ng-repeat="(colRenderIndex, col) in colContainer.renderedColumns track by col.colDef.name" class="ui-grid-cell" ng-class="{ \'ui-grid-row-header-cell\': col.isRowHeader }" ui-grid-cell></div>'
	    		+'</div>';


	$scope.gridListOptions = {
		showFooter: false,
		enableSorting: true,
		enableFiltering: true,
		multiSelect: false,
		enableRowSelection: false, 
		enableSelectAll: false,
		enableRowHeaderSelection: false,  
		rowTemplate: rowtpl,
		noUnselect: true
	};

	$scope.gridListOptions.rowIdentity = function(row) {
        	  return row.id;
	};

	$scope.gridListOptions.onRegisterApi = function(gridApi){
                $scope.gridApi = gridApi;
	};      

	$scope.onDblClickRow = function(rowItem) {
           console.log("Double click", rowItem);              
	   if(rowItem.entity.status == 1) {
		rowItem.entity.status = 0;
		var ldata = {};        
                ldata['param'] = {
                    id: rowItem.entity.id,
                    status: 0
                };
      
                console.log(ldata);
        
                alarmListService.update(ldata).then(function (mdata) {
                        rowItem.entity.status = 0;
                });

	   }
	
	};
		
	$scope.showAlarm = function(localrow, event) {
	        console.log("SHOW IT");

	        var ts = localrow.entity.alarm_ts * 1000;
	        var fromDate = new Date(new Date(ts).setMinutes(new Date(ts).getMinutes() - 5 ));
	        var toDate = new Date(new Date(ts).setMinutes(new Date(ts).getMinutes() + 5 ));	        
	        
	        var search_time = { from: fromDate, to: toDate};	         
	        console.log(search_time);

	        eventbus.broadcast(homer.modules.pages.events.setTimeRange, search_time);		                    
	        
	        var source_ip = localrow.entity.source_ip;

                var transaction = {
                            call: true,
                            registration: false,
                            rest: false
                };
                
                var search = {
                      //  user_agent: "%friendly%"
                      source_ip: source_ip                      
                };
                                                                                                                
                userProfile.setProfile("transaction", transaction);
                userProfile.setProfile("search", search);
                $location.path('/result');
        };

	$scope.deleteAlarm = function(rowItem, event) {

		console.log("Delete item", rowItem);              
		if(rowItem.entity.status == 1) {
			rowItem.entity.status = 0;
			var ldata = {};        
        	        ldata['param'] = {
                	    id: rowItem.entity.id,
	                    status: 0
        	        };
      
                	console.log(ldata);			
        
	                alarmListService.update(ldata).then(function (mdata) {
        	                rowItem.entity.status = 0;
                	});
		}
		else {
			rowItem.entity.status = 1;
			var ldata = {};        
        	        ldata['param'] = {
                	    id: rowItem.entity.id,
	                    status: 1
        	        };
	                alarmListService.update(ldata).then(function (mdata) {
        	                rowItem.entity.status = 1;
                	});			
		}

		console.log("DELETE ALARM");
        };

	$scope.alarmValue = function( grid, rowItem ) {
		return rowItem.entity.status == 1 ? "read" : "unread";
	};

	$scope.showAgo = function( grid, rowItem ) {

		var _MS_PER_HOUR = 60 * 60;
		var d2 = new Date();
		var diffHours =  Math.floor((d2.getTime()/1000 - (rowItem.entity.alarm_ts)) / _MS_PER_HOUR);
		return diffHours;
	};
	
	$scope.showDateValue = function( grid, rowItem ) {
	        function pad(s) { return (s < 10) ? '0' + s : s; }	        
		var d = new Date(rowItem.entity.alarm_ts*1000);
		return [pad(d.getFullYear()), pad(d.getMonth()+1), d.getDate()].join('-') + ' ' + [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':');
	};
	
    
	$scope.Delete = function(row) {
	          var index = $scope.gridListOptions.data.indexOf(row.entity);
        	  $scope.gridListOptions.data.splice(index, 1);
	};
     
	$scope.gridListOptions.columnDefs = [
		{ name: 'id', enableCellEdit: false, width: 50 },
		{ name: 'type', displayName: 'Type' },
		{ name: 'total', displayName: 'Total' },
		{ name: 'source_ip', displayName: 'Source IP' },
		{ name: 'description', displayName: 'Description' },
		{ name: 'create_date', 
		  field: 'alarm_ts',
		  displayName: 'Create date' , 
		  type: 'date', 
		  cellTemplate: '<div  ng-click="grid.appScope.showAlarm(row, $event)" class="ui-grid-cell-contents"><span class="navText">{{grid.appScope.showDateValue(grid, row)}}</span></div>'
                },
		{ name: 'ago', 
		  displayName: 'Age Hours' , 
		  field: 'alarm_ts',
		  width: 150,
		  cellTemplate: '<div class="ui-grid-cell-contents">{{grid.appScope.showAgo(grid, row)}}</div>'
                },
		{ name: 'status', 
		  displayName: 'Status', 
		  type: 'boolean', 
		  width: 70,
		  cellTemplate: '<button  ng-click="grid.appScope.deleteAlarm(row, $event)" class="btn btn-normal btn-danger">{{grid.appScope.alarmValue(grid, row)}}</button>'                
                }
	      
      	];
    
	$scope.gridListOptions.data = alarms;
  }]);

////////////////////////////////////////////////////////////////////////////////////////////
// Widget object
////////////////////////////////////////////////////////////////////////////////////////////
var alarmlistWdgt = {};

//==========================================================================================
// Add filters
//==========================================================================================
alarmlistWdgt.query = function($scope, query, userProfile) {

    var timedate = userProfile.getProfile("timerange");
    
    query.timestamp = {};

    query.timestamp.from = timedate.from.getTime();
    query.timestamp.to = timedate.to.getTime();

    query.param = {};

    query.param.limit = 30;
    //query.param.limit = $scope.config.panel.limit;
    //query.param.total = $scope.config.panel.total;

    if (typeof filters == 'object') {
        filters.forEach(function(filter) {
            var obj = {};
            obj[filter.type] = filter.value;
            filterParams.push(obj);
        });

        query.param.filter = filterParams;
    }

    return query;
};
