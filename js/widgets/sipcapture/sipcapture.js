/*
 * HOMER 5 UI (Xenophon)
 *
 * Copyright (C) 2011-2015 Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Copyright (C) 2011-2015 Lorenzo Mangani <lorenzo.mangani@gmail.com> QXIP B.V.
 * License AGPL-3.0 http://opensource.org/licenses/AGPL-3.0
 *
*/

'use strict';

angular.module('homer.widgets.sipcapture', ['adf.provider', 'highcharts-ng'])
  .value('localApiUrl', 'api/')
  .value('sipcaptureApiUrl', 'api/')
  .config(function(dashboardProvider){
    // template object for sipcapture widgets
    var widget = {
      templateUrl: 'js/widgets/sipcapture/sipcapture.html',
      reload: true,
      resolve: {
        sipdata: function($scope, sipcaptureService, config){
          if (config.path && config.query){
            return sipcaptureService.get(config, config.path, config.query);
          }
        }
      },
      edit: {
        templateUrl: 'js/widgets/sipcapture/edit.html',
        controller: 'sipcaptureEditController'
      },    
      refresh: true
    };


    // register sipcapture template by extending the template object
    dashboardProvider
      .widget('sipcaptureChart', angular.extend({
        title: 'SIPCapture Charts',
        description: 'Display SIPCapture API data as charts',
        controller: 'sipcaptureCtrl'
        }, widget));

  })
  .service('sipcaptureService', function($q, $http, sipcaptureApiUrl, userProfile){
    return {
      get: function(config, path, query){
        var deferred = $q.defer();
        var url = sipcaptureApiUrl + path;
        var objQuery = {};
        try {
            objQuery = JSON.parse( query );        
            if(!objQuery.timestamp) {
                deferred.reject();
                return deferred.promise;                          
            }
            
        }
        catch(e) {
            deferred.reject();
            return deferred.promise;    
        }
        
        var timedate = userProfile.getProfile("timerange");
        /* make construct of query */        
        objQuery.timestamp.from = timedate.from.getTime();
        objQuery.timestamp.to = timedate.to.getTime();               
                
	$http.post(url, objQuery)
          .success(function(data){
            if (data && data.status){
              var status = data.status;
              if ( status < 300 ){
                deferred.resolve(data.data);
              } else {
                deferred.reject(data.data);
              }
            }
          })
          .error(function(){
            deferred.reject();
          });
        return deferred.promise;
      }
    };
  })
  .controller('sipcaptureCtrl', function($scope, config, sipdata, sipcaptureService){

    function parseDate(input) {
      return (input*1000);
    }    
    
    var rangeDate = {};
    var data = {};
    
    var fields = config.panel.fieldname.split(';');
    var values = config.panel.fieldvalue.split(';');
    
    
    $scope.reloadIt = function() {              
          
          $scope.$parent.changeReloading(true);          
          
	  sipcaptureService.get(config, config.path, config.query).then( function (sdata) {
	        var seriesData = checkData(sdata);
		console.log(seriesData);
	        var chart = $scope.chartObj;
	        for (var i = 0, len =chart.series.length; i < len; i++) {
		        //chart.series[i].remove();
			chart.series[i].update({ data: seriesData[i].data}, true); //true / false to redraw				
		}

		$scope.$parent.changeReloading(false);		           			        
		//$scope.chartObj.series[0].update({ data: seriesData}, true); //true / false to redraw				
             },
             function(sdata) {
             	console.log("RZ");
                console.log(sdata);
                return;
             });          
    };

    function checkData(locdata) 
    {

	    var rangeDate = {};
    
	    angular.forEach(locdata, function(commit){
		      var timevalue = parseDate(commit[config.panel.timefield]);
		      var fv = [];
      
		      angular.forEach(fields, function(fl){
				fv.push(commit[fl])
		      });      
		      var fieldname = fv.join('|');            
      
		      var fieldvalue = 0;
		      angular.forEach(values, function(fl){
		            if(config.panel.fieldsum) fieldvalue = parseInt(commit[fl]);
		            else fieldvalue = parseInt(commit[fl]);
		      });

		      if(!rangeDate.hasOwnProperty(fieldname)) rangeDate[fieldname] = [];      
			      rangeDate[fieldname].push([timevalue,fieldvalue]);
		     });

		      var seriesData = [];
    
		     if(config.chart.type['value'] == "pie") {    
        
			seriesData.push( {
		        	type: config.chart.type['value'],
				name: $scope.$parent.model.title,
				data: []
			});
        
			angular.forEach(rangeDate, function(count, key){
				var valtotal = 0;
				angular.forEach(count, function(cntval){
					valtotal+=cntval[1];
				});
				seriesData[0].data.push([key, valtotal]);      
			});
		    }
		    else {
			angular.forEach(rangeDate, function(count, key){
				var sar = {};
				sar['name'] = key;
				sar['type'] = config.chart.type['value'];
				count.sort(function(a, b){ return a[0] - b[0]; });
				sar['data'] = count;
				seriesData.push(sar);      
			});    
		     }
		return seriesData;
    }

    var seriesData = checkData(sipdata);

   

    if ( sipdata ){

      if(config.chart.type['value'] == "pie") {    
        $scope.chartConfig = {
           chart: {
               type: 'pie',
               plotBackgroundColor: null,
               plotBorderWidth: null,
               plotShadow: false
            },
	    // colors: ['#395C9B', '#923532', '#7B972E', '#6A538D', '#3B83A1', '#CB7221', '#F2E200'], 
            title: {
                text: $scope.$parent.model.title,
                style: {
                      display: 'none'
                 }
            },
            plotOptions: {
              pie: {
                 allowPointSelect: true,
                 cursor: 'pointer',
                 depth: 0,
                 dataLabels: {
                    enabled: true,
                    color: '#000000',
                    connectorColor: '#000000',
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                 },
                 showInLegend: false
              }
            },
            series: seriesData
        };
        
  	// Colour Series Option
        if(config.chart.ccc) {
	      var cols = new Array();
	      cols = config.chart.ccc.split(',');
	      if(!$scope.chartConfig.hasOwnProperty("colors"))
	      {
	         $scope.chartConfig.colors = [];
	      }
              $scope.chartConfig.colors = cols;
	      console.log('CCOLOR-PIE:',$scope.chartConfig);
        }  

	// 3D Option
        if(config.chart.ddd) {
            $scope.chartConfig.chart['options3d'] = {
                  enabled: true,
                  alpha: 45,
                  beta: 0             
            }                            
            $scope.chartConfig.plotOptions.pie['depth'] = 35;            
        }                        
        
        if(config.chart.size) 
        {
            if(!$scope.chartConfig.hasOwnProperty("size"))
            {
                $scope.chartConfig.size = {};
            }
            
            if(parseInt(config.chart.size.width) > 0) {
                 $scope.chartConfig.size.width = config.chart.size.width;        
            }        
            
            if(parseInt(config.chart.size.height) > 0) {
                 $scope.chartConfig.size.height = config.chart.size.height;        
             }
         }
         
         if(config.chart.legend) 
         {
                //if(config.chart.legend.align) $scope.chartConfig.legend.align = config.chart.legend.align;                          
                if(config.chart.legend.enabled && config.chart.legend.enabled == true) {
                     $scope.chartConfig.plotOptions.pie.showInLegend = config.chart.legend.enabled;                          
                     $scope.chartConfig.plotOptions.pie.dataLabels.enabled = false;
                }
                //if(config.chart.legend.layout) $scope.chartConfig.legend.layout = config.chart.legend.layout;                          
         }                              
      }
      else {
                       
           $scope.chartConfig = {
             chart: { 
                type: config.chart.type['value']
              },
              title: {
                  text: $scope.$parent.model.title,
                  style: {
                      display: 'none'
                  }
              },
              xAxis: {
                  type: 'datetime'
              },
              yAxis: {
                  title: {
                      text: null
                  },
                  min: 0
               },  
               plotOptions: {
		  column: { }
               },    
               tooltip: {
               
               },
               legend: {
                  enabled: false,
                  borderWidth: 0
               },
               series: seriesData
           };
           
           //if(config.chart.type['value'] == "arearange") {

            $scope.chartConfig.chart['zoomType'] = 'x';                          
            $scope.chartConfig.tooltip['crosshairs'] = true;
            $scope.chartConfig.tooltip['shared'] = true;                              
           //}
           
	   // Colour Series Option
           if(config.chart.ccc) {
	      var cols = new Array();
	      cols = config.chart.ccc.split(',');
              $scope.chartConfig['colors'] = cols;
           }  

	   // Stacking Option
           if(config.chart.sss) {
	      var type = config.chart.type['value'];
              $scope.chartConfig.plotOptions[type] = new Object;
              if(config.chart.ppp) {
              	$scope.chartConfig.plotOptions[type].stacking = 'percent';
	      } else {
              	$scope.chartConfig.plotOptions[type].stacking = 'normal';
	      }
           }  

	   // 3D Option
           if(config.chart.ddd) {
               $scope.chartConfig.chart.options3d = {
                 enabled: true,
                 alpha: 15,
                 beta: 10,
                 depth: 50,
                 viewDistance: 30
             }                            
             
             $scope.chartConfig.plotOptions.column['depth'] = 25;            
             $scope.chartConfig.chart.margin = 60;            
           }  
          
          if(config.chart.size) 
          {
              if(!$scope.chartConfig.hasOwnProperty("size"))
              {
                $scope.chartConfig.size = {};
              }
            
              if(parseInt(config.chart.size.width) > 0) {
                 $scope.chartConfig.size.width = config.chart.size.width;        
              }        
            
              if(parseInt(config.chart.size.height) > 0) {
                 $scope.chartConfig.size.height = config.chart.size.height;        
              }
           }
           
           if(config.chart.legend) 
           {
                if(config.chart.legend.align) $scope.chartConfig.legend.align = config.chart.legend.align;                          
                if(config.chart.legend.enabled) $scope.chartConfig.legend.enabled = config.chart.legend.enabled;                          
                if(config.chart.legend.layout) $scope.chartConfig.legend.layout = config.chart.legend.layout;                          
           }                      
           
           if(config.chart.yaxis && config.chart.yaxis.title && config.chart.yaxis.title.length > 0)
           {
                $scope.chartConfig.yAxis.title.text = config.chart.yaxis.title;
           }
           
       }
    }
  })
  .controller('sipcaptureEditController', function($scope, $cookies, sipcaptureApiUrl, userProfile){


    $scope.charts = [
     {
       id: 1,
       label: 'Spline',
       value:  'spline'
     },{
       id: 2,
       label: 'Line',
       value: 'line'
     },{
       id: 3,
       label: 'Area spline',
       value:  'areaspline'
     }, {
       id: 4,
       label: 'Bar',
       value: 'bar'
     },{
       id: 5,
       label: 'Scatter',
       value:  'scatter'
     },{
       id: 6,
       label: 'Pie',
       value: 'pie'
     },{
       id: 7,
       label: 'Column',
       value: 'column'
<!--
     },{
       id: 8,
       label: 'Gauge',
       value: 'solidgauge'
     },{
       id: 9,
       label: 'Heatbox',
       value: 'heatmap'
-->
     }
     ];
     
     $scope.legend_align = [
     {
       name: 'center',
       value:  'center'
     },{
       name: 'right',
       value: 'right'
     },{
       name: 'left',
       value:  'left'
     }
     ];

     $scope.legend_layout = [
     {
       name: 'horizontal',
       value:  'horizontal'
     },{
       name: 'vertical',
       value: 'vertical'
     }
     ];

    
    $scope.updateDebugUrl = function() {
	    var url = sipcaptureApiUrl + $scope.config.path;
	    try {
        	 var objQuery = JSON.parse( $scope.config.query );       
        	 var timedate = userProfile.getProfile("timerange");            
        	 /* make construct of query */
        	 objQuery.timestamp.from = timedate.from.getTime();
        	 objQuery.timestamp.to = timedate.to.getTime();        
        	 $scope.debug = "curl -v --cookie 'HOMERSESSID="+$cookies['HOMERSESSID']+"' -X POST \\\n"
        	     + "-d '"+JSON.stringify(objQuery)+"' \\\n" + " \""+window.location.protocol + "//" + window.location.host+"/"+url+"\"\n";
        	     
                 $scope.parsingStatus = "ok";
        	 $scope.parsingColorClass="green";
            }
            catch(e) {
                $scope.parsingStatus = "Bad parsing: ["+e.message+"]";
                $scope.parsingColorClass="red";
            }            
    }  

    $scope.updateDebugUrl();

  });    
