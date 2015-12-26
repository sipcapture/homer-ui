/*
 * HOMER 5 UI (Xenophon)
 *
 * Copyright (C) 2011-2015 Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Copyright (C) 2011-2015 Lorenzo Mangani <lorenzo.mangani@gmail.com> QXIP B.V.
 * License AGPL-3.0 http://opensource.org/licenses/AGPL-3.0
 *
*/
'use strict';

angular.module('homer.widgets.querycap', ['adf.provider', 'highcharts-ng'])
  .value('localApiUrl', 'api/v1/')
  .value('querycapApiUrl', 'http://homer.yourhost.org:8086')
  .config(function(dashboardProvider){
    // template object for querycap widgets
    var widget = {
      templateUrl: 'js/widgets/querycap/querycap.html',
      reload: true,
      resolve: {
        sipdata: function($scope, querycapService, config){
          if(!config.query) config.query = "select * from \"homer.stats.counters.polycomMos.count\" where time > $fromts AND time < $tots;"           
          if(!config.path) config.path = "http://127.0.0.1:8086/query";
          
          if(!config.db) config.db = {};          
          if(!config.db.user) config.db.user = "root";
          if(!config.db.password) config.db.password = "root";
          if(!config.db.name) config.db.name = "homer_stats";
          
          if(!config.source) config.source = {};          
          if(!config.source.main) config.source.main = "results";
          if(!config.source.sub) config.source.sub = "series";
          
          if(!config.panel) config.panel = {};          
          if(!config.panel.timefield) config.panel.timefield = "time";
          if(!config.panel.fieldname) config.panel.fieldname = "name";
          if(!config.panel.fieldvalue) config.panel.fieldvalue = "value";
          
          if(!config.chart.maxvalue) config.chart.maxvalue = 0;
        
          if (config.path && config.query && config.db){
            return querycapService.get(config, config.path, config.query);
          }
        }
      },
      edit: {
        templateUrl: 'js/widgets/querycap/edit.html',
        controller: 'querycapEditController'
      },
      refresh: true
    };


    // register querycap template by extending the template object
    dashboardProvider
      .widget('querycapChart', angular.extend({
        title: 'QueryCapture',
        group: 'Charts',
        name: 'querycapChart',
        description: 'Display QueryCapture API data as charts',
        controller: 'querycapCtrl'
        }, widget));

  })
  .service('querycapService', function($q, $http, querycapApiUrl, userProfile){
    return {
    
      get: function(config, path, query){
        var deferred = $q.defer();
	var timedate = userProfile.getProfile("timerange");
	//query  = query.replace("@fromts", JSON.stringify(timedate.from).replace("\"","'"));
	//query  = query.replace("@tots", JSON.stringify(timedate.to).replace("\"","'"));		
	query  = query.replace(/\$fromts/g, timedate.from.getTime()*1000+"u");
	query  = query.replace(/\$tots/g, timedate.to.getTime()*1000+"u");
	var myquery = query;	
	
        var url = path + "?u="+config.db.user+"&p="+config.db.password+"&db="+config.db.name+"&q="+ encodeURIComponent(myquery);
	//console.log("QUERY CAP",url);
	$http.defaults.useXDomain = true;
        delete $http.defaults.headers.common.Authorization;
        $http.get(url)
          .success(function(data){
                
                var ldata = data.results;
                if(config.source && config.source.main) {
                      ldata = data[config.source.main];
                }          
                deferred.resolve(ldata);
          })
          .error(function(){
            deferred.reject();
          });
        return deferred.promise;
      }
      
    };
  })
  .controller('querycapCtrl', function($scope, config, sipdata, querycapService, $log){

    //function parseDate(input) {
    //  return (input*1000);
    //}    

    function parseDate(input) {
      return new Date(input).getTime();
    }

    
    var rangeDate = {};
    var data = {};

    var fields = config.panel.fieldname.split(';');
    var values = config.panel.fieldvalue.split(';');    

    $scope.reloadIt = function() {              
          $scope.$parent.changeReloading(true);                    
	  querycapService.get(config, config.path, config.query).then( function (sdata) {
	        var seriesData = checkData(sdata);
	        var chart = $scope.chartObj;
	        var slen = seriesData.length;

	        for (var i = 0, len = chart.series.length; i < len; i++) {
		        if(i <  slen)  chart.series[i].update(seriesData[i], true); //true / false to redraw				
		        else if(chart.series[i]) chart.series[i].remove(false);                        
		}
		
		for (var i = 0; i < slen; i++) chart.addSeries(seriesData[i], true);
								
		//chart.redraw();
		
                $scope.$parent.changeReloading(false);
	                  
		//$scope.chartObj.series[0].update({ data: seriesData}, true); //true / false to redraw				
             },
             function(sdata) {
                return;
             });          
    };

    function checkData(mydata) 
    {

	    var rangeDate = {};
	    
            angular.forEach(mydata, function(commit){
                                    
                 var mySubdata = commit.series;
                 if(config.source.sub) {
                      mySubdata = commit[config.source.sub];
                 }  
                
                 angular.forEach(mySubdata, function(sdata){
                                               
                       var fieldname =  sdata.name;
                       if(config.panel.fieldname) {
                            fieldname =  sdata[config.panel.fieldname];    
                       }
                                                    
                       angular.forEach(sdata.values, function(vdata){                                                                                          
                            var timevalue = parseDate(vdata[0]);
                            var fieldvalue =  vdata[1];
                            if(config.panel.fielddivide > 0) fieldvalue = fieldvalue/config.panel.fielddivide;                            
                            if(!rangeDate.hasOwnProperty(fieldname)) rangeDate[fieldname] = [];      
                            
                            /* workaround but we need it to avvoid some rtcp-xr duplication */
                            if(config.chart.maxvalue > 0 && config.chart.maxvalue < fieldvalue) fieldvalue = config.chart.maxvalue;
                            
                            rangeDate[fieldname].push([timevalue,fieldvalue]);
                        });
                 });
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
                     count.sort(function(a, b){ return a[0] - b[0];});
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
	      //console.log('CCOLOR-PIE:',$scope.chartConfig);
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
               legend: {
                  enabled: false,
                  borderWidth: 0
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
              // $scope.chartConfig.colors = config.chart.ccc.split(',');
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
  .controller('querycapEditController', function($scope, $cookies, querycapApiUrl, userProfile){


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


	if($scope.config && $scope.config.query && $scope.config.path && $scope.config.db)
	{	
	
	     var query = $scope.config.query;
	     var timedate = userProfile.getProfile("timerange");
	     query  = query.replace(/\$fromts/g, timedate.from.getTime()*1000+"u");
	     query  = query.replace(/\$tots/g, timedate.to.getTime()*1000+"u");	     
	     var url = $scope.config.path + "?u="+$scope.config.db.user+"&p="+$scope.config.db.password+"&db="+$scope.config.db.name+"&q="+ query;        	     
	     $scope.debug = "curl -v -X GET '"+url+"\'\n";        	     
	     $scope.parsingStatus = "ok";
	     $scope.parsingColorClass="green";
        }
    }  

    $scope.updateDebugUrl();

  });    
