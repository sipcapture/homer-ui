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
	.controller(homer.modules.pages.controllers.result, [
	    '$scope',
	    '$rootScope',
	    'eventbus',
	    '$http',
	    '$location',
	    homer.modules.core.services.search,
	    '$timeout',
	    '$window',
	    '$homerModal',
	    homer.modules.core.services.profile,
	    function ($scope,$rootScope, eventbus, $http, $location, search, $timeout, $window, $homerModal, userProfile) {

		//$rootScope.loggedIn = false;
		$scope.expandme = true;
		$scope.showtable = true;
		$scope.dataLoading = false;

		if ($rootScope.loggedIn == false) {
		    console.log("AUTH FALSE");
		    $location.path(homer.modules.auth.routes.login);
		    return;
		} else {
		    console.log("AUTH TRUE");
		}

		/* hide left menu */
		eventbus.broadcast(homer.modules.pages.events.hideLeftMenu, "1");

		// process the form
		$scope.processSearchResult = function() {

		/* save data for next search */
		var data = {param:{}, timestamp:{}};

		var transaction = userProfile.getProfile("transaction");
		var limit = userProfile.getProfile("limit");
		var timedate = userProfile.getProfile("timerange");
		var value = userProfile.getProfile("search");
		var node = userProfile.getProfile("node").dbnode;

		/* make construct of query */
		data.param.transaction = {};
		data.param.limit = limit;
		data.param.search = value;
		data.param.node = node;
		data.timestamp.from = timedate.from.getTime();
		data.timestamp.to = timedate.to.getTime();

		angular.forEach(transaction.transaction, function(v, k) {
		    data.param.transaction[v.name] = true;
		});

		$scope.dataLoading = true;

		search.searchByMethod(data).then(
		function (sdata) {
		    if (sdata) {
			$scope.count = sdata.length;
			$scope.gridOpts.data = sdata;
			$timeout(function () {
			    angular.element($window).resize();
			}, 0)
		    }
		},
		function(sdata) {
		    return;
		}).finally(
		function(){
		    $scope.dataLoading = false;
		    //$scope.$apply();
		});
	    };

            //$timeout(function(){
                //any code in here will automatically have an apply run afterwards
           //     $scope.$apply();
            //});

            $scope.processSearchResult();

             /* DATA */
            $scope.swapData = function() {
		//$scope.gridOpts.data = data1;
		//$scope.$apply();
	    };

	    $scope.hashCode = function(str) { // java String#hashCode
		var hash = 0;
		for (var i = 0; i < str.length; i++) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}
		return hash;
	    }; 

	    $scope.intToARGB = function (i){
		//return ((i>>24)&0xFF).toString(16) + ((i>>16)&0xFF).toString(16) + ((i>>8)&0xFF).toString(16) + (i&0xFF).toString(16);
		return ((i>>24)&0xFF);
	    }

	    $scope.getBkgColorTable = function (callid) {
			var his = $scope.hashCode(callid);
			//var color = "#"+$scope.intToARGB(his);
			var color = "hsl("+$scope.intToARGB(his)+", 75%, 75%)";
			return {
				"background-color": color
			}
            };

	    $scope.showMessage = function(localrow,event) {
		var search_data =  {
		    timestamp: {
			from: parseInt(localrow.entity.micro_ts/1000),
			to: parseInt(localrow.entity.micro_ts/1000)
		    },
		    param: {
			search: {
			    id: parseInt(localrow.entity.id),
			    callid: localrow.entity.callid
			},
			location: {
			    node: localrow.entity.dbnode
			},
			transaction: {
			    call: false,\
			    registration: false,\
			    rest: false
			}
		    }
		};

		search_data['param']['transaction'][localrow.entity.trans] = true;
		var messagewindowId = ""+localrow.entity.id+"_"+localrow.entity.trans;

		$homerModal.open({
		    url: 'templates/dialogs/message.html',
		    cls: 'homer-modal-content',
		    id: "message"+messagewindowId.hashCode(),
		    divLeft: event.clientX.toString()+'px',
		    divTop: event.clientY.toString()+'px',
		    params: search_data,
		    onOpen: function() {
			console.log('modal1 message opened from url '+this.id);
		    },
		    controller: 'messageCtrl'
		});
            };

	    $scope.getColumnValue = function(row,col) {
		return row.entity[col.field+'_alias']==undefined?row.entity[col.field+'_ip']:row.entity[col.field+'_alias'];
	    }
	    $scope.getColumnTooltip = function(row,col) {
		return row.entity[col.field+'_ip'];
	    }

	    $scope.showTransaction = function(localrow,event) {

		var rows = $scope.gridApi.selection.getSelectedRows();
		var callids = [];
		var nodes = [];

		callids.push(localrow.entity.callid);

		angular.forEach(rows, function(row, key){
		    if(callids.indexOf(row.callid) == -1) callids.push(row.callid);
		    if(callids.indexOf(row.callid_aleg) == -1 && row.callid_aleg.length > 1) callids.push(row.callid_aleg);
		    if(nodes.indexOf(row.dbnode) == -1) nodes.push(row.dbnode);
		});

		var search_data =  {
		    timestamp: {
			from: parseInt(localrow.entity.micro_ts/1000)-300,
			to: parseInt(localrow.entity.micro_ts/1000)+300
		    },
		    param: {
			search: {
			    id: parseInt(localrow.entity.id), 
			    callid: callids
			},
			location: {
			    node: nodes
			},
			transaction: {
			    call: false,
			    registration: false,
			    rest: false
			}
		    }
		};

		/* set to to our last search time */
		//var timedate = search.getTimeRange();
		var timedate = userProfile.getProfile("timerange");
		search_data['timestamp']['to'] = timedate.to.getTime();

		search_data['param']['transaction'][localrow.entity.trans] = true;
		var trwindowId = ""+localrow.entity.callid + "_" +localrow.entity.dbnode;

		$homerModal.open({
		    url: 'templates/dialogs/transaction.html',
		    cls: 'homer-modal-content',
		    id: "trans"+trwindowId.hashCode(),
		    params: search_data,
		    divLeft: event.clientX.toString()+'px',
		    divTop: event.clientY.toString()+'px',
		    onOpen: function() {
			console.log('modal1 opened from url',this.id);
		    },
		    controller: 'transactionCtrl'
		});
	    };

	    $scope.fileOneUploaded = true;
	    $scope.fileTwoUploaded = false;

	    var rowtpl =  '<div ng-style="row.isSelected && {} || grid.appScope.getBkgColorTable(row.entity.callid)">'
			+ '<div ng-repeat="(colRenderIndex, col) in colContainer.renderedColumns track by col.colDef.name" class="ui-grid-cell" ng-class="{ \'ui-grid-row-header-cell\': col.isRowHeader }" ui-grid-cell></div>'
			+'</div>';

	    $scope.gridOpts = {
		enableColumnResizing: true,
		enableSorting: true,
		enableRowSelection: true, 
		enableGridMenu: true,
		showGridFooter:true,
		noUnselect: false,
		multiSelect:true,
		modifierKeysToMultiSelect: false,
		enablePaging  : true,
		paginationPageSizes: [25, 50, 75],
		paginationPageSize: 25,
		enableFiltering: true,
		rowTemplate: rowtpl,

		filterOptions: {
		    filterText: "",
		    useExternalFilter: false
		},
		columnDefs: [
		    {field: 'id',
			displayName: 'Id',
			width: 50},
		    {field: 'milli_ts',
			displayName: 'Date', 
			cellFilter: 'date:\'yyyy-dd-MM HH:mm:ss.sss\'',
			width: 170
		    },
		    //{field: 'micro_ts', displayName: 'Micro TS', width: 80},
		    {field: 'method', 
			displayName: 'Method',
			cellClass: function(grid, row, col, rowRenderIndex, colRenderIndex) {
			    if (grid.getCellValue(row,col) === 'INVITE') {
				return 'blue';
			    }
			},
			cellTemplate: '<div  ng-click="grid.appScope.showMessage(row, $event)" class="ui-grid-cell-contents"><span class="navText">{{COL_FIELD}}</span></div>'
		    },
		    {field: 'reply_reason', displayName: 'Reason', width: 70},
		    {field: 'ruri_user', displayName: 'RURI user'},
		    {field: 'from_user', displayName: 'From User'},
		    {field: 'callid',
			displayName: 'CallID',
			width: 160,
			cellTemplate: '<div  ng-click="grid.appScope.showTransaction(row, $event)" class="ui-grid-cell-contents"><span class="navText">{{COL_FIELD}}</span></div>'
		    },
		    {field: 'user_agent', displayName: 'User Agent'},
		    {field: 'source',
			displayName: 'Source Host',
			cellTemplate: '<div title="{{ grid.appScope.getColumnTooltip(row, col) }}">{{ grid.appScope.getColumnValue(row, col) }}</div>'
		    },
		    {field: 'source_port', displayName: 'SPort', width: 50},
		    {field: 'destination',
			displayName: 'Destination Host',
			cellTemplate: '<div title="{{ grid.appScope.getColumnTooltip(row, col) }}">{{ grid.appScope.getColumnValue(row, col) }}</div>'
		    },
		    {field: 'destination_port', displayName: 'DPort', width: 50},
		    {field: 'proto', displayName: 'Proto', width: 40},
		    {field: 'node', displayName: 'Node'}
		]
	    };


	    $scope.gridOpts.rowIdentity = function(row) {
		return row.id;
	    };

	    $scope.gridOpts.onRegisterApi = function(gridApi){
	    //set gridApi on scope
	    $scope.gridApi = gridApi;
	    };
	}
    ])
    .filter('unixts', function() {
	return function(input) {
	    if (!input){
		return '';
	    } else {
		return new Date(input * 1000);
	    }
	};
     });
}(angular, homer));
