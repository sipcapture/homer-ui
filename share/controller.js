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
                $scope.enableQOSChart = false;
                $scope.colorsChart = ['aqua', 'black', 'blue', 'fuchsia', 'gray', 'green', 'lime', 'maroon', 'navy', 'olive', 'orange', 'purple', 'red', 'silver', 'teal', 'white', 'yellow'];
                                                                                                 
				
		            // Voicenter vars

            $scope.beginRTCPDataDisplay = new Date();
            $scope.endRTCPDataDisplay = new Date();
            $scope.beginRTCPDataIsSet = false;
            $scope.TimeOffSetMs = (new Date($scope.beginRTCPDataDisplay)).getTimezoneOffset()*60*1000;
            $scope.calc_report = {
                list : [],
                from : 0,
                to: 0,
                totalRtcpMessages: 0,
                totalPacketLost: 0,
                averagePacketLost: 0,
                maxPacketLost: 0,
                totalPackets: 0,
                averageJitterMsec: 0,
                maxJitterMsec: 0
            };
            $scope.jittersFilterAll = true;
            $scope.packetsLostFilterAll = true;


            // Voicenter vars end

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
			  if (msg.calldata.length > 0) {			  			  
			      $scope.transaction = msg;			  			      
			      $scope.showPage = true;
                              $scope.drawCanvas('shareit', msg);	
                              //$scope.showRTCPReport(data);
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
								
                            } else {
				console.log('DISCARDING:',msg);
			    }
                     },
                     function(sdata) { return;}).finally(function(){
                          $scope.dataLoading = false;
                     });
                };


                $scope.showQOSReport = function(rdata) {

                    search.searchQOSReportById(rdata).then(function(msg) {

				var chartDataExtended = {
	                	        list: [],
	                	        from: 0,
	                	        to: 0,
	                	        totalRtcpMessages: 0,
	                	        totalPacketLost: 0,
	                	        totalJitters: 0,
	                	        averageJitterMsec: 0,
	                	        averagePacketLost: 0,
	                	        maxPacketLost: 0,
	                	        totalPackets: 0,
	                	        maxJitterMsec: 0,
	                	        msg: [],
	                	        mos: [],
	                	        averageMos: 0,
	                	        worstMos: 5
		            	};


                                //$scope.rtcpreport = msg;
                                //$scope.setRtcpMembers(rdata); // Voicenter function
                                //$scope.showRTCPChart(); // Voicenter function                            

				if (msg.global) {

					try {
                                          if (msg.global.main) {
						// Call Duration
                                                var adur = new Date(null); adur.setSeconds(msg.global.main.duration/1000); // seconds
                                                $scope.call_duration = adur.toISOString().substr(11, 8);
						// Map averages
						chartDataExtended.averageMos = (msg.global.main.mos_average).toFixed(2);
						chartDataExtended.worstMos = (msg.global.main.mos_worst).toFixed(2);
						chartDataExtended.totalPacketLost = msg.global.main.packets_lost;
						chartDataExtended.maxPacketLost = msg.global.main.packets_lost;
						chartDataExtended.totalPackets = msg.global.main.packets_sent + msg.global.main.packets_recv;
						chartDataExtended.averagePacketLost = (msg.global.main.packets_lost * 100 / chartDataExtended.totalPackets).toFixed(1);
						chartDataExtended.averageJitterMsec = msg.global.main.jitter_avg.toFixed(2);
						chartDataExtended.maxJitterMsec = msg.global.main.jitter_max.toFixed(2);
                                          }
					} catch(e) { console.log('no rtcp stats'); } 


					try {
                                          if (msg.global.calls) {
						var leg = 1;
						$scope.calc_calls = msg.global.calls;
					  }
					} catch(e) { console.log('no call stats'); } 

					try {
                                          if (msg.reports.xrtpstats.main) {
						$scope.calc_xrtp = msg.reports.xrtpstats.main;
						$scope.calc_xrtp.mos_avg = $scope.calc_xrtp.mos_avg.toFixed(2);
						$scope.calc_xrtp.mos_worst = $scope.calc_xrtp.mos_worst.toFixed(2);
						$scope.calc_xrtp.packets_all = parseInt($scope.calc_xrtp.packets_sent) + parseInt($scope.calc_xrtp.packets_recv);
						$scope.calc_xrtp.lost_avg = ($scope.calc_xrtp.packets_lost * 100 / $scope.calc_xrtp.packets_all ).toFixed(2);
					  }
					} catch(e) { console.log('no x-rtp stats'); } 
					

					// RTCP
					try {
					  if(msg.reports && msg.reports.rtcp && msg.reports.rtcp.chart) {					
					            //$scope.showQOSChart();
					            var charts =  msg.reports.rtcp.chart;
						    // RTCP-XR
						    if(msg.reports.rtcpxr && msg.reports.rtcpxr.chart) {
						    	    //$scope.chartData.concat(msg.reports.rtcpxr.chart);	
						    	    var xrcharts =  msg.reports.rtcpxr.chart;
						    	    angular.forEach(xrcharts, function(count, key) {
						    	            if(!charts[key]) charts[key] = count;						    	            
						    	    });
						    }

                                                    $scope.chartData = charts;
						    $scope.streamsChart = {};			
						    var i = 0;			    
						    angular.forEach(charts, function(count, key) {
								$scope.streamsChart[key] = {};
								$scope.streamsChart[key]["enable"] = true;
								$scope.streamsChart[key]["name"] = key;
        							$scope.streamsChart[key]["short_name"] = key.substr(key.indexOf(' ')+1);								
        							$scope.streamsChart[key]["type"] =  key.substr(0, key.indexOf(' '));
								$scope.streamsChart[key]["sub"] = {};
								angular.forEach(count, function(v, k) {
								        $scope.streamsChart[key]["sub"][k] = {};
        								$scope.streamsChart[key]["sub"][k]["enable"] = false;								
        								$scope.streamsChart[key]["sub"][k]["parent"] = key;								
        								$scope.streamsChart[key]["sub"][k]["name"] = k;								
        								$scope.streamsChart[key]["sub"][k]["color"]= $scope.colorsChart[i++];
									if (k == 'mos') $scope.streamsChart[key]["sub"][k]["enable"] = true;
								});								                                                                
						    });
						    						    
						    var selData	= $scope.presetQOSChartData();
						    $scope.showQOSChart(selData);
					            
					  }
					} catch(e) { console.log('no chart data'); } 



					// $scope.RTCPChart = msg.reports.rtcp.chart;
					// console.log($scope.RTCPChart);

                                }

                                //showQOSChart
				$scope.calc_report = chartDataExtended;
                    		$scope.enableRTCPReport = true;

                        },
                        function(sdata) {
                            return;
                        }).finally(function() {
                        $scope.dataLoading = false;
                    });
                };
                
                $scope.addRemoveStreamSerie = function(stream, subeb) {
                
                    var selData = $scope.presetQOSChartData();
                    $scope.showQOSChart(selData);                    
                };
                

		$scope.presetQOSChartData = function() {
			
			var seriesData = [];     
			var chartData = $scope.chartData;              
			$scope.selectedColorsChart = [];
                        angular.forEach(chartData, function(count, key) {
								
				if($scope.streamsChart && $scope.streamsChart[key] && $scope.streamsChart[key]["enable"] == false) 
							return;
	
				var localData = chartData[key];
				angular.forEach(localData, function(das, kes) {
				
				        /* skip it */
				        
				        if($scope.streamsChart[key]["sub"][kes]["enable"] == false) return;				
				        
				        var sar = {};
        	        		sar["name"] = kes;
			                sar["type"] = "line";
			                sar["color"] = $scope.streamsChart[key]["sub"][kes]["color"];

			                var lDas = [];
			                angular.forEach(das, function(v, k) { lDas.push([v[0],v[1]]);});

                                        lDas.sort(function(a, b) {
			        	    return a[0] - b[0];
			                });
			                sar["data"] = lDas;
                			seriesData.push(sar);
				});
		        });
		        return seriesData;
		};


                $scope.showQOSChart = function(seriesData) {

    	                $scope.enableQOSChart = true;

			$scope.chartConfig = {
		                    chart: {
		                        type: 'line'
                		    },
				    credits: {
				      enabled: false
				    },
		                    title: {
                		        text: "TEST",
		                        style: {
                		            display: "none"
		                        }
		                    },
		                    xAxis: {
		                        title: {
                		            text: null
		                        },
                		        type: "datetime"
		                    },
		                    yAxis: {
                		        title: {
		                            text: null
                		        },
		                        min: 0
                		    },
		                    plotOptions: {
                		        column: {}
		                    },
		                    tooltip: {},
                		    legend: {
		                        enabled: false,
                		        borderWidth: 0
		                    },
		                    series: seriesData,
		                    func: function(chart) {
        		                    $scope.$evalAsync(function () {
		                                    chart.reflow();
                                            });
                                    }
			};

	                $scope.chartConfig.chart["zoomType"] = "x";
        	        $scope.chartConfig.tooltip["crosshairs"] = true;
	                $scope.chartConfig.tooltip["shared"] = true;
	        	
                };
                
                $scope.refreshChart = function() {
                        $timeout(function() {
                                $scope.$broadcast('highchartsng.reflow');
			}, 30);                
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
                
                $scope.showLogReport(data);
                $scope.showQualityReport(data);
                $scope.showQOSReport(data);                

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

		var sdata = $homerModalParams.params;


		$scope.dataLoading = false;
		$scope.showSipMessage = true;
		$scope.showSipDetails = false;
		
		$scope.clickSipDetails = function() {
		    console.log("details");
		};
		
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
		//$scope.msgDate = sdata.date;
                $scope.msgDate = sdata.micro_ts/1000;
		$scope.sipPath = sdata.source_ip+":"+sdata.src_port+ " -> "+sdata.destination_ip+":"+sdata.dst_port;
		$scope.sipMessage = swapText(sdata.msg);    //.replace(/</g, "&lt;");
			  			  
		var tabjson=[];
                for (var p in sdata) {
                    if(p == "msg") continue;
                    if (sdata.hasOwnProperty(p) && sdata[p] != '' && typeof sdata[p] == 'string') {
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

                        $(element)
                        .draggable({
                              cancel: ".homer-modal-body, .close",
                              handle: ".homer-modal-header"
                        })
                        .resizable({
                            resize: function (evt, ui) {
                                var canv = $(element).find('#cflowcanv');
                                if($(canv).length > 0)
                                {
                                    scope.reDrawCanvas();
                                }

                                var messagebody = $(element).find('.homer-modal-body');
                                $(messagebody).width(ui.size.width - 10);
                                $(messagebody).height(ui.size.height - 50);
                            }
                        });
                }
             }
         });
                                                                                              
}(angular, homer));
