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
        description: 'alarm lists',
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
  .service('alarmListService', function($q, $http, alarmListServiceUrl){
    return {
      get: function(){
        var deferred = $q.defer();
        $http.get(alarmListServiceUrl+"/get")
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
      save: function(ldata){
        var deferred = $q.defer();
        console.log(ldata);
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
        console.log(ldata);
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
  .controller('alarmListCtrl', function($scope, alarms, dialogs, alarmListService, $timeout, $window, SweetAlert){


	$scope.getBkgColorTable = function (status) {

			var color = "#EDFBFF";
			if(status == 1) color = "#FF8080";
                        return {
                                "background-color": color
                        }                  
        };

    
	var rowtpl='<div ng-style="row.isSelected && {} || grid.appScope.getBkgColorTable(row.entity.status)">'
	    		+ '<div ng-click="grid.appScope.onDblClickRow(row)"   ng-repeat="(colRenderIndex, col) in colContainer.renderedColumns track by col.colDef.name" class="ui-grid-cell" ng-class="{ \'ui-grid-row-header-cell\': col.isRowHeader }" ui-grid-cell></div>'
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
		{ name: 'create_date', displayName: 'Create date' , type: 'date', cellFilter: 'date:"yyyy-MM-dd"'},
		{ name: 'status', displayName: 'Status', type: 'boolean', width: 50 }
	      
      	];
    
	console.log('ADM-ROW_USER');
	$scope.gridListOptions.data = alarms;
  });

