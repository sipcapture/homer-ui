/*
 * HOMER 5 UI (Xenophon)
 *
 * Copyright (C) 2011-2015 Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Copyright (C) 2011-2015 Lorenzo Mangani <lorenzo.mangani@gmail.com> QXIP B.V.
 * License AGPL-3.0 http://opensource.org/licenses/AGPL-3.0
 *
*/

'use strict';

angular.module('homer.widgets.adminnode', ['adf.provider'])
  .value('adminnodeServiceUrl', 'api/v1/admin/node')
  .config(function(dashboardProvider){
    dashboardProvider
      .widget('adminnode', {
        title: 'Admin Node',
        group: 'Admin',
        name: 'adminnode',                
        description: 'Manage Database Nodes',
        templateUrl: 'js/widgets/adminnode/adminnode.html',
        controller: 'adminnodeCtrl',
        resolve: {
          nodes: function(adminnodeService, config){
              return adminnodeService.get();
          }
        },
        edit: {
          templateUrl: 'js/widgets/adminnode/edit.html'
        }
      });
  })
  .service('adminnodeService', function($q, $http, adminnodeServiceUrl){
    return {
      get: function(){
        var deferred = $q.defer();
        $http.get(adminnodeServiceUrl+"/get")
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
        $http.post(adminnodeServiceUrl+"/new", ldata)
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
        $http.post(adminnodeServiceUrl+"/edit", ldata)
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
      delete: function($id){
        var deferred = $q.defer();
        $http.delete(adminnodeServiceUrl+"/delete/"+$id)
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
  .controller('adminnodeCtrl', function($scope, nodes, dialogs, adminnodeService, $timeout, $window, SweetAlert){

    // TAB FUNCTIONS DEFAULTS
    $scope.showtable = true;    
    $scope.inactiveTab = false;
    $scope.activeTab = true; $scope.editTab = false; $scope.newTab = false;    
    $scope.activeMainTab = true;
    $scope.disabled = false;

    $scope.removeNodeTab = function (index) {
        $scope.activeTab = true; 
    	$scope.activeMainTab = true;
    	$scope.editTab = false; 
    	$scope.newTab = false;
    	$scope.activeNewTab = false; 
    	$scope.tabShown = true;
    };

    $scope.newNode = function() {
      	 $scope.newnode = [];    
      	 $scope.activeTab = false; 
      	 $scope.activeNewTab = true;
      	 $scope.editTab = false; 
      	 $scope.newTab = true;
      	 $scope.activeMainTab = false;
     	 $scope.tabShown = false;    
    };
    $scope.editNode = function() {
      	 $scope.newnode = [];    
      	 $scope.activeTab = false; 
      	 $scope.activeNewTab = true;
      	 $scope.editTab = true; 
      	 $scope.newTab = false;
      	 $scope.activeMainTab = false;
     	$scope.tabShown = false;    
    
    };
    
    $scope.addNewNode = function() {
      
        console.log("NEW NODE");        
	$scope.errorNewNodeShow = false;                                                
        $scope.removeNodeTab();                             
        
	var ldata = {};        
        ldata['param'] = {
		host: $scope.newnode.host,
		dbname: $scope.newnode.dbname,
		dbport: $scope.newnode.dbport,
		dbusername: $scope.newnode.dbusername,
                dbpassword: $scope.newnode.dbpassword,		
                dbtables: $scope.newnode.dbtables,
                name: $scope.newnode.name,
		status: $scope.newnode.status				        
        };
        
        adminnodeService.save(ldata).then(function (mdata) {
		console.log("ZZZZZZZZZZZZ");
		$scope.gridOptions.data.length = 0;
		$timeout(function(){
			$scope.gridOptions.data = mdata;
		});
        });                  
    };
    
    $scope.doEditNode = function() {
        
                console.log("Edit NODE");
                $scope.editTab = false;
                $scope.newTab = false;
                $scope.activeNewTab = false;
                $scope.activeMainTab = true;
                $scope.activeTab = true;                                             
                $scope.errorEditNodeShow = false;
                $scope.tabShown = true;

                var id = $scope.noderec.id;
               
                var ldata = {};        
                ldata['param'] = {
                    host: $scope.noderec.host,
                    dbname: $scope.noderec.dbname,
                    dbport: $scope.noderec.dbport,
                    dbusername: $scope.noderec.dbusername,
                    dbpassword: $scope.noderec.dbpassword,		
                    dbtables: $scope.noderec.dbtables,
                    name: $scope.noderec.name,
                    status: $scope.noderec.status,				        
                    id: id
                };
        
                adminnodeService.update(ldata).then(function (mdata) {
			$scope.gridOptions.data.length = 0;
			$timeout(function(){
				$scope.gridOptions.data = mdata;
			});
                });
        
    };
    
    $scope.doDeleteNode = function() {
      
        console.log("Delete NODE");
                
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
                                $scope.editTab = false;
                                $scope.newTab = false;
                                $scope.activeNewTab = false;
                                $scope.activeMainTab = true;
                                $scope.activeTab = true;
                                $scope.tabShown = true;

				var id = $scope.noderec.id;
                
				adminnodeService.delete(id).then(function (mdata) {
					$scope.gridOptions.data.length = 0;
					$timeout(function(){ $scope.gridOptions.data = mdata;});
			        });
                                $scope.removeNodeTab();
                        }
        });

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
	    $scope.editTab = true;
    	    $scope.activeTab = false;
    	    $scope.newTab = false;
    	    console.log(rowItem.entity);
    	    $scope.noderec = rowItem.entity;
    };
    
    $scope.Delete = function(row) {
          var index = $scope.gridOptions.data.indexOf(row.entity);
          $scope.gridOptions.data.splice(index, 1);
    };

    $scope.gridOptions.columnDefs = [
		{ name: 'id', enableCellEdit: false, width: 50 },
		{ name: 'name', displayName: 'Name' },
		{ name: 'host', displayName: 'host' },
		{ name: 'dbname', displayName: 'DB Name'},
		{ name: 'dbport', displayName: 'DB Port' },
		{ name: 'dbusername', displayName: 'DB User' },
		{ 
		    name: 'dbpassword', 
		    displayName: 'DB Password',
		    cellTemplate: '<div  class="ui-grid-cell-contents"><span class="navText">******</span></div>'
		                                    
                },
		{ name: 'dbtables', displayName: 'DB Tables' },
		{ name: 'status', displayName: 'status' }
      ];
    
      console.log('ADM-ROW_ALIAS');
      console.log(nodes);
      $scope.gridOptions.data = nodes;

  });
