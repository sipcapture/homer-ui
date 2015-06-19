/*
 * HOMER 5 UI (Xenophon)
 *
 * Copyright (C) 2011-2015 Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Copyright (C) 2011-2015 Lorenzo Mangani <lorenzo.mangani@gmail.com> QXIP B.V.
 * License AGPL-3.0 http://opensource.org/licenses/AGPL-3.0
 *
*/

'use strict';

angular.module('homer.widgets.adminuser', ['adf.provider'])
  .value('adminuserServiceUrl', 'api/admin/user')
  .config(function(dashboardProvider){
    dashboardProvider
      .widget('adminuser', {
        title: 'Admin User',
        description: 'Users admin',
        templateUrl: 'js/widgets/adminuser/adminuser.html',
        controller: 'adminuserCtrl',
        resolve: {
          users: function(adminuserService, config){
              return adminuserService.get();
          }
        },
        edit: {
          templateUrl: 'js/widgets/adminuser/edit.html'
        }
      });
  })
  .service('adminuserService', function($q, $http, adminuserServiceUrl){
    return {
      get: function(){
        var deferred = $q.defer();
        $http.get(adminuserServiceUrl+"/get")
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
        $http.post(adminuserServiceUrl+"/new", ldata)
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
        $http.post(adminuserServiceUrl+"/edit", ldata)
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
        $http.delete(adminuserServiceUrl+"/delete/"+$uid)
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
  .controller('adminuserCtrl', function($scope, users, dialogs, adminuserService, $timeout, $window, SweetAlert){

    // TAB FUNCTIONS DEFAULTS
    $scope.showtable = true;    
    $scope.inactiveTab = false;
    $scope.activeTab = true; $scope.editTab = false; $scope.newTab = false;    
    $scope.activeMainTab = true;
    $scope.disabled = false;

    $scope.removeUserTab = function (index) {
        $scope.activeTab = true; 
    	$scope.activeMainTab = true;
    	$scope.editTab = false; 
    	$scope.newTab = false;
    	$scope.activeNewTab = false; 
    	$scope.tabShown = true;
    };

    $scope.newUser = function() {
      	 $scope.newuser = [];    
      	 $scope.activeTab = false; 
      	 $scope.activeNewTab = true;
      	 $scope.editTab = false; 
      	 $scope.newTab = true;
      	 $scope.activeMainTab = false;
     	 $scope.tabShown = false;    
    };
    $scope.editUser = function() {
      	 $scope.newuser = [];    
      	 $scope.activeTab = false; 
      	 $scope.activeNewTab = true;
      	 $scope.editTab = true; 
      	 $scope.newTab = false;
      	 $scope.activeMainTab = false;
     	$scope.tabShown = false;    
    
    };
    
    $scope.addNewUser = function() {
      
        console.log("NEW USER");        
	$scope.errorNewUserShow = false;                                                
        $scope.removeUserTab();                             
        
	var ldata = {};        
        ldata['param'] = {
	        email: $scope.newuser.email,
		firstname: $scope.newuser.firstname,
		grp: $scope.newuser.grp,
		lastname: $scope.newuser.lastname,
		password: $scope.newuser.password1,
		username: $scope.newuser.username,
		department: $scope.newuser.department,
		active: $scope.newuser.active				        
        };
        
        adminuserService.save(ldata).then(function (mdata) {
		console.log("ZZZZZZZZZZZZ");
		$scope.gridOptions.data.length = 0;
		$timeout(function(){
			$scope.gridOptions.data = mdata;
		});
        });                  
    };
    
    $scope.doEditUser = function() {
        
                console.log("Edit USER");
                $scope.editTab = false;
                $scope.newTab = false;
                $scope.activeNewTab = false;
                $scope.activeMainTab = true;
                $scope.activeTab = true;                                             
                $scope.errorEditUserShow = false;
                $scope.tabShown = true;

                var uid = $scope.user.uid;
               
                var ldata = {};        
                ldata['param'] = {
	          email: $scope.user.email,
	          firstname: $scope.user.firstname,
	          gid: $scope.user.gid,
	          grp: $scope.user.grp,
	          lastname: $scope.user.lastname,
	          password: $scope.user.password1,
	          username: $scope.user.username,
	          department: $scope.user.department,
	          active: $scope.user.active,				        
	          uid: uid
                };
        
                adminuserService.update(ldata).then(function (mdata) {
			$scope.gridOptions.data.length = 0;
			$timeout(function(){
				$scope.gridOptions.data = mdata;
			});
                });
        
    };
    
    $scope.doDeleteUser = function() {
      
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

			        var uid = $scope.user.uid;
                
				adminuserService.delete(uid).then(function (mdata) {
					$scope.gridOptions.data.length = 0;
					$timeout(function(){$scope.gridOptions.data = mdata;});
			        });
	        
                                $scope.removeAlarmTab();
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
    	    $scope.user = rowItem.entity;
    };
    
    $scope.Delete = function(row) {
          var index = $scope.gridOptions.data.indexOf(row.entity);
          $scope.gridOptions.data.splice(index, 1);
    };
     
    $scope.gridOptions.columnDefs = [
		{ name: 'uid', enableCellEdit: false, width: 50 },
		{ name: 'gid', width: 50 },
		{ name: 'username', displayName: 'username' },
		{ name: 'firstname', displayName: 'Firstname' },
		{ name: 'lastname', displayName: 'Lastname' },
		{ name: 'email', displayName: 'Email' },
		{ name: 'department', displayName: 'Department' },		
		{ name: 'regdate', displayName: 'Registered' , type: 'date', cellFilter: 'date:"yyyy-MM-dd"'},
		{ name: 'lastvisit', displayName: 'Last' , type: 'date', cellFilter: 'date:"yyyy-MM-dd"'},
		{ name: 'active', displayName: 'Active', type: 'boolean', width: 50 }
	      
      ];
    
      console.log('ADM-ROW_USER');
      console.log(users);
      $scope.gridOptions.data = users;

  })
   .controller('userSelectDialogCtrl',function($log,$scope,$modalInstance,data){

        $scope.user = data;

        $scope.hstep = 1;

        $scope.mstep = 15;
        $scope.options = {
            hstep: [1, 2, 3],
            mstep: [1, 5, 10, 15, 25, 30]
        };

        $scope.$watch('timerange.from',function(val,old){
              $log.info('Date Changed: ' + val);
              $scope.opened = false;
        });

        $scope.open = function($event, opened) {
                $event.preventDefault();
                $event.stopPropagation();
                $scope[opened] = true;
        };

        $scope.done = function(){
                $modalInstance.close($scope.timerange);
        }; // end done
    });

