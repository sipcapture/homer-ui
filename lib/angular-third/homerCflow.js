/**
 * homerCflow - An angularJS cflow directive / service with multiple window, resizing and draggable
 * @version v0.0.2
 * @license AGPLv2
 * @author Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * @author Lorenzo Mangani <lorenzo.mangani@gmail.com>
 *
 * Based on ocModal
 * @author Olivier Combe <olivier.combe@gmail.com>
 */
(function() {
	'use strict';

	var homerCflow = angular.module('homer.cflow', []);

	homerCflow.factory('$homerCflow', ['$rootScope', '$controller', '$location', '$timeout', '$compile', '$sniffer', '$q', '$filter', function($rootScope, $controller, $location, $timeout, $compile, $sniffer, $q, $filter) {
		
		var cflows = {};
		var data, renderPencil, renderLine, renderRectangle,renderCircle, renderAll, renderText, renderArrow, renderMeasureText, renderImage, strToCol;
		var context;
		
		/*
		var $body = angular.element(document.body),
			$dialogsWrapper = angular.element('<div role="dialog" tabindex="-1" class="cflow2"></div>'),
			//$dialogsWrapper = angular.element('<div aria-hidden="true" aria-labelledby="myModalLabel" class="cflow" draggable="" id="myModal" role="dialog" tabindex="-1">'),
			$cflowWrapper = angular.element('<div class="cflow-wrapper"></div>'),
			cflows = {},
			openedModals = [],
			baseOverflow;

		// include the cflow in DOM at start for animations
		$cflowWrapper.css('display', 'none');
		$cflowWrapper.append($dialogsWrapper);
		$body.append($cflowWrapper);
		*/

		renderPencil = function (data, context) {
			var i;

			context.beginPath();					
			context.lineCap = 'round';
			context.strokeStyle = data.Color;
			context.lineWidth = data.LineWidth;
			context.moveTo(data.Points[0].x, data.Points[0].y);
			for (i = 0; i < data.Points.length; i++) {
				context.lineTo(data.Points[i].x, data.Points[i].y);
			}
			context.stroke();
		};

		renderLine = function (data) {
			context.beginPath();
			context.strokeStyle = data.LineColor;
			context.lineWidth = data.LineWidth;
			context.lineCap = 'round';
			context.moveTo(data.StartX, data.StartY);
			context.lineTo(data.EndX, data.EndY);
			context.stroke();
		};
		
		renderArrow = function (data) {
			context.beginPath();
			context.strokeStyle = data.LineColor;
			context.lineWidth = data.LineWidth;
			context.lineCap = 'round';
			context.moveTo(data.StartX, data.StartY);
			context.lineTo(data.EndX, data.EndY);
                        var headlen = 10;
                        var dx = data.EndX-data.StartX;
                        var dy = data.EndY-data.StartY;
                        var angle = Math.atan2(dy,dx);
                        context.moveTo(data.StartX, data.StartY);
                        context.lineTo(data.EndX, data.EndY);
                        context.lineTo(data.EndX-headlen*Math.cos(angle-Math.PI/6),data.EndY-headlen*Math.sin(angle-Math.PI/6));
                        context.moveTo(data.EndX, data.EndY);
                        context.lineTo(data.EndX-headlen*Math.cos(angle+Math.PI/6),data.EndY-headlen*Math.sin(angle+Math.PI/6));
                        context.stroke();			
                        			
		};
		
		renderText = function (data) {
			context.beginPath();						
			context.fillStyle = data.TextColor;
			context.font = data.Font;
			context.textAlign = data.textAlign;
			context.fillText(data.Text, data.StartX, data.StartY);			
			context.stroke();
		};
		
		renderMeasureText = function (data) {
			context.strokeStyle = data.TextColor;
			context.font = data.Font;
			return context.measureText(data.Text);			
		};
		
		renderImage = function (data) {
		
		        context.beginPath();		                                
		        var base_image = new Image();
		        base_image.src = data.ImageSrc;
		        base_image.onload = function(){		          
        		        context.drawImage(base_image, data.StartX, data.StartY);
        		        context.stroke();
                        }
		};

		renderRectangle = function (data, context) {
			context.beginPath();
			context.strokeStyle = data.LineColor;
			context.fillStyle = data.FillColor;
			context.lineWidth = data.LineWidth;
			context.rect(data.StartX, data.StartY, data.Width, data.Height);

			if (data.FillShape) {
				context.fill();
			}
		
			context.stroke();
		};

		renderCircle = function (data, context) {
			context.beginPath();
			context.strokeStyle = data.LineColor;
			context.fillStyle = data.FillColor;
			context.lineWidth = data.LineWidth;
			context.arc(data.StartX, data.StartY, data.Radius, 0, Math.PI * 2, false);
	
			if (data.FillShape) {
				context.fill();
			}

			context.stroke();
		};

		strToCol = function(data) {
                        var hash = 0;
                        for (var i = 0; i < data.length; i++) {
                                hash = data.charCodeAt(i) + ((hash << 5) - hash);
                        }
                        return "hsl("+((hash>>24)&0xFF)+", 75%, 35%)";
		};


		var self = {

			waitingForOpen: false,

			getOpenedModals: function() {
				return openedModals;
			},

			register: function(params) {
				cflows[params.id || '_default'] = params;
			},

			remove: function(id) {
				delete cflows[id || '_default'];
			},
			
			setContext: function(id, data) {
			
			
			        var clickArea = [];
				var myEl = angular.element(document.querySelectorAll("#"+id));				
				var canv = $(myEl).find('#cflowcanv');				
				var ctx = canv[0].getContext('2d');
				
				context = ctx;
				var minArrHeight = 50;
				
				var height = $(myEl).height()-110;
				var width = $(myEl).width()-20;
											
				var records = data['calldata'].length;
				records+=3;
				
				if((records * minArrHeight) > height) height = records * minArrHeight;
				
                                ctx.canvas.width  = width;
                                ctx.canvas.height = height;                                				
                                
                                var hosts = {};                        
				var drawdata = {};			
				var textlen = {width: 0};
					
				ctx.clearRect(0, 0, context.canvas.width, context.canvas.height);	
				ctx.fillStyle="#FFF";
				ctx.opacity = 0.2;
				ctx.fillRect(0,0,context.canvas.width, context.canvas.height);

				width-=20;
				height-=30;
				
				var hostlen = Object.keys(data['hosts']).length - 1;
				var widthCoof = width / ( hostlen  ? hostlen : 1);
				
				var hostLen = Object.keys(data['hosts']).length;

				angular.forEach(data['hosts'], function(hdata, key) {
				        
				        var value = parseInt(hdata['position']);
				                                                                     
				  	drawdata = {};
				  	
					drawdata.LineColor = "#000";
					drawdata.LineWidth = 1;
					drawdata.StartX = value * widthCoof+10;
					drawdata.StartY = 65
					drawdata.EndX = value * widthCoof+10;					
					drawdata.EndY = height;
					renderLine(drawdata);
					
					hosts[key] = drawdata;

					drawdata = {};
					drawdata.TextColor = "#666666";
					drawdata.Text = key;
                                        drawdata.Font = "normal 11px Arial";					
                                        drawdata.textAlign = "start";
                                        drawdata.StartY = 60;

					if (myFlowStyle) {
						drawdata.TextColor = myFlowStyle.hosts.drawdata.TextColor;
						drawdata.Font = myFlowStyle.hosts.drawdata.Font;
						drawdata.LineColor = myFlowStyle.hosts.drawdata.LineColor;
						drawdata.LineWidth = myFlowStyle.hosts.drawdata.LineWidth;
					}
                                        
                                        textlen = renderMeasureText(drawdata);

                                        var startX = value * widthCoof  - (textlen.width/2) + 10;                                                                                                                                                             
                                        var imageX = value * widthCoof - 20;                                                                                                                                                             
					if(value == 0 ) { 
					        startX = value * widthCoof;                                        
					        imageX = value * widthCoof;
					}
                                        else if(value == (hostLen -1)) {
                                                startX = (value * widthCoof) - textlen.width + 15;
                                                imageX = value * widthCoof - 30;                                                                                                                                                             
                                        }
                                        					
					drawdata.StartX = startX;
										
					renderText(drawdata);
					
					clickArea.push({x1: drawdata.StartX, y1: drawdata.StartY-10, x2: drawdata.StartX+textlen.width, y2: drawdata.StartY+10, type: 'host'});										
					
					/* add image */
					var dr = data['uac'][key];
					drawdata = {};
					if (dr && dr.image) {
					  drawdata.ImageSrc = "/img/gateways/"+dr.image+".jpg";
					} else {
					  drawdata.ImageSrc = "/img/gateways/sipgateway.jpg";
					}

					/* Custom Agents overrides */
					if (dr && dr.agent && myUserAgents) {
						for(var x = 0; x < myUserAgents.length; x++) {
							if (dr.agent.match(myUserAgents[x].rule)) drawdata.ImageSrc = myUserAgents[x].img;
						}
					}

					drawdata.StartY = 2;
					drawdata.textAlign = "start";
					drawdata.StartX = imageX;
					renderImage(drawdata);					
					                                                                                                                                                                 
				});
				
				height-=130;
				var heightCoof = height /( (data['calldata'].length -1) ? (data['calldata'].length - 1) : 1);
				// Fixed Height Option?
				if(heightCoof < 50) heightCoof = 50;

				var i = 0, tmpX, tmpY;
				angular.forEach(data['calldata'], function(value) {

					if(hosts.hasOwnProperty(value.source_alias)) tmpX = hosts[value.source_alias];
                                        else tmpX = hosts[value.src_id];
                                        
                                        if(hosts.hasOwnProperty(value.destination_alias)) tmpY = hosts[value.destination_alias];
                                        else tmpY = hosts[value.dst_id];

				  	drawdata = {};				  				  	
				  	
					drawdata.LineColor = "#000";
					// dynamic leg color
					if (myFlowStyle && myFlowStyle.calldata.drawdata.ReColor) {
						drawdata.LineColor = strToCol(value.callid);
					}
					drawdata.LineWidth = 1;
					drawdata.StartX = tmpX.StartX;
					drawdata.StartY = i * heightCoof + 110;
					drawdata.EndX = tmpY.StartX;
					drawdata.EndY =  i * heightCoof + 110;
					renderArrow(drawdata);

					drawdata = {};
					drawdata.TextColor = value.msg_color;
					drawdata.Text = "" +(i+1)+ ": "+value.method_text;
					// drawdata.Font = "normal lighter 12px arial";						
					drawdata.Font = "12px Futura, Helvetica, Arial";						
					textlen = renderMeasureText(drawdata);
					drawdata.StartY =  i * heightCoof + 107;				
					if(tmpX.StartX < tmpY.StartX) drawdata.StartX = tmpX.StartX + 20 ;                                        
					else drawdata.StartX = tmpX.StartX - 20 - textlen.width ;                                        
                                        drawdata.textAlign = "start";

					if (myFlowStyle) {
						drawdata.Font = myFlowStyle.calldata.drawdata.Font;
					}

					renderText(drawdata);

                                        clickArea.push({x1: drawdata.StartX - 10, y1: drawdata.StartY-10, x2: drawdata.StartX+textlen.width, y2: drawdata.StartY+10, type: 'message', data: value});					        
                                        
                                        /* time */
                                        drawdata = {};
					drawdata.TextColor = "#C0C0C0";
					//drawdata.Text = new Date(value.micro_ts/1000).toISOString().replace("T", "  ").replace("Z", " ");
					drawdata.Text = $filter('date')(new Date(value.micro_ts/1000), "yyyy-MM-dd HH:mm:ss.sss"); 
					drawdata.Font = "lighter 8pt Arial";						
					drawdata.textAlign = "start";
					textlen = renderMeasureText(drawdata);
					drawdata.StartY =  i * heightCoof + 122;				
					if(tmpX.StartX < tmpY.StartX) drawdata.StartX = tmpX.StartX + 20 ;                                        
					else drawdata.StartX = tmpX.StartX - 20 - textlen.width ;                                        
                                        
                                        
					i++;
					renderText(drawdata);
					
				});

                                return clickArea;
			}
		};

		return self;
	}])
	.directive('canvasclick', ['$homerModal', function($homerModal) {
                return {
                        restrict: 'EA',
                        link: function($scope, $element, $attrs) {
                                $element.on('click', function(e) {
                                        $scope.clickMousePosition(e);                                        
                                });
                                
                                $element.on('mousemove', function(e, b) {

                                        if($scope.checkMousePosition(e)) $element.context.style.cursor = "pointer";
                                        else $element.context.style.cursor = "default";
                                });
                                
                        }
                };
        }]);
})();

