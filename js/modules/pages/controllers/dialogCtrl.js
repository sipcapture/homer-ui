/*
 * HOMER 5 UI (Xenophon)
 *
 * Copyright (C) 2011-2015 Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Copyright (C) 2011-2015 Lorenzo Mangani <lorenzo.mangani@gmail.com> QXIP B.V.
 * License AGPL-3.0 http://opensource.org/licenses/AGPL-3.0
 *
 */

(function(angular, homer) {
    'use strict';

    angular.module(homer.modules.pages.name)
        .controller('drawCtrl', function($scope, $uibModalInstance) {

            console.log("OPEN DATA");

            $scope.ok = function() {
                $uibModalInstance.close("11");
            };

            $scope.close = function() {
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
            homer.modules.core.services.profile,
            function($scope, search, $homerModal, $timeout, $homerModalParams, $sce, userProfile) {

                var data = $homerModalParams.params;

                var timezone = userProfile.getProfile("timezone");
                $scope.dataLoading = true;
                $scope.showSipMessage = true;
                $scope.showSipDetails = false;
                $scope.msgOffset = timezone.offset;

                $scope.clickSipDetails = function() {
                    console.log("details");
                };


                search.searchMethod(data).then(function(sdata) {

                        var swapText = function(text) {
                            var swpA, swpB;

                            text = text.split('<').join('&lt;');

                            swpA = sdata[0].method;
                            swpB = '<font color=\'red\'><b>' + swpA + '</b></font>';
                            text = text.split(swpA).join(swpB);

                            swpA = sdata[0].callid;
                            swpB = '<font color=\'blue\'><b>' + swpA + '</b></font>';
                            text = text.split(swpA).join(swpB);

                            swpA = sdata[0].from_tag;
                            swpB = '<font color=\'red\'><b>' + swpA + '</b></font>';
                            text = text.split(swpA).join(swpB);

                            swpA = sdata[0].via_1_branch;
                            swpB = '<font color=\'green\'><b>' + swpA + '</b></font>';
                            text = text.split(swpA).join(swpB);


                            return $sce.trustAsHtml(text);
                        };

                        $scope.msgId = sdata[0].id;
                        $scope.msgCallId = sdata[0].callid;
                        //$scope.msgDate = sdata[0].date;
                        $scope.msgDate = sdata[0].micro_ts / 1000;
                        $scope.sipPath = sdata[0].source_ip + ":" + sdata[0].source_port + " -> " + sdata[0].destination_ip + ":" + sdata[0].destination_port;
                        $scope.sipMessage = swapText(sdata[0].msg); //.replace(/</g, "&lt;");

                        var tabjson = [];
                        for (var p in sdata[0]) {
                            if (p == "msg") continue;
                            if (sdata[0].hasOwnProperty(p) && sdata[0][p] != '') {
                                // tabjson.push(''+p +''+ ': <b>' + sdata[0][p].split('<').join('&lt;')+'</b><br>');
                                tabjson.push('<tr><td>' + p + '' + '</td><td>' + sdata[0][p].split('<').join('&lt;') + '</td></tr>');
                            }
                        }
                        tabjson.push();
                        // $scope.sipDetails = "<div id='"+sdata[0].id+"_details'>"+tabjson.join('')+"</div>";
                        $scope.sipDetails = "<div id='" + sdata[0].id + "_details'><table class='table table-striped'>" + tabjson.join('') + "</table></div>";
                        $scope.trustedHtmlDetails = $sce.trustAsHtml($scope.sipDetails);
                    },
                    function(sdata) {
                        return;
                    }).finally(function() {
                    $scope.dataLoading = false;
                    //$scope.$apply();                           
                });

                $timeout(function() {
                    if ($homerModal.getOpenedModals().indexOf('tempModal') !== -1) {
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

                $scope.expandModal = function(id) {
                    console.log("expand", id);
		    var modal = document.getElementById(id);
		
		    if (!modal.style.extop) {
			    modal.style.extop = modal.style.top;
			    modal.style.exleft = modal.style.left;
			    modal.style.top = '0px';
			    modal.style.left = '0px';
		    } else {
			    modal.style.top = modal.style.extop;
			    modal.style.left = modal.style.exleft;
			    modal.style.left = (window.innerWidth - modal.style.width) /2 + 'px';
			    modal.style.extop = undefined;
		    }

		    modal.classList.toggle('full-screen-modal');
		    $scope.drawCanvas($scope.id, $scope.transaction);

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
                $scope.enableQOSChart = false;

                $scope.colorsChart = ['aqua', 'black', 'blue', 'fuchsia', 'gray', 'green', 'lime', 'maroon', 'navy', 'olive', 'orange', 'purple', 'red', 'silver', 'teal', 'white', 'yellow'];

		/* convertor */
		$scope.XRTP2value = function(prop){
			var res = prop; 
			switch(prop) {
			    case 'CD':
			        res = 'SEC';
			        break;
			    case 'JI':
			        res = 'JITTER';				
			        break;
			    case 'PR':
			        res = 'RCVD';				
			        break;
			    case 'PS':
			        res = 'SENT';				
			        break;
			    case 'PL':
			        res = 'LOST';				
			        break;
			    case 'PD':
			        res = 'DELAY';				
			        break;
			    case 'IP':
			        res = 'MEDIA IP:PORT';				
			        break;
			    default:
			        break;
			}
			return res; 
		};

                /* new param */
                $scope.beginRTCPDataDisplay = new Date();
                $scope.endRTCPDataDisplay = new Date();
                $scope.beginRTCPDataIsSet = false;
                $scope.TimeOffSetMs = (new Date($scope.beginRTCPDataDisplay)).getTimezoneOffset() * 60 * 1000;
                $scope.calc_report = {
                    list: [],
                    from: 0,
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
                /* jitter */

                var getCallFileName = function() {
                    var fileNameTemplete = defineExportTemplate();
                    var callFileName = fileNameTemplete;
                    var ts_hms = new Date($scope.transaction.calldata[0].milli_ts);
                    var fileNameTime = (ts_hms.getMonth() + 1) + "/" + ts_hms.getDate() + "/" + ts_hms.getFullYear() + " " +
                        ts_hms.getHours() + ":" + ts_hms.getMinutes() + ":" + ts_hms.getSeconds();

                    callFileName = callFileName.replace("#{date}", fileNameTime);
                    callFileName = $.tmpl(callFileName, $scope.transaction.calldata[0]);
                    return callFileName;
                };

                $scope.exportCanvas = function() {
                    var myEl = angular.element(document.querySelectorAll("#" + $homerModalParams.id));
                    var canvas = $(myEl).find('#cflowcanv');
                    var a = document.createElement("a");
                    a.download = getCallFileName() + ".png";
                    a.href = canvas[0].toDataURL("image/png");
                    a.click();
                };

                $scope.exportPCAP = function() {
                    $scope.isPcapBusy = true;
                    makePcapText(this.data, 0, $scope.msgCallId);
                };

                $scope.exportTEXT = function() {
                    $scope.isTextBusy = true;
                    makePcapText(this.data, 1, $scope.msgCallId);
                };

                $scope.exportCloud = function() {
                    $scope.isCloudBusy = true;
                    makePcapText(this.data, 2, $scope.msgCallId);
                };

                $scope.exportShare = function() {
                    //makePcapText(this.data, false, $scope.msgCallId);		        
                    $scope.sharelink = "";
                    search.createShareLink(data).then(function(msg) {
                            if (msg) {
                                if (msg[0].match(/^http/)) {
                                        $scope.sharelink = msg[0];
                                } else {
                                        $scope.sharelink = location.protocol+"//"+window.location.hostname+'/share/'+msg[0];
                                }
                            }

                        },
                        function(sdata) {
                            return;
                        }).finally(function() {

                    });
                };

                $scope.toggleTree = function(id) {
                    $scope.collapsed[id] = !$scope.collapsed[id];
                };

                $scope.drawCanvas = function(id, mydata) {

                    $scope.clickArea = $homerCflow.setContext(id, mydata);
                };


                $scope.showMessage = function(data, event) {

                    var search_data = {

                        timestamp: {
                            from: parseInt(data.micro_ts / 1000),
                            to: parseInt(data.micro_ts / 1000)
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
                    var messagewindowId = "" + data.id + "_" + data.trans;
                    
                    var posx = event.clientX;
                    var posy = event.clientY;
                    var winx = window.screen.availWidth;
                    var winy = window.screen.availHeight;
                    var diff = parseInt((posx + (winx/3) + 20) - (winx));
		    // Reposition popup in visible area
                    if ( diff > 0 ) { posx -= diff; }     

                    $homerModal.open({
                        url: 'templates/dialogs/message.html',
                        cls: 'homer-modal-message',
                        id: "message" + messagewindowId.hashCode(),
                        divLeft: posx.toString() + 'px',
                        divTop: posy.toString() + 'px',
                        params: search_data,
                        onOpen: function() {
                            console.log('modal1 message opened from url ' + this.id);
                        },
                        controller: 'messageCtrl'
                    });
                };

                $scope.checkMousePosition = function(event) {

                    var ret = false;
                    var x = event.offsetX == null ? event.originalEvent.layerX - event.target.offsetLeft : event.offsetX;
                    var y = event.offsetY == null ? event.originalEvent.layerY - event.target.offsetTop : event.offsetY;

                    angular.forEach($scope.clickArea, function(ca) {
                        if (ca.x1 < x && ca.x2 > x && ca.y1 < y && ca.y2 > y) {
                            ret = true;
                            return;
                        }
                    });

                    return ret;
                };


                $scope.clickMousePosition = function(event) {

                    var ret = false;
                    var obj = {};
                    var x = event.offsetX == null ? event.originalEvent.layerX - event.target.offsetLeft : event.offsetX;
                    var y = event.offsetY == null ? event.originalEvent.layerY - event.target.offsetTop : event.offsetY;

                    angular.forEach($scope.clickArea, function(ca) {
                        if (ca.x1 < x && ca.x2 > x && ca.y1 < y && ca.y2 > y) {
                            ret = true;
                            obj = ca;
                            return;
                        }
                    });

                    if (ret) {
                        if (obj.type == 'host') {
                            console.log('clicked on host');
                        } else if (obj.type == 'message') {
                            $scope.showMessage(obj.data, event);
                        }
                    }

                    return ret;
                };

                $scope.reDrawCanvas = function() {
                    $scope.drawCanvas($scope.id, $scope.transaction);
                    $(window).resize();
                };

                search.searchTransaction(data).then(function(msg) {
                        if (msg) {
                            $scope.transaction = msg;
                            $scope.drawCanvas($homerModalParams.id, msg);
                        }
                    },
                    function(sdata) {
                        return;
                    }).finally(function() {
                    $scope.dataLoading = false;
                    //$scope.$apply();                           
                });

	
                $scope.showQOSReport = function(rdata) {

                    search.searchQOSReport(rdata).then(function(msg) {

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
                
                    if(subeb == 1) 
                    {
                            angular.forEach(stream["sub"], function(v, k) {
                                 console.log("ZZ");       
                            });
                    }                    
                    
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

                    search.searchLogReport(rdata).then(function(msg) {

                            if (msg.length > 0) {
                                $scope.enableLogReport = true;
                                $scope.logreport = msg;
                            }
                        },
                        function(sdata) {
                            return;
                        }).finally(function() {
                        $scope.dataLoading = false;
                    });
                };

                $scope.setRtcpMembers = function() {
                    $scope.rtcpMembers = [];
                    var tmp = {};
                    $scope.rtcpreport.forEach(function(rtcpData) {
                        var currentName = rtcpData.source_ip + " -> " + rtcpData.destination_ip;
                        if (tmp[currentName] == undefined) {
                            $scope.rtcpMembers.push({
                                name: currentName,
                                isShowJitter: true,
                                isShowPacketLost: true,
                                isShowStream: true
                            });
                            tmp[currentName] = currentName;
                        }
                    });
                    console.log("$scope.rtcpMembers: ", $scope.rtcpMembers);
                }


                // console.log(data);
                $scope.showQOSReport(data);
                $scope.showLogReport(data);
                var makePcapText = function(fdata, type, callid) {
                    search.makePcapTextforTransaction(fdata, type).then(function(msg) {

                            $scope.isPcapBusy = false;
                            $scope.isTextBusy = false;
                            $scope.isCloudBusy = false;

                            var filename = getCallFileName() + ".pcap";
                            var content_type = "application/pcap";

                            if (type == 1) {
                                filename = getCallFileName() + ".txt";
                                content_type = "attacment/text;charset=utf-8";
                            } else if (type == 2) {
                                if (msg.data && msg.data.hasOwnProperty("url")) {
                                    window.sweetAlert({
                                        title: "Export Done!",
                                        text: "Your PCAP can be accessed <a target='_blank' href='" + msg.data.url + "'>here</a>",
                                        html: true
                                    });
                                } else {
                                    var error = "Please check your settings";
                                    if (msg.data && msg.data.hasOwnProperty("exceptions")) error = msg.data.exceptions;
                                    window.sweetAlert({
                                        title: "Error",
                                        type: "error",
                                        text: "Your PCAP couldn't be uploaded!<BR>" + error,
                                        html: true
                                    });
                                }
                                return;
                            }

                            var blob = new Blob([msg], {
                                type: content_type
                            });
                            saveAs(blob, filename);

                        },
                        function(sdata) {
                            return;
                        }).finally(function() {});
                };

                $timeout(function() {
                    if ($homerModal.getOpenedModals().indexOf('tempModal') !== -1) {
                        $homerModal.close('tempModal', 'var a', 'var b');
                    }
                }, 5000);



                $scope.treedata2 = [{
                    "id": 1,
                    "title": "node1",
                    "nodes": [{
                        "id": 11,
                        "title": "node1.1",
                        "nodes": [{
                            "id": 111,
                            "title": "node1.1.1",
                            "nodes": []
                        }]
                    }, {
                        "id": 12,
                        "title": "node1.2",
                        "nodes": []
                    }]
                }, {
                    "id": 2,
                    "title": "node2",
                    "nodes": [{
                        "id": 21,
                        "title": "node2.1",
                        "nodes": []
                    }, {
                        "id": 22,
                        "title": "node2.2",
                        "nodes": []
                    }]
                }, {
                    "id": 3,
                    "title": "node3",
                    "nodes": [{
                        "id": 31,
                        "title": "node3.1",
                        "nodes": []
                    }]
                }];

            }
        ]);
}(angular, homer));
