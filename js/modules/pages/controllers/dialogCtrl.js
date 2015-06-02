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
        .controller('drawCtrl',function($scope, $modalInstance){
                
		console.log("OPEN DATA");

		$scope.ok = function () {
    			$modalInstance.close("11");
		};

		$scope.close = function () {
		    $modalInstance.dismiss('cancel');
		};        
        })
        .controller('messageCtrl', [
                '$scope', 
                homer.modules.core.services.search,
                '$homerModal', 
                '$timeout', 
                '$homerModalParams', 
		'$sce',
                function($scope, search, $homerModal, $timeout, $homerModalParams, $sce) {

		var data = $homerModalParams.params;

		$scope.dataLoading = true;
		$scope.showSipMessage = true;
		$scope.showSipDetails = false;
		
		$scope.clickSipDetails = function() {
		    console.log("details");
		};
		

                search.searchMethod(data).then( function (sdata) {

			  var swapText = function(text){
 			  	var swpA, swpB;

 			  	text = text.split('<').join('&lt;');
 			  	
			  	swpA = sdata[0].method; 
				swpB = '<font color=\'red\'><b>'+swpA+'</b></font>';
			  	text = text.split(swpA).join(swpB);

			  	swpA = sdata[0].callid; 
				swpB = '<font color=\'blue\'><b>'+swpA+'</b></font>';
			  	text = text.split(swpA).join(swpB);

			  	swpA = sdata[0].from_tag; 
				swpB = '<font color=\'red\'><b>'+swpA+'</b></font>';
			  	text = text.split(swpA).join(swpB);

			  	swpA = sdata[0].via_1_branch; 
				swpB = '<font color=\'green\'><b>'+swpA+'</b></font>';
			  	text = text.split(swpA).join(swpB);
			  				  	

				return $sce.trustAsHtml(text);
			  };

			  $scope.msgId = sdata[0].id;
			  $scope.msgCallId = sdata[0].callid;
			  $scope.msgDate = sdata[0].date;
			  $scope.sipPath = sdata[0].source_ip+":"+sdata[0].source_port+ " -> "+sdata[0].destination_ip+":"+sdata[0].destination_port;
			  $scope.sipMessage = swapText(sdata[0].msg);    //.replace(/</g, "&lt;");
			  			  
			  var tabjson=[];
                          for (var p in sdata[0]) {
                                   if(p == "msg") continue;
			           if (sdata[0].hasOwnProperty(p) && sdata[0][p] != '') {
			               tabjson.push(''+p +''+ ': <b>' + sdata[0][p].split('<').join('&lt;')+'</b><br>');
                                   }
                          }  tabjson.push();
                          $scope.sipDetails = "<div id='"+sdata[0].id+"_details'>"+tabjson.join('')+"</div>";
			  $scope.trustedHtmlDetails = $sce.trustAsHtml($scope.sipDetails);			  
                     },
                     function(sdata) {
                        console.log("RZ");
                        console.log(sdata); 
                        return;
                     }).finally(function(){
                          $scope.dataLoading = false;
                          //$scope.$apply();                           
                });
                
                $timeout(function() {
                        if($homerModal.getOpenedModals().indexOf('tempModal') !== -1) {
                        $homerModal.close('tempModal', 'var a', 'var b');
                        }
                }, 5000);
	 }
       ])
       .controller('transactionCtrl', [
                '$scope', 
                homer.modules.core.services.search,
                '$homerModal', 
                '$homerCflow',
                '$timeout', 
                '$homerModalParams', 
		'$sce',
                function($scope, search, $homerModal, $homerCflow, $timeout, $homerModalParams, $sce) {

                var test;

		var data = $homerModalParams.params;
		$scope.data = data;
		
		$scope.dataLoading = true;
		$scope.showSipMessage = true;
		$scope.showSipDetails = false;
		
		$scope.clickSipDetails = function() {
		    console.log("details");
		};

		$scope.id = $homerModalParams.id;
		$scope.transaction = [];
		$scope.clickArea = [];
		$scope.msgCallId = $homerModalParams.params.param.search.callid[0];		
		$scope.collapsed = [];
		$scope.enableQualityReport = false;
		$scope.enableRTCPReport = false;	  			  
		$scope.enableLogReport = false;
		$scope.enableXRTPReport = false;
			  			  	  			  
                
		$scope.exportCanvas = function() {
		        var myEl = angular.element(document.querySelectorAll("#"+$homerModalParams.id));	
		        var canvas = $(myEl).find('#cflowcanv');		                                		        
                        var a = document.createElement("a");
			a.download = "callflow_"+$scope.msgCallId+".png";
			a.href = canvas[0].toDataURL("image/png");
			a.click();
		};
		
		$scope.exportPCAP = function() {
		        makePcapText(this.data, false, $scope.msgCallId);		        
		};
		
		$scope.exportTEXT = function() {
		        makePcapText(this.data, true, $scope.msgCallId);
		};
		
		$scope.exportShare = function() {
		        //makePcapText(this.data, false, $scope.msgCallId);		        
		      $scope.sharelink = "";
		      search.createShareLink(data).then( function (msg) {
                          if (msg) {          
			      $scope.sharelink = msg[0];
                          }                       
                     },
                     function(sdata) {
                        return;
                     }).finally(function(){
				
                     });      
		};

		$scope.toggleTree = function (id) {
		      $scope.collapsed[id] =! $scope.collapsed[id];
		};

                $scope.drawCanvas = function (id, mydata) {
                
                       $scope.clickArea = $homerCflow.setContext(id, mydata);
                };
                
                
		$scope.showMessage = function(data, event) {

                    var search_data =  {

                            timestamp: {
                                from: parseInt(data.micro_ts/1000),
                                to: parseInt(data.micro_ts/1000)
                            },
                            param: {
                                search: {
                                    id: parseInt(data.id),
                                    callid: data.callid
                                },
                                location: {
                                        node: data.dbnode
                                },
                                transaction: {
                                  call: false,
                                  registration: false,
                                  rest: false
                                }
                            }
                    };

                    search_data['param']['transaction'][data.trans] = true;
                    var messagewindowId = ""+data.id+"_"+data.trans;

                    $homerModal.open({
                        url: '/templates/dialogs/message.html',
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
                
                $scope.checkMousePosition = function (event) {
                                
                        var ret = false;
                        var x = event.offsetX;
                        var y = event.offsetY;
		
                        angular.forEach($scope.clickArea, function(ca) {
				if(ca.x1 < x && ca.x2 > x && ca.y1 < y && ca.y2 > y) {
				        ret = true;
				        return;
                                }
			});        
                                
                        return ret;
                };
                                                
                
                $scope.clickMousePosition = function (event) {
                                
                        var ret = false;
                        var obj = {};
                        var x = event.offsetX;
                        var y = event.offsetY;
                                                 
                        angular.forEach($scope.clickArea, function(ca) {
				if(ca.x1 < x && ca.x2 > x && ca.y1 < y && ca.y2 > y) {
				        ret = true;				        
				        obj = ca;
				        return;
                                }
			});        
			
			if(ret) {			
			        if(obj.type == 'host') {
			                console.log('clicked on host');
			        }
			        else if(obj.type == 'message') {
			                $scope.showMessage(obj.data, event);
			        }
			}
                                
                        return ret;
                };
                
                $scope.reDrawCanvas = function () {                
                        $scope.drawCanvas($scope.id, $scope.transaction);                
                };
		
                search.searchTransaction(data).then( function (msg) {

			  if (msg) {			  			  
			      $scope.transaction = msg;			  			      
                              $scope.drawCanvas($homerModalParams.id, msg);			     
                              if(msg.rtpinfo.length > 0) {
                                   $scope.enableXRTPReport = true;	  			  		  			  
                                   $scope.xrtpreport = msg.rtpinfo;			  			      
                              }                         
			  }			  
                     },
                     function(sdata) {
                        return;
                     }).finally(function(){
                          $scope.dataLoading = false;
                          //$scope.$apply();                           
                });
                
                                              
                $scope.showRTCPReport = function(rdata) {

                    search.searchRTCPReport(rdata).then( function (msg) {

			    if (msg.length > 0) {	
			        console.log("RTCP", msg);
			        $scope.enableRTCPReport = true;	  			  		  			  
			        $scope.rtcpreport = msg;			  			      
                            }			  
                     },
                     function(sdata) { return;}).finally(function(){
                          $scope.dataLoading = false;
                     });
		};                
		
		$scope.showLogReport = function(rdata) {
                  
                    search.searchLogReport(rdata).then( function (msg) {

			    if (msg.length > 0) {			  			  
			        $scope.enableLogReport = true;	  			  
			        $scope.logreport = msg;			  			      
                            }			  
                     },
                     function(sdata) { return;}).finally(function(){
                          $scope.dataLoading = false;
                     });
		};                
                		
		$scope.showQualityReport = function(rdata) {

                    /* only rtcp-xr = 1 , nvoice = 2 and so on... */
                    //report_data['param']['search']['type'] = 1;
                    var type = "short";
                    
                    search.searchQualityReport(type, rdata).then( function (msg) {

			    if (msg.length > 0) {		
			        $scope.enableQualityReport = true;	  			  
			        $scope.qualityreport = msg;			  		
                            }			  
                     },
                     function(sdata) { return;}).finally(function(){
                          $scope.dataLoading = false;
                     });
		};                


                $scope.showRTCPReport(data);
                $scope.showLogReport(data);
                $scope.showQualityReport(data);
                console.log("Reporting...", data);                
                                                
                var makePcapText = function(fdata, text, callid) 
                { 
                        search.makePcapTextforTransaction(fdata, text).then( function (msg) {
	           	      var filename = "HOMER5_"+callid+".pcap";
	           	      var content_type = "application/pcap";	           	                                          	           	      
	           	      if(text) {
	           	            filename = "HOMER5_"+callid+".txt";
	           	            content_type = "attacment/text;charset=utf-8";
                              }                              
                              var blob = new Blob([msg], {type: content_type});	           	      
                              saveAs(blob, filename);                                    
                         },
                         function(sdata) {
                                 return;
                         }).finally(function(){
                      });
                };                                
                
                $timeout(function() {
                        if($homerModal.getOpenedModals().indexOf('tempModal') !== -1) {
                        $homerModal.close('tempModal', 'var a', 'var b');
                        }
                }, 5000);
                
                
                
                $scope.treedata2 = [{
        "id": 1,
        "title": "node1",
        "nodes": [
          {
            "id": 11,
            "title": "node1.1",
            "nodes": [
              {
                "id": 111,
                "title": "node1.1.1",
                "nodes": []
              }
            ]
          },
          {
            "id": 12,
            "title": "node1.2",
            "nodes": []
          }
        ]
      }, {
        "id": 2,
        "title": "node2",
        "nodes": [
          {
            "id": 21,
            "title": "node2.1",
            "nodes": []
          },
          {
            "id": 22,
            "title": "node2.2",
            "nodes": []
          }
        ]
      }, {
        "id": 3,
        "title": "node3",
        "nodes": [
          {
            "id": 31,
            "title": "node3.1",
            "nodes": []
          }
        ]
      }];

	 }
       ]);    
}(angular, homer));
