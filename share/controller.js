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

							$scope.voicenterAnalyzeSipData(msg); // Voicenter function
							$scope.showRTCPReport(data);
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
								
								$scope.setRtcpMembers(rdata); // Voicenter function
								$scope.showRTCPChart();       // Voicenter function
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

                // Voicenter implimentations

				$scope.showRTCPChart = function (rdata) {

					$scope.calc_report = $scope.setDataBySelectedRange();
					//$scope.setChartSeries();
					//$scope.filterRtcpData(true);

					console.log("Start showRTCPChart ",$scope.rtcpreport);  
					if($scope.RTCPChart != undefined){
						$scope.RTCPChart.destroy ();
					}

					$scope.RTCPChart = new Highcharts.Chart({
						chart: {
							renderTo: 'rtcpchart-container',
							type: 'line',
							//width: '1000',
							zoomType: 'x'
						},
						title: {
							text: 'Information graph'
						},
						subtitle: {
							text: 'Jitters & Packets lost'
						},
						xAxis: {
							type: 'datetime',
							dateTimeLabelFormats: { // don't display the dummy year
								month: '%e. %b',
								year: '%b'
							},
							title: {
								text: 'Duration'
							},
							//max: rtcpChartData.to,
							//min: rtcpChartData.from
						},
						yAxis: {

							title: {
								text: 'Amount'
							},
							minRange:0,
							startOnTick:0,
							min: 0
						},
						plotOptions: {
							series: {
								cursor: 'pointer',
								point: {
									events: {

										click: function (e) {
											var clickTimeStemp= e.delegateTarget.options.x + $scope.TimeOffSetMs ;

											if(!$scope.beginRTCPDataIsSet)  {
												// Select from date:
												$scope.endRTCPDataDisplay = 0;
												$scope.beginRTCPDataDisplay = clickTimeStemp ;
												$scope.beginRTCPDataIsSet=true;
												$("#beginningDiv").addClass("bold");

											}  else {
												// Select end date:
												$scope.endRTCPDataDisplay = clickTimeStemp;
												$scope.beginRTCPDataIsSet=false;
												$("#beginningDiv").removeClass("bold");


												// Switch between dates in case of reverse selection
												if( $scope.endRTCPDataDisplay < $scope.beginRTCPDataDisplay ){
													var tmp =  $scope.endRTCPDataDisplay;
													$scope.endRTCPDataDisplay = $scope.beginRTCPDataDisplay;
													$scope.beginRTCPDataDisplay = tmp;
												}


												// Render data
												$scope.calc_report = $scope.setDataBySelectedRange();
												$scope.setChartSeries();
												$scope.$apply();
											}
										}
									}

								},
								marker: {
									lineWidth: 1
								}
							},
							line: {

								events: {
									legendItemClick: function (item) {
										//alert('I am an alert');
										//console.log("Clicked ", item);
										return false;
										// <== returning false will cancel the default action
									}
								}
								,
								showInLegend: true
							}
						}
					});

					$scope.setChartSeries();
					$scope.filterRtcpData(true);
					//$scope.$apply();
				};

				$scope.filterRtcpData = function(showAll) {

					if(showAll==null){showAll=false;}

					$("#beginRTCPDataInputDate").val((new Date($scope.beginRTCPDataDisplay).toLocaleDateString("he-IL")));
					$("#beginRTCPDataInputTime").val((new Date($scope.beginRTCPDataDisplay).toLocaleTimeString("he-IL")));
					$("#endRTCPDataInputDate").val((new Date($scope.endRTCPDataDisplay).toLocaleDateString("he-IL")));
					$("#endRTCPDataInputTime").val((new Date($scope.endRTCPDataDisplay).toLocaleTimeString("he-IL")));

					$("div[id*=RtcpDiv]").each(function(){
						//  if( $(this).attr('id').match(/pattern/) ) {
						// your code goes here
						//  }


						var DivTime = (this.id.toString().replace("RtcpDiv-",""))/1000 ;//+  $scope.TimeOffSetMs ;

						//console.log("beginRTCPDataDisplay-", $scope.beginRTCPDataDisplay);
						//console.log("DivTime--------------",DivTime);
						//console.log("endRTCPDataDisplay---",$scope.endRTCPDataDisplay);
						//$(this).show(500);
						if (($scope.beginRTCPDataDisplay<=DivTime && $scope.endRTCPDataDisplay>=DivTime)||showAll){

							$(this).show(500);
						}else{

							$(this).hide(500);
						}
					});
				};

				$scope.setChartSeries = function(){
					// Remove existing series
					console.log("$scope.rtcpMembers",$scope.rtcpMembers);
					console.log("$scope.calc_report",$scope.calc_report);
					while($scope.RTCPChart.series.length > 0)
						$scope.RTCPChart.series[0].remove(true);

					// Add series
					$scope.calc_report.list.forEach(function(ip) {
						$scope.rtcpMembers.forEach(function(member){
							console.log("ip",ip);
							console.log("member",member);

							if(ip == member.name)
							{
								if(member.isShowJitter == true)
								{
									$scope.RTCPChart.addSeries({name: "Jitter " + $scope.calc_report[ip].source_ip + " -> " + $scope.calc_report[ip].destination_ip, data: $scope.calc_report[ip].jitter});
									console.log("add jitter serie: " , {name: "Jitter " + $scope.calc_report[ip].source_ip + " -> " + $scope.calc_report[ip].destination_ip, data: $scope.calc_report[ip].jitter});
								}
								if(member.isShowPacketLost == true)
								{
									$scope.RTCPChart.addSeries({name: "Packets Lost " + $scope.calc_report[ip].source_ip + " -> " + $scope.calc_report[ip].destination_ip, data: $scope.calc_report[ip].packets_lost});
									console.log("add rtcp series :", {name: "Packets Lost " + $scope.calc_report[ip].source_ip + " -> " + $scope.calc_report[ip].destination_ip, data: $scope.calc_report[ip].packets_lost});
								}
							}
						});


						//totalPackets += $scope.calc_report[ip].totalPackets;

					});
					console.log("$scope.RTCPChart",$scope.RTCPChart);
				}

				$scope.vc_CalculateJitterMos = function(rtt, jitter, num_packets_lost){
					/*
					Take the rtt latency, add jitter, but double the impact to latency
					then add 10 for protocol latancies
					*/
					if(rtt == 0)
						rtt = 10;
					var effective_latency = rtt + (jitter * 2) + 10;
					var mos_val; 
					var r_factor;
					/*
					Implement a basic curve - deduct 4 for the r_factor at 160ms of latency
					(round trip). Anything over that gets a much more agressive deduction
					*/
					if (effective_latency < 160)
					{
						r_factor = 93.2 - (effective_latency / 40);
					}
					else
					{
						r_factor = 93.2 - (effective_latency - 120) / 10;
					}
					/*
					Now, let's deduct 2.5 r_factor per percentage of num_packets_lost
					*/
					r_factor = r_factor - (num_packets_lost * 100 * 2.5);
					if (r_factor > 100)
						r_factor = 100;
					else if (r_factor < 0)
						r_factor = 0;


					/* Convert the r_factor into an MOS value. (this is a known formula) */
					mos_val = 1 + (0.035) * (r_factor) + (0.000007) * (r_factor) * ((r_factor) - 60) * (100 - (r_factor));

					if (mos_val > 5)
						mos_val = 5;

					//LERR("[RTT: %.2f][Jitter: %.2f] [# Packet Lost: %u][R-Factor: %.2f][MOS: %.2f]", rtt, jitter, num_packets_lost, *r_factor, mos_val);

					return (mos_val);
				}

				$scope.setDataBySelectedRange = function() {
					var chartDataExtended = {
						list : [],
						from : 0,
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
						mos:[] ,
						averageMos:0,
						worstMos:5
					};

					var beginDate = $scope.beginRTCPDataDisplay * 1000;
					var endDate = $scope.endRTCPDataDisplay * 1000;

					console.log(beginDate, endDate);


					var mosCounter = 0;
					$scope.rtcpreport.forEach(function(rtcpData) {

						console.log("rtcpData loop ",rtcpData);    
						if(rtcpData.msg != undefined && rtcpData.msg != null ){

							//console.log("from " , beginDate, rtcpData.micro_ts);
							//console.log("to " , endDate, rtcpData.micro_ts);
							
							

							if (beginDate <= rtcpData.micro_ts && endDate >= rtcpData.micro_ts){ // Check we are in selected range
								if(rtcpData.msg.report_blocks != undefined && rtcpData.msg.report_blocks != null){
									
									
									if(rtcpData.msg.report_blocks[0] !== undefined)  {
										mosCounter++;
										var tmpMos = $scope.vc_CalculateJitterMos(rtcpData.msg.report_blocks[0].dlsr,rtcpData.msg.report_blocks[0].ia_jitter,rtcpData.msg.report_blocks[0].packets_lost);
										chartDataExtended.mos.push(tmpMos);
										chartDataExtended.averageMos += tmpMos;
										if(chartDataExtended.worstMos > tmpMos)
											  chartDataExtended.worstMos =   tmpMos;
											  
									
									}
									var currentName = rtcpData.source_ip+ " -> " + rtcpData.destination_ip ;
									var isJitterForShow = true;
									var isPacketLostForShow = true;
									var isShowStream = true;
									$scope.rtcpMembers.forEach(function(member){
										if(member.name == currentName && !member.isShowJitter)
										{
											isJitterForShow = false;
										}
										if(member.name == currentName && !member.isShowPacketLost)
										{
											isPacketLostForShow = false;
										}
										if(member.name == currentName && !member.isShowStream)
										{
											isShowStream = false
										}
									});

									if(isShowStream){
										chartDataExtended.msg.push(rtcpData);
										if(chartDataExtended[currentName] == undefined){
											chartDataExtended.list.push(currentName);
											chartDataExtended[currentName] = {};
											chartDataExtended[currentName].jitter = [];
											chartDataExtended[currentName].packets_lost = [];
											chartDataExtended[currentName].source_ip = rtcpData.source_ip;
											chartDataExtended[currentName].destination_ip = rtcpData.destination_ip;
											chartDataExtended[currentName].totalPackets = 0;
										}

										var timestamp = rtcpData.micro_ts/1000 -  $scope.TimeOffSetMs;
										if(chartDataExtended.from == 0){
											chartDataExtended.from = timestamp;
										}
										if(chartDataExtended.to < timestamp){
											chartDataExtended.to = timestamp;
										}

										if(isJitterForShow)
										{
											// Set jitter
											if( rtcpData.msg.report_blocks[0] !== undefined){
												chartDataExtended[currentName].jitter.push([timestamp ,  rtcpData.msg.report_blocks[0].ia_jitter]);
												if(chartDataExtended.maxJitterMsec < rtcpData.msg.report_blocks[0].ia_jitter){
													chartDataExtended.maxJitterMsec = rtcpData.msg.report_blocks[0].ia_jitter;
												}
												chartDataExtended.totalJitters += rtcpData.msg.report_blocks[0].ia_jitter;
											}
										}
										// Set packet lost
										if(isPacketLostForShow){
											if(rtcpData.msg.report_blocks[0] !== undefined){
												var packetLostTmp = [timestamp ,  rtcpData.msg.report_blocks[0].packets_lost];
												chartDataExtended[currentName].packets_lost.push(packetLostTmp);
												if(chartDataExtended.maxPacketLost < packetLostTmp[1])  {
													// Set maximum packet lost
													chartDataExtended.maxPacketLost = packetLostTmp[1];
												}
												chartDataExtended.totalPacketLost+=packetLostTmp[1];
											}
										}

										chartDataExtended.totalRtcpMessages++;
										// Set total packets
										if(rtcpData.msg.sender_information != undefined && chartDataExtended[currentName].totalPackets < rtcpData.msg.sender_information.packets){
											chartDataExtended[currentName].totalPackets = rtcpData.msg.sender_information.packets;

										}
									}
								}
							}
						}
					});

					chartDataExtended.averageMos = (chartDataExtended.averageMos  /  mosCounter).toFixed(2);
					chartDataExtended.worstMos = (chartDataExtended.worstMos).toFixed(2);
					// Total packets sum
					chartDataExtended.list.forEach(function(data) {
						chartDataExtended.totalPackets += chartDataExtended[data].totalPackets;

					});
					// Calculate averages
					if(chartDataExtended.totalPacketLost != 0 && chartDataExtended.totalRtcpMessages != 0){
						chartDataExtended.averagePacketLost = (chartDataExtended.totalPacketLost / chartDataExtended.totalRtcpMessages).toFixed(2);
					} else {
						chartDataExtended.averagePacketLost = 0;
					}

					if(chartDataExtended.totalJitters != 0 && chartDataExtended.totalRtcpMessages != 0){
						chartDataExtended.averageJitterMsec = (chartDataExtended.totalJitters / chartDataExtended.totalRtcpMessages).toFixed(2);
					} else {
						chartDataExtended.averageJitterMsec = 0;
					}

					$scope.calc_report = chartDataExtended;
					$scope.enableRTCPReport = true;
					$scope.filterRtcpData(true);
					//$scope.$apply();
					console.log("calc_report: ", $scope.calc_report);
					return chartDataExtended;
				}

				$scope.voicenterAnalyzeSipData = function(msg){

					console.log("voicenterAnalyzeSipData",msg);

					if (msg.calldata.length > 0) {

						// Calculate start & end & duration
						var startTime = msg.calldata[0].milli_ts;
						var endTime = msg.calldata[msg.calldata.length-1].milli_ts;
						var duration = parseInt((endTime - startTime) / 1000,10);

						$scope.beginRTCPDataDisplay = startTime;
						$scope.endRTCPDataDisplay = endTime;


						console.log("$scope.beginRTCPDataDisplay",$scope.beginRTCPDataDisplay);
						console.log("$scope.endRTCPDataDisplay",$scope.endRTCPDataDisplay);

						var hours = Math.floor(duration / 3600);
						duration %= 3600;
						var minutes = Math.floor(duration / 60);
						var seconds = duration % 60;

						if(hours < 10)
							hours = "0" + hours;

						if(minutes < 10)
							minutes = "0" + minutes;

						$scope.call_duration = "" + hours + ":" + minutes + ":" + seconds;
						// Calculate start & end & duration end

						// Get FROM / TO
						var leg1Callid = "";
						var leg2Callid = "";
						var leg1Invite = {};
						var leg2Invite = {};
						var leg1200 = {};
						var leg2200 = {};

						if(msg.calldata.length > 0){
							leg1Callid = msg.calldata[0].callid;
						}


						msg.calldata.forEach(function(sipPacket) {

							if(sipPacket.callid != leg1Callid && leg2Callid == ""){
								leg2Callid = sipPacket.callid;
							}

							if(jQuery.trim(sipPacket.method_text) == "INVITE  (SDP)") {
								if(leg1Invite.callid == undefined && sipPacket.callid == leg1Callid){
									leg1Invite = sipPacket;
								} else {
									if(sipPacket.callid == leg2Callid){
										leg2Invite = sipPacket;
									}
								}
							}
							if(jQuery.trim(sipPacket.method_text) == "200 OK (SDP)"){
								if(leg1200.callid == undefined && sipPacket.callid == leg1Callid){
									leg1200 = sipPacket;
								} else {
									if(sipPacket.callid == leg2Callid){
										leg2200 = sipPacket;
									}
								}
							}
						});



						$scope.LEG1_DTMFMODE = "INFO / INBAND";
						$scope.LEG2_DTMFMODE = "INFO / INBAND";


						var leg1From = "";
						var leg1To = "";
						var leg1CodecsInvite = [];
						var leg2CodecsInvite = [];
						var leg1Codecs200 = [];
						var leg2Codecs200 = [];
						var tmp = leg1Invite.msg.split("\r\n");
						tmp.forEach(function(sipHeader){
							if(sipHeader.substring(0,4).toUpperCase() == "FROM"){
								leg1From = sipHeader.substring(6).split(";")[0];
							}
							if(sipHeader.substring(0,2).toUpperCase() == "TO"){
								leg1To = sipHeader.substring(4).split(";")[0];
							}
							if(sipHeader.substring(0,8).toLowerCase() == "a=rtpmap"){
								var t = sipHeader.split(" ")[1].split("/");
								if(t[0] != "telephone-event"){
									leg1CodecsInvite.push(t[0]);
									//console.log(t[0]);
								}  else {
									$scope.LEG1_DTMFMODE = "RFC2833";
								}
							}
						});

						var leg2From = "";
						var leg2To = "";

						if(leg2Invite.msg != undefined){
							tmp = leg2Invite.msg.split("\r\n");
							tmp.forEach(function(sipHeader){
								if(sipHeader.substring(0,4).toUpperCase() == "FROM"){
									leg2From = sipHeader.substring(6).split(";")[0];
								}
								if(sipHeader.substring(0,2).toUpperCase() == "TO"){
									leg2To = sipHeader.substring(4).split(";")[0];
								}
								if(sipHeader.substring(0,8).toLowerCase() == "a=rtpmap"){
									var t = sipHeader.split(" ")[1].split("/");
									if(t[0] != "telephone-event"){
										leg2CodecsInvite.push(t[0]);
										//console.log(t[0]);
									}  else {
										$scope.LEG2_DTMFMODE = "RFC2833";
									}
								}
							});
						}

						if(leg1200.msg != undefined){
							tmp = leg1200.msg.split("\r\n");
							tmp.forEach(function(sipHeader){
								if(sipHeader.substring(0,8).toLowerCase() == "a=rtpmap"){
									var t = sipHeader.split(" ")[1].split("/");
									if(t[0] != "telephone-event"){
										leg1Codecs200.push(t[0]);
										//console.log("Leg1 code " + t[0]);
									}
								}
							});
						}

						if(leg2200.msg != undefined){
							tmp = leg2200.msg.split("\r\n");
							tmp.forEach(function(sipHeader){
								if(sipHeader.substring(0,8).toLowerCase() == "a=rtpmap"){
									var t = sipHeader.split(" ")[1].split("/");
									if(t[0] != "telephone-event"){
										leg2Codecs200.push(t[0]);
										//console.log("Leg2 code " + t[0]);
									}
								}
							});
						}
						$scope.FROM_LEG_1 = leg1From;
						$scope.TO_LEG_1 = leg1To;
						$scope.FROM_LEG_2 = leg2From;
						$scope.TO_LEG_2 = leg2To;

						// End get from / to
						// Set codecs:
						$scope.LEG11_CODEC1 = leg1CodecsInvite[0];
						$scope.LEG11_CODEC2 = leg1CodecsInvite[1];
						$scope.LEG11_CODEC3 = leg1CodecsInvite[2];

						$scope.LEG21_CODEC1 = leg1Codecs200[0];
						$scope.LEG21_CODEC2 = leg1Codecs200[1];
						$scope.LEG21_CODEC3 = leg1Codecs200[2];

						$scope.LEG12_CODEC1 = leg2CodecsInvite[0];
						$scope.LEG12_CODEC2 = leg2CodecsInvite[1];
						$scope.LEG12_CODEC3 = leg2CodecsInvite[2];

						$scope.LEG22_CODEC1 = leg2Codecs200[0];
						$scope.LEG22_CODEC2 = leg2Codecs200[1];
						$scope.LEG22_CODEC3 = leg2Codecs200[2];

						// Selected codecs:
						for(var ind = 0; ind < 3 ; ind++){
							if(leg1CodecsInvite[ind] == leg1Codecs200[ind]) {
								$scope.SELECTED_CODEC_LEG1 = leg1Codecs200[ind];
								break;
							}
						}
						for(var ind = 0; ind < 3 ; ind++){
							if(leg2CodecsInvite[ind] == leg2Codecs200[ind]) {
								$scope.SELECTED_CODEC_LEG2 = leg2Codecs200[ind];
								break;
							}
						}
					}

				};

				$scope.setRtcpMembers = function(){
					$scope.rtcpMembers = [];
					var tmp = {};
					$scope.rtcpreport.forEach(function(rtcpData) {
						var currentName = rtcpData.source_ip+ " -> " + rtcpData.destination_ip ;
						if(tmp[currentName] == undefined){
							$scope.rtcpMembers.push({
								name : currentName,
								isShowJitter: true,
								isShowPacketLost: true,
								isShowStream: true
							});
							tmp[currentName] = currentName;
						}
					});
					console.log("$scope.rtcpMembers: ", $scope.rtcpMembers);
				}


				// Chart 

				$scope.resetData = function(){
					$scope.rtcpMembers.forEach(function(member){
						member.isShowJitter = true;
						member.isShowPacketLost = true;
						member.isShowStream = true;
					});
					$scope.beginRTCPDataDisplay = $scope.rtcpreport[0].micro_ts/1000   ;
					$scope.endRTCPDataDisplay = $scope.rtcpreport[$scope.rtcpreport.length-1].micro_ts/1000  ;
					$scope.calc_report = $scope.setDataBySelectedRange();
					$scope.setChartSeries();
				}

				$scope.showAllJitters = function(jittersFilterAll){
					if($scope.rtcpMembers == undefined){
						return;
					}
					if(jittersFilterAll == true)
					{
						$scope.rtcpMembers.forEach(function(member){
							member.isShowJitter = true;
						});
					}  else {
						$scope.rtcpMembers.forEach(function(member){
							member.isShowJitter = false;
						});
					}
					$scope.calc_report = $scope.setDataBySelectedRange();
					$scope.setChartSeries();
				}

				$scope.showAllPacketsLost = function(packetsLostFilterAll){
					if($scope.rtcpMembers == undefined){
						return;
					}
					if(packetsLostFilterAll == true)
					{
						$scope.rtcpMembers.forEach(function(member){
							member.isShowPacketLost = true;
						});
					}  else {
						$scope.rtcpMembers.forEach(function(member){
							member.isShowPacketLost = false;
						});
					}
					$scope.calc_report = $scope.setDataBySelectedRange();
					$scope.setChartSeries();
				}

				$scope.addRemoveJitterSerie = function(el){

					if($scope.rtcpMembers == undefined){
						return;
					}
					$scope.calc_report = $scope.setDataBySelectedRange();
					$scope.setChartSeries();
				}

				$scope.addRemovePacketLostSerie = function(el){
					if($scope.rtcpMembers == undefined){
						return;
					}
					$scope.calc_report = $scope.setDataBySelectedRange();
					$scope.setChartSeries();
				}

				$scope.addRemoveStreamSerie = function(el){
					if($scope.rtcpMembers == undefined){
						return;
					}
					if(el.isShowStream){
						el.isShowPacketLost = true;
						el.isShowJitter = true;
					} else {
						el.isShowPacketLost = false;
						el.isShowJitter = false;
					}
					$scope.calc_report = $scope.setDataBySelectedRange();
					$scope.setChartSeries();
				}

				// Chart end

				// Voicenter implimentations end

				// $scope.showRTCPReport(data); // Move to search.searchTransactionById
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
		//$scope.msgDate = sdata.date;
                $scope.msgDate = sdata.micro_ts/1000;
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
