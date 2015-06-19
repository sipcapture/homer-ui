/*
 * HOMER 5 UI (Xenophon)
 *
 * Copyright (C) 2011-2015 Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Copyright (C) 2011-2015 Lorenzo Mangani <lorenzo.mangani@gmail.com> QXIP B.V.
 * License AGPL-3.0 http://opensource.org/licenses/AGPL-3.0
 *
*/

'use strict';

angular.module('homer.widgets.adminalias', ['adf.provider'])
  .value('adminaliasServiceUrl', 'api/admin/alias')
  .config(function(dashboardProvider){
    dashboardProvider
      .widget('adminalias', {
        title: 'Admin Alias',
        description: 'Alias admin',
        templateUrl: 'js/widgets/adminalias/adminalias.html',
        controller: 'adminaliasCtrl',
        resolve: {
          aliases: function(adminaliasService, config){
              return adminaliasService.get();
          }
        },
        edit: {
          templateUrl: 'js/widgets/adminalias/edit.html'
        }
      });
  })
  .service('adminaliasService', function($q, $http, adminaliasServiceUrl){
    return {
      get: function(){
        var deferred = $q.defer();
        $http.get(adminaliasServiceUrl+"/get")
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
        $http.post(adminaliasServiceUrl+"/new", ldata)
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
        $http.post(adminaliasServiceUrl+"/edit", ldata)
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
        $http.delete(adminaliasServiceUrl+"/delete/"+$id)
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
  .controller('adminaliasCtrl', function($scope, aliases, dialogs, adminaliasService, $timeout, $window, SweetAlert){

    // TAB FUNCTIONS DEFAULTS
    $scope.showtable = true;    
    $scope.inactiveTab = false;
    $scope.activeTab = true; $scope.editTab = false; $scope.newTab = false;    
    $scope.activeMainTab = true;
    $scope.disabled = false;

    $scope.removeAliasTab = function (index) {
        $scope.activeTab = true; 
    	$scope.activeMainTab = true;
    	$scope.editTab = false; 
    	$scope.newTab = false;
    	$scope.activeNewTab = false; 
    	$scope.tabShown = true;
    };

    $scope.newAlias = function() {
      	 $scope.newalias = [];    
      	 $scope.activeTab = false; 
      	 $scope.activeNewTab = true;
      	 $scope.editTab = false; 
      	 $scope.newTab = true;
      	 $scope.activeMainTab = false;
     	 $scope.tabShown = false;    
    };
    $scope.editAlias = function() {
      	 $scope.newalias = [];    
      	 $scope.activeTab = false; 
      	 $scope.activeNewTab = true;
      	 $scope.editTab = true; 
      	 $scope.newTab = false;
      	 $scope.activeMainTab = false;
     	$scope.tabShown = false;    
    
    };
    
    $scope.addNewAlias = function() {
      
	$scope.errorNewAliasShow = false;                                                
        $scope.removeAliasTab();                             
        
	var ldata = {};        
        ldata['param'] = {
		gid: 10,
		ip: $scope.newalias.ip,
		port: $scope.newalias.port,
		alias: $scope.newalias.alias,
		status: $scope.newalias.status				        
        };
        
        adminaliasService.save(ldata).then(function (mdata) {
		$scope.gridOptions.data.length = 0;
		$timeout(function(){
			$scope.gridOptions.data = mdata;
		});
        });                  
    };
    
    $scope.doEditAlias = function() {
        
                console.log("Edit USER");
                $scope.editTab = false;
                $scope.newTab = false;
                $scope.activeNewTab = false;
                $scope.activeMainTab = true;
                $scope.activeTab = true;                                             
                $scope.errorEditAliasShow = false;
                $scope.tabShown = true;

                var id = $scope.arec.id;
               
                var ldata = {};        
                ldata['param'] = {
                    gid: 10,
                    ip: $scope.arec.ip,
                    port: $scope.arec.port,
                    alias: $scope.arec.alias,
                    status: $scope.arec.status,				                        
                    id: id
                };
        
                adminaliasService.update(ldata).then(function (mdata) {
			$scope.gridOptions.data.length = 0;
			$timeout(function(){
				$scope.gridOptions.data = mdata;
			});
                });
        
    };
    
    $scope.doDeleteAlias = function() {
      
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
                                $scope.editTab = false;
                                $scope.newTab = false;
                                $scope.activeNewTab = false;
                                $scope.activeMainTab = true;
                                $scope.activeTab = true;
                                $scope.tabShown = true;

			        var id = $scope.alias.id;
                
				adminaliasService.delete(id).then(function (mdata) {
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
                //set gridApi on scope
                $scope.gridApi = gridApi;
    };      


    $scope.onDblClickRow = function(rowItem) {
	    // tab management
	    $scope.editTab = true;
    	    $scope.activeTab = false;
    	    $scope.newTab = false;
    	    $scope.arec = rowItem.entity;
    };
    
    $scope.Delete = function(row) {
	// console.log('ADM-ROW_DEL');
          var index = $scope.gridOptions.data.indexOf(row.entity);
          $scope.gridOptions.data.splice(index, 1);
    };

    $scope.gridOptions.columnDefs = [
		{ name: 'id', enableCellEdit: false, width: 50 },
		{ name: 'alias', displayName: 'Alias' },
		{ name: 'gid', width: 50 },
		{ name: 'ip', displayName: 'IP' },
		{ name: 'port', displayName: 'Port' },
		{ name: 'status', displayName: 'status' },
		{ name: 'created', displayName: 'Created' , type: 'date', cellFilter: 'date:"yyyy-MM-dd"'}	      
      ];
    
      $scope.gridOptions.data = aliases;

  });
