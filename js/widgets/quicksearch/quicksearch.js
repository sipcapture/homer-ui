/*
 * HOMER 5 UI (Xenophon)
 *
 * Copyright (C) 2011-2015 Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Copyright (C) 2011-2015 Lorenzo Mangani <lorenzo.mangani@gmail.com> QXIP B.V.
 * License AGPL-3.0 http://opensource.org/licenses/AGPL-3.0
 *
*/

'use strict';

angular.module('homer.widgets.quicksearch', ['adf.provider'])
  .config(function(dashboardProvider){
    dashboardProvider
      .widget('quicksearch', {
        title: 'Search Form Builder',
        group: 'Search',
        name: 'quicksearch',
        description: 'Display Search Form component',
        templateUrl: 'js/widgets/quicksearch/quicksearch.html',
        controller: 'quicksearchCtrl',	
        controllerAs: 'qsearch',
	edit: {
           templateUrl: 'js/widgets/quicksearch/edit.html',
           controller: 'quicksearchEditCtrl'
      	}
      });
  })  
  .controller('quicksearchCtrl', [
     '$scope', 
     'config', 
     '$location',
     homer.modules.core.services.profile,
     '$log',
     homer.modules.core.services.search,             
     function($scope, config, $location, userProfile, $log, search){
           
           	
          /* workaround */    
          if(userProfile.profileScope.search && userProfile.profileScope.search instanceof Array)
                userProfile.profileScope.search={};

	  $scope.newObject = userProfile.profileScope.search;	 	     	  	  
	  $scope.newTransaction = userProfile.profileScope.transaction;	 	     	  	  
	  $scope.newResult = userProfile.profileScope.result;	 	     	  	  
	  $scope.newNode = userProfile.profileScope.node;	 	     	  	  
	
	  if (!config.fields){
	      config.fields = [
	                {name:"from_user",selection:"From"},
	                {name:"to_user",selection:"To"},
	                {name:"callid",selection:"Call-ID"}
                    ];
                                        
              config.searchbutton = true;
          }
          
	  this.fields = config.fields;

	  $scope.toggleSearchButton = function() {	  
	      $scope.showSearchButton = !$scope.showSearchButton;
	      config.searchbutton = !config.searchbutton;
	  }

	  $scope.timerange = userProfile.profileScope.timerange;

                /* update if timerange will be changed */
                (function () {
                      $scope.$watch(function () {
                            return userProfile.profileScope.search;
                      }, function (newVal, oldVal) {
                            if ( newVal !== oldVal ) {
                                $scope.newObject = newVal;
                            }
                        });
          }());

          $scope.nullSafe = function ( field ) {
             if ( !$scope.newObject[field] ) {
                   $scope.newObject[field] = "";
             }
          };
          
	  // process the form
          $scope.processSearchForm = function(t) {
                           
                if($scope.newObject instanceof Array) $scope.newObject={};                                
		userProfile.setProfile("search", $scope.newObject);
		userProfile.setProfile("transaction", $scope.newTransaction);
		userProfile.setProfile("result", $scope.newResult);
		userProfile.setProfile("node", $scope.newNode);
				
                var tres = $scope.newResult['restype'].name;				
				
                if(tres == "pcap") {
                     $scope.processSearchResult(false);
                }
		else if(tres == "text") {
                     $scope.processSearchResult(true);
                }
		else $location.path('/result'); 
	  }; 	  	  
	  
	  $scope.clearSearchForm = function(t) {
	        
	        /* should be {} */
	        /*
	        userProfile.profileScope.transaction = [$scope.type_transaction[0], $scope.type_transaction[1]];
	        userProfile.profileScope.result = [$scope.type_result[0]];
	        $scope.newTransaction = [$scope.type_transaction[0], $scope.type_transaction[1]];
	        $scope.newResult = [$scope.type_result[0]];
	        $scope.newNode = [$scope.db_node[0]];
		userProfile.setProfile("transaction", $scope.newTransaction);
		userProfile.setProfile("result", $scope.newResult);
		userProfile.setProfile("node", $scope.newNode);
		*/
		
		userProfile.profileScope.search = {};
		userProfile.setProfile("search", $scope.newObject);
	  }; 	  	  

	  
	  $scope.processSearchResult = function(text) {
                                    
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

		  var ts = new Date().getTime();
		  
		  search.makePcapTextData(data, text).then( function (msg) {
                              var filename = "HOMER5_"+ts+".pcap";
                              var content_type = "application/pcap";
                              if(text) {
                                    filename = "HOMER5_"+ts+".txt";
                                    content_type = "attacment/text;charset=utf-8";
                              }
                              var blob = new Blob([msg], {type: content_type});
                              saveAs(blob, filename);                         
        	  });
	  }; 


	  $scope.type_transaction = [
 		{ name:'call', value:'CALLS'},
    		{ name:'registration', value:'REGISTRATIONS'},
    		{ name:'rest', value:'OTHER'}
	  ];


	  $scope.type_result = [
 		{ name:'table', value:'TABLE'},
    		{ name:'pcap', value:'PCAP'},
    		{ name:'text', value:'TEXT'}
	  ];

	  $scope.db_node_selected = [];
	  $scope.db_node = [
 		{ name:'localhost', id:'localhost'}
	  ];
	  
	  search.loadNode().then( function (data) {	        
	           $scope.db_node = data;
          });	  

	  //$scope.type_result_selected = $scope.type_result[0];
	  $scope.newResult['restype'] =  $scope.type_result[0];
	  $scope.newNode['node'] =  $scope.db_node[0];
 	//$scope.newTransaction = [$scope.type_transaction[0], $scope.type_transaction[1]];
	
	$scope.type_method_selected = [];
	$scope.type_method = [
 		{ id:1, value:'INVITE', checked: false },
    		{ id:2, value:'REGISTER', checked: false },
    		{ id:3, value:'BYE', checked: false },
    		{ id:4, value:'CANCEL', checked: false },
    		{ id:5, value:'OPTIONS', checked: false },
    		{ id:6, value:'ACK', checked: false },
    		{ id:7, value:'PRACK', checked: false },
    		{ id:8, value:'SUBSCRIBE', checked: false },
    		{ id:9, value:'NOTIFY', checked: false },
    		{ id:10, value:'PUBLISH', checked: false },
    		{ id:11, value:'INFO', checked: false },
    		{ id:12, value:'REFER', checked: false },
    		{ id:13, value:'MESSAGE', checked: false },
    		{ id:14, value:'UPDATE', checked: false },
    		{ id:15, value:'1xx', checked: false },
    		{ id:16, value:'2xx', checked: false },
    		{ id:17, value:'3xx', checked: false },
    		{ id:18, value:'4xx', checked: false },
    		{ id:19, value:'5xx', checked: false },
    		{ id:20, value:'6xx', checked: false },
    		{ id:21, value:'', checked: false }
	];



   }])
  .controller('quicksearchEditCtrl', function($scope){

	  var counter = 0;
	  function getFields(){
	      if (!$scope.config.fields){
	        $scope.config.fields = [];
	      }
	      	      
	      return $scope.config.fields;
	   }

	   $scope.addField = function(){
		getFields().push({ name: "default"+counter} );
	   };
		
	   $scope.removeField = function(index){
		getFields().splice(index, 1);
	   };

	   $scope.headers = [
           
                   {name:'from_user', selection:'From User'},
                   {name:'from_domain', selection:'From Domain'},
                   {name:'to_user', selection:'To User'},
                   {name:'to_domain', selection:'To Domain'},
                   {name:'ruri_user', selection:'RURI User'},
                   {name:'ruri_domain', selection:'RURI Domain'},
                   {name:'callid', selection:'Call-ID'},
                   {name:'callid_aleg', selection:'B2B CID'},
                   {name:'custom_field1', selection:'Custom F1'},
                   {name:'custom_field2', selection:'Custom F2'},
                   {name:'custom_field3', selection:'Custom F3'},
                   {name:'contact_user', selection:'Contact User'},
                   {name:'pid_user', selection:'PID User'},
                   {name:'auth_user', selection:'Auth User'},
                   {name:'user_agent', selection:'User-Agent'},
                   {name:'method', selection:'Method'},
                   {name:'cseq', selection:'CSeq'},
                   {name:'reason', selection:'Reason'},
                   {name:'msg', selection:'Message'},
                   {name:'diversion', selection:'Diversion'},
                   {name:'via_1', selection:'VIA'},  
                   {name:'source_ip', selection:'Source IP'},
                   {name:'destination_ip', selection:'Dest. IP'},
                   {name:'source_port', selection:'Source Port'},
                   {name:'destination_port', selection:'Dest. Port'},
                   {name:'node', selection:'Node'},
                   {name:'uniq', selection:'Unique'},
                   {name:'orand', selection:'Logic OR'},
                   {name:'proto', selection:'Protocol'},
                   {name:'family', selection:'Family'},
                   {name:'limit', selection:'Limit Query'},
                   {name:'transaction', selection:'Transaction'},
                   {name:'dbnode', selection:'DB Node'},
                   {name:'b2b', selection:'B2B ext'},
                   {name:'restype', selection:'Result Type'}
            ];            	   
  }) 
  .directive('ngEnter', function() {
   return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngEnter);
                });
 
                event.preventDefault();
            }
        });
    };
  })
  .directive('fieldDisplay', function($compile) {
  return {
    scope: {
      fieldDisplay: "=", //import referenced model to our directives scope
      fieldName: "=", //import referenced model to our directives scope
      fieldHeaders: "="
    },
    templateUrl: 'js/widgets/quicksearch/template.html',
    link: function(scope, elem, attr, ctrl) {
    
      scope.selectedItem = {name: scope.fieldName, selection: scope.fieldDisplay};
                  
      scope.$watch('selectedItem', function(val) {      
           scope.fieldDisplay = val.selection;
           scope.fieldName = val.name;
      }, true);
      
    }
  }
  
});


