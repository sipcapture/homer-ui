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
    
    defineHomerAngularModule(homer.modules.app.name)
    .controller("homerShareAppController", [ 
             "$scope", 
             '$rootScope', 
             '$location',      
             'dialogs',
             'search',
 	     '$homerModal',
             '$homerCflow',
             '$timeout',
	     '$sce',
             function($scope, $rootScope, $location, $dialogs, search, $homerModal, $homerCflow, $timeout, $sce) {
                 console.log('MAIN controller init.');

		$rootScope.homerApp = 'HOMER';
		$rootScope.homerVersion = '5.0.44';
		
		var tid = $location.path();
		if(tid.substring(0, 1) == '/') tid = tid.substring(1);
		
		console.log(tid);
		

		console.log('HOMER INIT:',$rootScope);
                 
                var test;

  		var data = "";
		$scope.data = data;
		
		$scope.dataLoading = true;
		$scope.showSipMessage = true;
		$scope.showSipDetails = false;
		
		$scope.clickSipDetails = function() {
		    console.log("details");
		};

	        $scope.id = 1;
                $scope.transaction = [];
                $scope.clickArea = [];
                $scope.msgCallId = "";
                $scope.showPage = true;
                $rootScope.showError = false;
                $scope.collapsed = [];
                $scope.enableQualityReport = false;
                $scope.enableRTCPReport = false;
                $scope.enableLogReport = false;
                $scope.enableXRTPReport = false;

		var getCallFileName = function() {
			var fileNameTemplete = defineExportTemplate();
			var callFileName = fileNameTemplete ;
			var ts_hms = new Date($scope.transaction.calldata[0].milli_ts);
			var fileNameTime = (ts_hms.getMonth() + 1) + "/" + ts_hms.getDate() + "/" + ts_hms.getFullYear() + " " +
		          ts_hms.getHours() + ":" + ts_hms.getMinutes() + ":" + ts_hms.getSeconds() ;		

			callFileName = callFileName.replace("#{date}",fileNameTime );  			
			callFileName = $.tmpl(callFileName, $scope.transaction.calldata[0]);						
	 	        return callFileName;
		};

                $scope.toggleTree = function (id) {
                        $scope.collapsed[id] =! $scope.collapsed[id];
                };

		$scope.exportPCAP = function() {
		        makePcapText(this.data, false, $scope.msgCallId);		        
		};
		
		$scope.exportTEXT = function() {
		        makePcapText(this.data, true, $scope.msgCallId);
		};
		
		$scope.exportCanvas = function() {
                        var canvas = $("body").find('#cflowcanv');
                        var a = document.createElement("a");
                        a.download = getCallFileName() + ".png";
                        a.href = canvas[0].toDataURL("image/png");
                        a.click();
                };		
		
		$scope.exportShare = function() {
		        //makePcapText(this.data, false, $scope.msgCallId);		        
		      $scope.sharelink = "";
		      search.createShareLink(data).then( function (msg) {
                          if (msg) {          
			      $scope.sharelink = msg[0];
			      $scope.showPage = msg[0].callid;
                          }                       
                     },
                     function(sdata) {
                        return;
                     }).finally(function(){
				
                     });      
		};

                $scope.drawCanvas = function (id, mydata) {
                
                       $scope.clickArea = $homerCflow.setContext(id, mydata);
                };
                
                
		$scope.showMessage = function(data, event) {

                    var messagewindowId = ""+data.id+"_"+data.trans;

                    $homerModal.open({
                        url: 'message.html',
                        cls: 'homer-modal-content',
                        id: "message"+messagewindowId.hashCode(),
                        divLeft: event.clientX.toString()+'px',
                        divTop: event.clientY.toString()+'px',
                        params: data,
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
			                console.log(obj);			                
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
		
		var data = {		  
		    param: {
		      transaction_id: tid
		    }
		}		
				
                search.searchTransactionById(data).then( function (msg) {
                          console.log(msg);                          
			  if (msg.calldata.length > 0) {			  			  
			      $scope.transaction = msg;			  			      
			      $scope.showPage = true;
                              $scope.drawCanvas('shareit', msg);			  
			  }			  
			  else {
			          $rootScope.showError = true;
			          $scope.showPage = false;			          
			          $rootScope.ErrorLoad="The id doesn't exists";			          
			          console.log("EMPTY");
			  }
			  
                     },
                     function(sdata) {
                        return;
                     }).finally(function(){
                          $scope.dataLoading = false;
                          //$scope.$apply();                           
                });
                                                
                var makePcapText = function(fdata, text, callid) 
                { 
                        search.makePcapTextforTransactionById(data, text).then( function (msg) {
	           	      var filename = getCallFileName()+".pcap";
	           	      var content_type = "application/pcap";	           	                                          	           	      
	           	      if(text) {
	           	            filename = getCallFileName()+".txt";
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
                
                 $scope.showRTCPReport = function(rdata) {

                    search.searchRTCPReportById(rdata).then( function (msg) {

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

                    search.searchLogReportById(rdata).then( function (msg) {

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

                    search.searchQualityReportById(type, rdata).then( function (msg) {

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

                $timeout(function() {
                        if($homerModal.getOpenedModals().indexOf('tempModal') !== -1) {
                        $homerModal.close('tempModal', 'var a', 'var b');
                        }
                }, 5000);
                 
             }                          
    ])
    .controller('messageCtrl', [
                '$scope', 
                '$homerModal', 
                '$homerModalParams',                                
                '$timeout', 
		'$sce',
                function($scope, $homerModal, $homerModalParams, $timeout, $sce) {

                console.log($homerModalParams);

		var sdata = $homerModalParams.params;


		$scope.dataLoading = false;
		$scope.showSipMessage = true;
		$scope.showSipDetails = false;
		
		$scope.clickSipDetails = function() {
		    console.log("details");
		};
		
		console.log($homerModalParams);

		var swapText = function(text){
		    var swpA, swpB;
 		    text = text.split('<').join('&lt;');
 			  	
 		    swpA = sdata.method; 
 		    swpB = '<font color=\'red\'><b>'+swpA+'</b></font>';
		    text = text.split(swpA).join(swpB);

		    swpA = sdata.callid; 
		    swpB = '<font color=\'blue\'><b>'+swpA+'</b></font>';
		    text = text.split(swpA).join(swpB);

		    swpA = sdata.from_tag; 
		    swpB = '<font color=\'red\'><b>'+swpA+'</b></font>';
		    text = text.split(swpA).join(swpB);

		    swpA = sdata.via_1_branch; 
		    swpB = '<font color=\'green\'><b>'+swpA+'</b></font>';
		    text = text.split(swpA).join(swpB);
			  				  	
		    return $sce.trustAsHtml(text);
		};
		
		$scope.msgId = sdata.id;
		$scope.msgCallId = sdata.callid;
		$scope.msgDate = sdata.date;
		$scope.sipPath = sdata.source_ip+":"+sdata.src_port+ " -> "+sdata.destination_ip+":"+sdata.dst_port;
		$scope.sipMessage = swapText(sdata.msg);    //.replace(/</g, "&lt;");
			  			  
		var tabjson=[];
                for (var p in sdata) {
                    if(p == "msg") continue;
                    if (sdata.hasOwnProperty(p) && sdata[p] != '' && typeof sdata[p] == 'string') {
                      console.log(sdata[p]);
                      tabjson.push(''+p +''+ ': <b>' + sdata[p].split('<').join('&lt;')+'</b><br>');
                    }
                    tabjson.push();
                    $scope.sipDetails = "<div id='"+sdata.id+"_details'>"+tabjson.join('')+"</div>";
			  $scope.trustedHtmlDetails = $sce.trustAsHtml($scope.sipDetails);			  
                }
                
                $timeout(function() {
                        if($homerModal.getOpenedModals().indexOf('tempModal') !== -1) {
                        $homerModal.close('tempModal', 'var a', 'var b');
                        }
                }, 5000);                
	 }
       ]) 
       .directive('draggable', function(){
            return {
              restrict: 'EA',
              link: function(scope, element) {

                      console.log('DRAGG');
                      console.log(scope);

                        $(element)
                        .draggable({
                              cancel: ".homer-modal-body, .close",
                              handle: ".homer-modal-header"
                        })
                        .resizable({
                            resize: function (evt, ui) {
                                var canv = $(element).find('#cflowcanv');
                                console.log($(element).height());
                                if($(canv).length > 0)
                                {
                                    scope.reDrawCanvas();
                                }

                                var messagebody = $(element).find('.homer-modal-body');
                                console.log(messagebody);
                                $(messagebody).width(ui.size.width - 10);
                                $(messagebody).height(ui.size.height - 50);
                            }
                        });
                }
             }
         });
                                                                                              
}(angular, homer));
