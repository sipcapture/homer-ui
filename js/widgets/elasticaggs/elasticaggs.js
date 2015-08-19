/*
 * HOMER 5 UI (Xenophon)
 *
 * Copyright (C) 2011-2015 Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Copyright (C) 2011-2015 Lorenzo Mangani <lorenzo.mangani@gmail.com> QXIP B.V.
 * License AGPL-3.0 http://opensource.org/licenses/AGPL-3.0
 *
*/

'use strict';

angular.module('homer.widgets.elasticaggs', ['adf.provider', 'highcharts-ng','base64'])
  .value('localApiUrl', 'api/v1/')
  .value('elasticaggsApiUrl', 'http://127.0.0.1:8086')
  .config(function(dashboardProvider){
    // template object for elasticaggs widgets
    var widget = {
      templateUrl: 'js/widgets/elasticaggs/elasticaggs.html',
      reload: true,
      resolve: {
        sipdata: function($scope, elasticaggsService, config){
          if (config.path && config.query){
            return elasticaggsService.get(config, config.path, config.query);
          } else {
	    config.query = JSON.stringify(  
		{
		   "size": 0,
		   "aggregations": {
		     "data": {
		         "$querytype": {
		            "field": "$query", 
	                     "size": 0
		         }
		      }
		   }
		}, null, 2);

	  }
        }
      },
      edit: {
        templateUrl: 'js/widgets/elasticaggs/edit.html',
        controller: 'elasticaggsEditController'
      },
      refresh: true
    };


    // register elasticaggs template by extending the template object
    dashboardProvider
      .widget('elasticaggsChart', angular.extend({
        title: 'Elastic Aggs',
        description: 'Display Elasticsearch Aggs',
        controller: 'elasticaggsCtrl'
        }, widget));

  })
  .service('elasticaggsService', function($q, $http, elasticaggsApiUrl, userProfile, $base64){
    return {
    
      get: function(config, path, query){
        var deferred = $q.defer();

	var timedate = userProfile.getProfile("timerange");
	query  = query.replace(/"\$fromts"/g, timedate.from.getTime());
	query  = query.replace(/"\$tots"/g, timedate.to.getTime());

	if (typeof config.query_string !== 'undefined' && config.query_string.indexOf('"') > -1) {
		query  = query.replace(/"\$query"/g, config.query_string);
	} else {
		query  = query.replace(/"\$query"/g, '"'+config.query_string+'"');
	}

        // SET QUERY TYPE
        if (config.chart.query_type) {
                          query  = query.replace(/"\$querytype"/g, '"'+config.chart.query_type+'"');
        }


	var myquery = query;	
	
        var url = path;
	if (config.db.user && path.indexOf("@") === -1) {
		console.log('ES: Custom HTTP authentication');
		if (config.db.password) {
			var basePass = config.db.user+":"+config.db.password;
		} else {
			var basePass = config.db.user+":";
		}
		
		$http.defaults.headers.common.Authorization = 'Basic '+$base64.encode(basePass);
	}

	console.log('ES-URL:', url);

	var objQuery = JSON.parse(query);
        console.log('ES-QUERY',objQuery);

        $http.post(url, objQuery )
          .success(function(data){

		config.debugresp = JSON.stringify(data);
		// Queries: value_count,terms,sum/avg/max/min,stats,
		console.log('ES-DATA:',data.aggregations);
		if (config.chart.query_type === 'value_count') {
			console.log('ES: AGGS COUNT');
                	deferred.resolve(data.aggregations.data.buckets);
		} else if (config.chart.query_type === 'terms') {
			console.log('ES: AGGS TERMS');
                	deferred.resolve(data.aggregations.data.buckets);
		} else if (config.chart.query_type === 'sum') {
			console.log('ES: AGGS SUM');
                	deferred.resolve(data.aggregations.data.buckets);
		} else if (config.chart.query_type === 'sum') {
			console.log('ES: AGGS SUM');
                	deferred.resolve(data.aggregations.data.buckets);
		} else if (config.chart.query_type === 'avg') {
			console.log('ES: AGGS SUM');
                	deferred.resolve(data.aggregations.data.buckets);
		} else { 
			console.log('REJECT: unsupported type?');
                	deferred.resolve(data.aggregations.data.buckets);
			// deferred.reject(); 
		}
          })
          .error(function(){
            console.log("ES ERROR");
            deferred.reject();
          });
        return deferred.promise;
      }
      
    };
  })
  .controller('elasticaggsCtrl', function($scope, config, sipdata, elasticaggsService){

    //function parseDate(input) {
    //  return (input*1000);
    //}    

    function parseDate(input) {
      return input;
    }
    
    var rangeDate = {};
    var data = {};

    console.log(config);
    
    if(!config.panel)  { return; }

    var fields = config.panel.fieldname.split(';');
    var values = config.panel.fieldvalue.split(';');    

    $scope.reloadIt = function() {              
          $scope.$parent.changeReloading(true);                    
	  elasticaggsService.get(config, config.path, config.query).then( function (sdata) {
		var seriesData = checkData(sdata);
                var chart = $scope.chartObj;
                if (typeof chart.series === 'undefined') return;
                var slen = seriesData.length;

                for (var i = 0, len = chart.series.length; i < len; i++) {
                        if(i <  slen)  chart.series[i].update(seriesData[i], true); //true / false to redraw                            
                        else if(chart.series[i]) chart.series[i].remove(false);
                }

                for (i; i < slen; i++) chart.addSeries(seriesData[i], true);

                $scope.$parent.changeReloading(false);

             },
             function(sdata) {
                return;
             });          
    };

    function checkData(locdata) 
    {

	    var rangeDate = {};
	        
             var fields = config.panel.fieldname.split(';');
             var values = config.panel.fieldvalue.split(';');
                                       
             angular.forEach(locdata, function(commit){
				
                      var timevalue = parseDate(commit[config.panel.timefield]);
                      var fv = [];

                      angular.forEach(fields, function(fl){
                             fv.push(fl);                             
                      });      

                      var fieldname = fv.join('|');
                      var fieldvalue = 0;
                      
                      angular.forEach(values, function(fl){
                            if(config.panel.fieldsum) {
                                 if(!rangeDate.hasOwnProperty(fieldname)) rangeDate[fieldname] = [];
                                 fieldvalue = commit[fl];
                                 rangeDate[fieldname][1] = fieldvalue;
                            }
                            else {                            
                            
                                if(!rangeDate.hasOwnProperty(fieldname)) rangeDate[fieldname] = [];                                
                                fieldvalue = commit[fl];
                                rangeDate[fieldname].push([timevalue,fieldvalue]);                                
                            }
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

	                           count.sort(function(a, b){ return a[0] - b[0];});
	                           var sar = {
	                                name: key,
	                                type: config.chart.type['value'],
	                                data: count
	                           };
	                           
	                           seriesData.push(sar);      
	                       });    
               }
            
		console.log('ES-SERIES-DATA:',seriesData);
               return seriesData;
    }


    if ( sipdata ){
         var seriesData = checkData(sipdata);    

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
               legend: {
                  enabled: false,
                  borderWidth: 0
               },
               series: seriesData
           };
           
	   // CHART TYPE AND OPTION HANDLING

	   // Terms Chart Option
           if(config.chart.query_type === 'terms') {
		console.log('ES-TERMS!');
	                $scope.chartConfig.xAxis.type = undefined;
	                $scope.chartConfig.xAxis.categories = [];

		angular.forEach(seriesData, function(data){

			angular.forEach(data.data, function(key){
				// console.log('ES-TERM-CATEGORY:',key[0]);
                       		$scope.chartConfig.xAxis.categories.push([key[0]]);
                    	});
                });

		if (typeof $scope.chartConfig.series[0] !== 'undefined'){
                  $scope.chartConfig.series[0].colorByPoint = true;
		}
	   }

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
  .controller('elasticaggsEditController', function($scope, $cookies, elasticaggsApiUrl, userProfile){


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
     
     $scope.query_type = [
     {
       name: 'Metric',
       value:  'value_count'
     },{
       name: 'Terms',
       value:  'terms'
     },{
       name: 'Stats',
       value: 'stats'
     },{
       name: 'Stats',
       value: 'stats'
     },{
       name: 'Max',
       value: 'max'
     },{
       name: 'Min',
       value: 'min'
     },{
       name: 'Avg',
       value:  'avg'
     }
     ];

     $scope.query_res = [
     {
       name: '1 Minute',
       value:  '1m'
     },{
       name: '5 Minutes',
       value:  '5m'
     },{
       name: '15 Minutes',
       value: '15m'
     },{
       name: '30 Minutes',
       value:  '30m'
     },{
       name: '60 Minutes',
       value:  '1h'
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

	      try {
			var objQuery = JSON.parse( $scope.config.query );
			var timedate = userProfile.getProfile("timerange");
	                var query = $scope.config.query;
        		query  = query.replace(/"\$fromts"/g, timedate.from.getTime());
			query  = query.replace(/"\$tots"/g, timedate.to.getTime());
			// SET QUERY
			// if (typeof $scope.config_query !== 'undefined'){
			  if (typeof $scope.config_query !== 'undefined' && $scope.config.query_string.indexOf('"') > -1) {
				query  = query.replace(/"\$query"/g, $scope.config.query_string);
			  } else {
				query  = query.replace(/"\$query"/g, '"'+$scope.config.query_string+'"');
			  }
			// } else { query  = query.replace(/"\$query"/g, '"*"'); }

			// SET QUERY TYPE
			if ($scope.query_type) {
				query  = query.replace(/"\$querytype"/g, '"'+$scope.config.chart.query_type+'"');
			}


			var url = $scope.config.path;
			var auth = "";
			if ($scope.config.db.user) {
				auth = "-U "+$scope.config.db.user;
			}
			
			if ($scope.config.db.password) {
				auth += ":"+$scope.config.db.password;
			}
			$scope.debug = "curl -v -X GET "+auth+" '"+url+"' -d '"+query+"\n";        	     
			$scope.parsingStatus = "ok";
			$scope.parsingColorClass="green";
	       }
	       catch(e) {
               		$scope.parsingStatus = "Bad parsing: ["+e.message+"]";
			$scope.parsingColorClass="red";
	       }
         }
    }  

    $scope.updateDebugUrl();

  });    
