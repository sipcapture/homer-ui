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
	    'localStorageService',
	    '$filter',
	    function ($scope,$rootScope, eventbus, $http, $location, search, $timeout, $window, $homerModal, userProfile, localStorageService, $filter) {

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

		$scope.$on("$destroy", function(){
		    eventbus.broadcast(homer.modules.pages.events.destroyRefresh, "1");
		    myListener();
                });
		
                //eventbus.broadcast(homer.modules.pages.events.resultSearchSubmit, "fullsearch");		                   
		var myListener = eventbus.subscribe(homer.modules.pages.events.resultSearchSubmit , function(event,name, model) {
			$scope.processSearchResult();
		});				

		// process the form
		$scope.processSearchResult = function() {
            
		/* save data for next search */
		var data = {param:{}, timestamp:{}};
		

		var transaction = userProfile.getProfile("transaction");
		var limit = userProfile.getProfile("limit");
		var timedate = userProfile.getProfile("timerange");
		var timezone = userProfile.getProfile("timezone");
		var value = userProfile.getProfile("search");
		var node = userProfile.getProfile("node").dbnode;

		var sObj = {};
		var searchQueryObject = $location.search();			
		if(searchQueryObject.hasOwnProperty("query")) {
		    var rison = searchQueryObject.query;
		    rison = rison.substring(1, rison.length - 2);		                        		    
		    var ar = rison.split('\',');
		    for (i = 0; i < ar.length; i++) { 
		        var va = ar[i].split(':\'')		        
		        sObj[va[0]] = va[1];
                    }
		}				
		
		$scope.diff = (new Date().getTimezoneOffset() - timezone.value);
		var diff = $scope.diff * 60 * 1000;
		$scope.offset = timezone.offset;
		
		if(Object.keys(sObj).length == 0) 
		{
        		/* make construct of query */
	        	data.param.transaction = {};
	        	data.param.limit = limit;
        		data.param.search = value;
	        	data.param.location = {};
	        	data.param.location.node = node;
	        	data.timestamp.from = timedate.from.getTime() - diff;
	        	data.timestamp.to = timedate.to.getTime() - diff;
	        	angular.forEach(transaction.transaction, function(v, k) {
        		    data.param.transaction[v.name] = true;
	        	});
                }
                else {
                    
                    data.timestamp.from = timedate.from.getTime() + diff;
                    data.timestamp.to = timedate.to.getTime() + diff;                                        
                    data.param.transaction = {};
                    
                    var searchValue = {};
                    
                    if(sObj.hasOwnProperty("limit")) limit = sObj["limit"];
                    if(sObj.hasOwnProperty("startts")) {
                            data.timestamp.from = sObj["startts"] * 1000;
                    }
                    if(sObj.hasOwnProperty("endts")) {
                            data.timestamp.to = sObj["endts"] * 1000;
                    }
                    
                    if(sObj.hasOwnProperty("startdate")) {
                            var v = new Date(sObj["startdate"]);
                            data.timestamp.from = v.getTime();
                    }
                    if(sObj.hasOwnProperty("enddate")) {
                            var v = new Date(sObj["enddate"]);
                            data.timestamp.to = v.getTime();
                            console.log(data);
                    }                    
                    
                    if(sObj.hasOwnProperty("trancall")) data.param.transaction["call"] = true;
                    if(sObj.hasOwnProperty("tranreg")) data.param.transaction["registration"] = true;
                    if(sObj.hasOwnProperty("tranrest")) data.param.transaction["rest"] = true;
         
                    //search_callid                                       
                    if(sObj.hasOwnProperty("search_callid")) searchValue["callid"] = sObj["search_callid"];
                    if(sObj.hasOwnProperty("search_ruri_user")) searchValue["ruri_user"] = sObj["search_ruri_user"];
                    if(sObj.hasOwnProperty("search_from_user")) searchValue["from_user"] = sObj["search_from_user"];
                    if(sObj.hasOwnProperty("search_to_user")) searchValue["to_user"] = sObj["search_to_user"];

                    data.param.limit = limit;
                    data.param.search = searchValue;
                    data.param.location = {};
                    data.param.location.node = node;
                    
                    /* set back timerange */
                    timedate.from = new Date(data.timestamp.from - diff);
                    timedate.to = new Date(data.timestamp.to - diff);                                                                                                           
                    userProfile.setProfile("timerange", timedate);
                    eventbus.broadcast(homer.modules.pages.events.setTimeRange, timedate);
                }

		$scope.dataLoading = true;

		search.searchByMethod(data).then(
		function (sdata) {
		    if (sdata) {
		        $scope.restoreState();
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
		function() {
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
		if(str) {
        		for (var i = 0; i < str.length; i++) {
	        		hash = str.charCodeAt(i) + ((hash << 5) - hash);
                        }
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

	    $scope.showMessage = function(localrow, event) {
		var search_data =  {
		    timestamp: {
			from: parseInt(localrow.entity.micro_ts/1000)-100,
			to: parseInt(localrow.entity.micro_ts/1000)+100
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
			    call: false,
			    registration: false,
			    rest: false
			}
		    }
		};

		search_data['param']['transaction'][localrow.entity.trans] = true;
		var messagewindowId = ""+localrow.entity.id+"_"+localrow.entity.trans;

		$homerModal.open({
		    url: 'templates/dialogs/message.html',
		    cls: 'homer-modal-message',
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
	    
	    $scope.protoCheck = function(row,col) {
	        if(parseInt(row.entity.proto) == 1) return "udp";
	        else if(parseInt(row.entity.proto) == 2) return "tcp";
	        else if(parseInt(row.entity.proto) == 3) return "wss";
	        else if(parseInt(row.entity.proto) == 4) return "sctp";
	        else return "udp";
	    }

	    $scope.dateConvert = function(row,col) {
	    	    
	    	var dt = new Date(parseInt(row.entity.milli_ts));
	    	//dt.setMinutes(dt.getMinutes() + this.diff);    	    	  
	    	//this.diff  
	        return $filter('date')(dt, 'yyyy-MM-dd HH:mm:ss.sss Z', $scope.offset);
	    }

	    $scope.showTransaction = function(localrow,event) {

		var rows = $scope.gridApi.selection.getSelectedRows();
		var callids = [];
		var nodes = [];

		callids.push(localrow.entity.callid);

		if(callids.indexOf(localrow.entity.callid_aleg) == -1 && localrow.entity.callid_aleg.length > 1) callids.push(localrow.entity.callid_aleg);

		angular.forEach(rows, function(row, key) {
		    if(callids.indexOf(row.callid) == -1) callids.push(row.callid);
		    if(callids.indexOf(row.callid_aleg) == -1 && row.callid_aleg.length > 1) callids.push(row.callid_aleg);
		    if(nodes.indexOf(row.dbnode) == -1) nodes.push(row.dbnode);
		});

		var search_data =  {
		    timestamp: {
			from: localrow.entity.milli_ts-5*100,
			to: localrow.entity.milli_ts+300*100
		    },
		    param: {
			search: {
			    id: parseInt(localrow.entity.id), 
			    callid: callids,
			    uniq: false
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
		var diff = $scope.diff * 60 * 1000;
				
		var timedate = userProfile.getProfile("timerange");
		search_data['timestamp']['to'] = timedate.to.getTime() - diff + 300*100;

		search_data['param']['transaction'][localrow.entity.trans] = true;
		var trwindowId = ""+localrow.entity.callid + "_" +localrow.entity.dbnode;
		
		nodes = userProfile.getProfile("node");		
                search_data['param']['location']['node'] = nodes['dbnode'];

                var search_profile = userProfile.getProfile("search");
                if(search_profile.hasOwnProperty('uniq')) {
                    search_data['param']['search']['uniq'] = search_profile.uniq;
                }
                
		$homerModal.open({
		    url: 'templates/dialogs/transaction.html',
		    cls: 'homer-modal-content',
		    id: "trans"+trwindowId.hashCode(),
		    params: search_data,
		    divLeft: event.clientX.toString()/2+'px',
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
	        saveWidths: true,
	        saveOrder: true,
	        saveVisible: true,
	        saveFocus: false,
	        saveScroll: true,
	        saveGrouping: false,
	        saveGroupingExpandedStates: true,
		enableColumnResizing: true,
		treeRowHeaderAlwaysVisible: false,
		enableSorting: true,
		enableRowSelection: true, 
		enableGridMenu: true,
		showGridFooter:true,
		noUnselect: false,
		multiSelect:true,
		modifierKeysToMultiSelect: false,
		enablePaging  : true,
		paginationPageSizes: [25, 50, 75, 100, 150, 200, 300, 400, 500, 600, 800, 1000, 2000],
		paginationPageSize: 25,
		enableFiltering: true,
		rowTemplate: rowtpl,
		exporterMenuPdf: false,

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
			cellTemplate: '<div class="ui-grid-cell-contents" title="date">{{grid.appScope.dateConvert(row, col)}}</div>',
			//cellFilter: 'date:\'yyyy-MM-dd HH:mm:ss.sss Z\':\'\+0400\'',
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
                    {field: 'to_user', displayName: 'To User'},
		    {field: 'callid',
			displayName: 'CallID',
			width: 160,
			cellTemplate: '<div  ng-click="grid.appScope.showTransaction(row, $event)" class="ui-grid-cell-contents"><span class="navText">{{COL_FIELD}}</span></div>'
		    },
		    {field: 'callid_aleg',
                        displayName: 'CallID_AL',
                        width: 100,
                        cellTemplate: '<div  ng-click="grid.appScope.showTransaction(row, $event)" class="ui-grid-cell-contents"><span class="navText">{{COL_FIELD}}</span></div>'
                    },
		    {field: 'user_agent', displayName: 'User Agent'},
		    {
		        name: 'source',
		        field: 'source_alias',
			displayName: 'Source Host',
			cellTemplate: '<div title="{{ grid.appScope.getColumnTooltip(row, col) }}">{{COL_FIELD}}</div>'
		    },
		    {field: 'source_port', displayName: 'SPort', width: 50},
		    {
		        field: 'destination_alias',
			displayName: 'Destination Host',
			cellTemplate: '<div title="{{ grid.appScope.getColumnTooltip(row, col) }}">{{ COL_FIELD }}</div>'
		    },
		    {field: 'destination_port', displayName: 'DPort', width: 50},
		    {field: 'proto', displayName: 'Proto', width: 40,
    	    	         cellTemplate: '<div class="ui-grid-cell-contents" title="proto">{{grid.appScope.protoCheck(row, col)}}</div>' 
		    },
		    {field: 'node', displayName: 'Node'},
		    {field: 'custom_field1', displayName: 'Custom F1', visible: false},
		    {field: 'custom_field2', displayName: 'Custom F2', visible: false},
		    {field: 'custom_field3', displayName: 'Custom F3', visible: false}
		]
	    };

	    $scope.state = localStorageService.get('localStorageGrid');	        

	    //$scope.state = {};

	    $scope.saveState = function() {	        
        	$scope.state = $scope.gridApi.saveState.save();
        	localStorageService.set('localStorageGrid',$scope.state);                              	
	    };

      	    $scope.restoreState = function() {
      	        $scope.state = localStorageService.get('localStorageGrid');
      	        if($scope.state) $scope.gridApi.saveState.restore( $scope, $scope.state );
      	    };
      	    
      	    $scope.resetState = function() {
        	$scope.state = {};
        	$scope.gridApi.saveState.restore( $scope, $scope.state);
        	localStorageService.set('localStorageGrid',$scope.state);                              	
      	    };

      	    eventbus.subscribe(homer.modules.pages.events.saveGridState, function(event, args) {
      	        $scope.saveState();
            });
            
            eventbus.subscribe(homer.modules.pages.events.restoreGridState, function(event, args) {
      	        $scope.restoreState();
            });
            
            eventbus.subscribe(homer.modules.pages.events.resetGridState, function(event, args) {
      	        $scope.resetState();
            });        

	    $scope.gridOpts.rowIdentity = function(row) {
		return row.id;
	    };

	    $scope.gridOpts.onRegisterApi = function(gridApi) {
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
		return input;
	    }
	};
     });
}(angular, homer));
