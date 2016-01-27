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
        .controller('drawCtrl',function($scope, $uibModalInstance){
                
		console.log("OPEN DATA");

		$scope.ok = function () {
    			$uibModalInstance.close("11");
		};

		$scope.close = function () {
		    $uibModalInstance.dismiss('cancel');
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
			  //$scope.msgDate = sdata[0].date;
                          $scope.msgDate = sdata[0].micro_ts/1000;
			  $scope.sipPath = sdata[0].source_ip+":"+sdata[0].source_port+ " -> "+sdata[0].destination_ip+":"+sdata[0].destination_port;
			  $scope.sipMessage = swapText(sdata[0].msg);    //.replace(/</g, "&lt;");
			  			  
			  var tabjson=[];
                          for (var p in sdata[0]) {
                                   if(p == "msg") continue;
			           if (sdata[0].hasOwnProperty(p) && sdata[0][p] != '') {
			               // tabjson.push(''+p +''+ ': <b>' + sdata[0][p].split('<').join('&lt;')+'</b><br>');
			               tabjson.push('<tr><td>'+p +''+ '</td><td>' + sdata[0][p].split('<').join('&lt;')+'</td></tr>');
                                   }
                          }  tabjson.push();
                          // $scope.sipDetails = "<div id='"+sdata[0].id+"_details'>"+tabjson.join('')+"</div>";
                          $scope.sipDetails = "<div id='"+sdata[0].id+"_details'><table class='table table-striped'>"+tabjson.join('')+"</table></div>";
			  $scope.trustedHtmlDetails = $sce.trustAsHtml($scope.sipDetails);			  
                     },
                     function(sdata) {
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

                $scope.exportCanvas = function() {
		        var myEl = angular.element(document.querySelectorAll("#"+$homerModalParams.id));	
		        var canvas = $(myEl).find('#cflowcanv');		                                		        
                        var a = document.createElement("a");
			a.download = getCallFileName()+".png";
			a.href = canvas[0].toDataURL("image/png");
			a.click();
		};
		
		$scope.exportPCAP = function() {
		        makePcapText(this.data, 0, $scope.msgCallId);		        
		};
		
		$scope.exportTEXT = function() {
		        makePcapText(this.data, 1, $scope.msgCallId);
		};
		
		$scope.exportExternal = function() {
		        makePcapText(this.data, 2, $scope.msgCallId);		        
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
                
                $scope.checkMousePosition = function (event) {
                                
                        var ret = false;
                        var x = event.offsetX==null?event.originalEvent.layerX-event.target.offsetLeft:event.offsetX;
                        var y = event.offsetY==null?event.originalEvent.layerY-event.target.offsetTop:event.offsetY;
		
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
                        var x = event.offsetX==null?event.originalEvent.layerX-event.target.offsetLeft:event.offsetX;
                        var y = event.offsetY==null?event.originalEvent.layerY-event.target.offsetTop:event.offsetY;

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
			 $(window).resize();
                };
		
                search.searchTransaction(data).then( function (msg) {

			  if (msg) {			  			  
			      $scope.transaction = msg;
                              $scope.drawCanvas($homerModalParams.id, msg);			     
                              if(msg.rtpinfo.length > 0) {
                                   $scope.enableXRTPReport = true;	  			  		  			  
                                   $scope.xrtpreport = msg.rtpinfo;			  			      
                              }                    
                              
                              // calc session duration
                              if (msg.calldata) {
					console.log('Get call duration....');
					var dates = [];
					for(var i=0; i<msg.calldata.length; i++) {
						dates.push(msg.calldata[i].milli_ts);
					}
					var maxT=new Date(Math.max.apply(null,dates));
					var minT=new Date(Math.min.apply(null,dates));
					var secs = (maxT.getTime() - minT.getTime())/1000;
					var milli = (maxT.getTime() - minT.getTime()) % 1000;
					var hours = Math.floor(secs / (60 * 60));	
					var divisor_for_minutes = secs % (60 * 60);
					var minutes = Math.floor(divisor_for_minutes / 60);
					var divisor_for_seconds = divisor_for_minutes % 60;
					var seconds = Math.ceil(divisor_for_seconds);
					$scope.sess_duration = ('0' + hours).slice(-2)+":"+('0' + minutes).slice(-2)+":"+('0' + seconds).slice(-2)+"."+milli;
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

				// VQ Stats
				$scope.vq_mos = [];
				$scope.vq_jit = [];
				$scope.vq_loss = [];
				$scope.vq_dates = [];
				for (var key in msg) {
				  if (msg.hasOwnProperty(key)) {
					// console.log(msg[key] );
					var tmpstr = JSON.stringify(msg[key].msg).split("},").join("},<br>");
					$scope.vq_mos.push( [ tmpstr, parseFloat(msg[key].msg.QualityEst.MOSCQ) ] );
					$scope.vq_loss.push( parseFloat(msg[key].msg.PacketLoss.NLR) );
					$scope.vq_jit.push( parseFloat(msg[key].msg.Delay.IAJ) );
					$scope.vq_dates.push( msg[key].date.split(" ")[1] );
				  }
				}
				// MOS Avg
				var sum_mos = 0;
				for( var i = 0; i < $scope.vq_mos.length; i++ ){
				    sum_mos = parseFloat(sum_mos) + parseFloat($scope.vq_mos[i][1]);
				}
				var avg_mos = sum_mos/$scope.vq_mos.length;
				$scope.vq_avg_mos = avg_mos.toFixed(1);
				// LOSS Total
				var sum_loss = 0;
				for( var i = 0; i < $scope.vq_loss.length; i++ ){
				    sum_loss = parseInt(sum_loss) + parseInt($scope.vq_loss[i]);
				}
				// $scope.vq_avg_loss = sum_loss/$scope.vq_loss.length;
				$scope.vq_avg_loss = sum_loss;
				// JITTER Avg
				var sum_jit = 0;
				for( var i = 0; i < $scope.vq_jit.length; i++ ){
				    sum_jit = parseFloat(sum_jit) + parseFloat($scope.vq_jit[i]);
				}
				var avg_jit = sum_jit/$scope.vq_jit.length;
				$scope.vq_avg_jit = avg_jit.toFixed(1);


				$scope.chartConfig = {
		  	                chart: {
					    polar: true,
			  	            type: 'bar',
				            backgroundColor:'rgba(255, 255, 255, 0.1)' 
				        },
					yAxis: [
					{
					        title: {
					            text: 'MOS'
					        }
    					}, {
					        title: {
					            text: 'Packet Loss'
					        },
						opposite:true
    					}, {
				                labels: {
				                    formatter: function () {
				                        return this.value + 'ms';
				                    },
			                    style: {
			                        color: '#89A54E'
				                    }
				                },
				                title: {
				                    text: 'Jitter',
				                    style: {
				                        color: '#89A54E'
				                    }
				                },
				                opposite: true
            				}],
					xAxis: {
						type: 'datetime',
					        categories: $scope.vq_dates 
    					},
				        series: [
						{ data: $scope.vq_jit, "name": "Jitter", "type": "spline", yAxis: 2 },
						{ data: $scope.vq_loss, "name": "Packet Loss", "type": "column", yAxis: 1 },
						{ data: $scope.vq_mos, "name": "MOS", "type": "column", yAxis: 0 }
				        ],
				        title: {
				            text: ''
				        },
					size: { height: '250' },
				        loading: false
				    };

				/*
				    $scope.reflow = function () {
				      $scope.$broadcast('highchartsng.reflow');
				    };

				    $timeout(function() {
				      $scope.$broadcast('highchartsng.reflow');
				    });
			  	*/	
                            }			  
                     },
                     function(sdata) { return;}).finally(function(){
                          $scope.dataLoading = false;
                     });
		};                


                $scope.showRTCPReport(data);
                $scope.showLogReport(data);
                $scope.showQualityReport(data);
                var makePcapText = function(fdata, type, callid) 
                { 
                        search.makePcapTextforTransaction(fdata, type).then( function (msg) {
	           	      var filename = getCallFileName()+".pcap";
	           	      var content_type = "application/pcap";	           	                                          	           	      
	           	      if(type == 1) {
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
