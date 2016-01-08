/*
 * HOMER 5 UI (Xenophon)
 *
 * Copyright (C) 2011-2015 Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Copyright (C) 2011-2015 Lorenzo Mangani <lorenzo.mangani@gmail.com> QXIP B.V.
 * License AGPL-3.0 http://opensource.org/licenses/AGPL-3.0
 *
*/

"use strict";

angular.module("homer.widgets.geochart", [ "adf.provider", "googlechart"])
.value("localApiUrl", "api/v1/")
.value("geochartApiUrl", "api/v1/")
.config(function(dashboardProvider) {
    var widget = {
        templateUrl: "js/widgets/geochart/geochart.html",
        reload: true,
        resolve: {
            sipdata: function($scope, geochartService, config) {
		if(!config.query) config.query = {};
		config.path = "statistic/country";
		
                if (config.path && config.query) {
                    return geochartService.get($scope, config, config.path, config.query);
                }
            }            
        },
        edit: {
            templateUrl: "js/widgets/geochart/edit.html",
            controller: "geochartEditController"
        },
        refresh: true
    };
    dashboardProvider.widget("geochartChart", angular.extend({
        title: "Geo geochart",
        group: "Charts",
        name: 'geochartChart',
        description: "Display SIPCapture API data on geochart",
        controller: "geochartCtrl"
    }, widget));
}).service("geochartService", function($q, $http, geochartApiUrl, userProfile) {
    return {

        get: function($scope, config, path, query) {
            var deferred = $q.defer();
            var url = geochartApiUrl + path;
            var objQuery = {};
	
            try {
                objQuery = JSON.parse(query);
                if (!objQuery.timestamp) {
                    deferred.reject();
                    return deferred.promise;
                }
            } catch (e) {
                deferred.reject();
                return deferred.promise;
            }
	

            objQuery = geochartWdgt.query($scope, objQuery, userProfile);

            $http.post(url,objQuery).success(function(data) {
                config.debugresp = JSON.stringify(data);
                if (data && data.status) {
                    var status = data.status;
                    if (status < 300) {
                        deferred.resolve(data.data);
                    } else {
                        deferred.reject(data.data);
                    }
                }
            }).error(function() {
                deferred.reject();
            });
            return deferred.promise;
        }
    };
}).directive("contenteditable", function() {
  return {
    require: "ngModel",
    link: function(scope, element, attrs, ngModel) {

      function read() {
        ngModel.$setViewValue(element.html());
      }

      ngModel.$render = function() {
        element.html(ngModel.$viewValue || "").text();
      };
	
       element.bind("keydown keypress", function(event) {
                if(event.which === 13) {
                    event.preventDefault();
                    scope.$apply(attrs.ngEnter);                    
                }
      });

      element.bind("blur keyup change", function() {
        scope.$apply(read);
      });
      element.bind("keydown keypress", function() {
        scope.$apply(read);
      });
    }
  };
}).controller("geochartCtrl", function($scope, config, sipdata, geochartService, eventbus, GoogleChartService) {
    function parseDate(input) {
        return input * 1e3;
    }
    var rangeDate = {};
    var data = {};
    var fields = $scope.config.panel ? $scope.config.panel.filters : [];

    console.log(this);

    $scope.mapConfig = true;
    
    $scope.reloadIt = function() {
        console.log("reloading");
        $scope.$parent.changeReloading(true);
        geochartService.get($scope, config, config.path, config.query).then(function(sdata) {

                $scope.$parent.changeReloading(false);            
                console.log("RELOADING MAP",sdata);
		drawMap(sdata);
            
        }, function(sdata) {
            console.log("data");
            return;
        });
    };
    
    $scope.handlePlotSelected =  function(event, ranges) {
        console.log("Selected:", event);
        console.log("Ranges:", ranges);

        var fromDate = new Date(ranges.xaxis.from);
        var toDate = new Date(ranges.xaxis.to);

        var search_time = { from: fromDate, to: toDate};
        console.log(search_time);
	eventbus.broadcast(homer.modules.pages.events.setTimeRange, search_time);        
	eventbus.broadcast('globalWidgetReload', 1);
    };


    function drawMap(data) {


        if (config.chart.type["value"] == "geochart") {

		console.log('Mapping',data);

		$scope.chartHeight = config.chart.size.height;
            	$scope.chartWidth = config.chart.size.width;

		var chart1 = {};
		  chart1.type = "GeoChart";
		  chart1.data = [];
       		  chart1.data.push(['Locale', 'Value', 'Percent', {role: 'tooltip', p:{html:true}} ]);

		  var t = 0;
		  data.forEach(function(e) {
			 t = t + parseInt(e.total);			 
    		  });

		  data.forEach(function(e) {
			var p = parseInt(e.total) / t * 100;
       		  	chart1.data.push([e.country,e.total,p, e.method+' ('+e.country+')']);
       		  	 //chart1.data.push([e.country,e.total,e.method+' ('+e.country+')' ]);
    		  });

		 chart1.options = {
		      chartArea: {left:10,top:10,bottom:20,height:"100%",width:"100%"},
		      displayMode: 'regions',
		      //magnifyingGlass:  {enable: true, zoomFactor: 5.0},
		      backgroundColor: '#e7f6fe',
		      datalessRegionColor: '#efefef',		                
		      colorAxis : {
        	    	colors : ['20C248', 'FFFF00', 'FF0000']
        	      },
		      //legend: true,
		      tooltip: {
        		    isHtml: true
        	      }
		  };

		  /*
		  chart1.formatters = {
     			number : [{
			       columnNum: 4,
			       pattern: "$ #,##0.00"
		       }]
		  };
		  */

		  $scope.chart = chart1;
	console.log(GoogleChartService());

		
	}
    };


    function checkData(locdata) {
        var rangeDate = {};
        angular.forEach(locdata, function(commit) {
            var timevalue = parseDate(commit[config.panel.timefield.field]);
            var fv = [];
            angular.forEach(fields, function(fl) {
                fv.push(commit[fl.type]);
            });
            var fieldname = fv.join("|");
            var fieldvalue = 0;
            fieldvalue = parseInt(commit.total);
	//            angular.forEach(values, function(fl) {
	//                if (config.panel.fieldsum) fieldvalue = parseInt(commit[fl.field])
	//		else fieldvalue = parseInt(commit[fl.field]);
	//            });
            if (!rangeDate.hasOwnProperty(fieldname)) rangeDate[fieldname] = [];
            rangeDate[fieldname].push([ timevalue, fieldvalue ]);
        });
        var seriesData = [];
        if (config.chart.type["value"] == "geochart") {
            angular.forEach(rangeDate, function(count, key) {
                var sar = {};
                sar["name"] = key;
                sar["type"] = config.chart.type["value"];
                count.sort(function(a, b) {
                    return a[0] - b[0];
                });
                sar["data"] = count;
                seriesData.push(sar);
            });
        }
        return seriesData;
    }
    
    /* DRAW DATA */

   if(sipdata) {
       if (config.chart && config.chart.hasOwnProperty("library") && config.chart.library.value == "google") {

           var seriesData = sipdata;
           drawMap(seriesData);

       }
   }
   
}).controller("geochartEditController", function($scope, $cookies, geochartApiUrl, userProfile) {
    
    console.log($scope);
    
    $scope.charts = [ {
        id: 1,
        label: "GeoChart",
        value: "geochart"
    } ];

    $scope.library = [ {
        id: 1,
        label: "Google",
        value: "google"
    }];

    $scope.legend_align = [ {
        name: "center",
        value: "center"
    }, {
        name: "right",
        value: "right"
    }, {
        name: "left",
        value: "left"
    } ];
    $scope.legend_layout = [ {
        name: "horizontal",
        value: "horizontal"
    }, {
        name: "vertical",
        value: "vertical"
    } ];

    /*
    $scope.updateDebugUrl = function() {
        var url = geochartApiUrl + $scope.config.path;
        try {
            var objQuery = JSON.parse($scope.config.query);

            objQuery = geochartWdgt.query($scope, objQuery, userProfile);
 
            $scope.debug = "curl -v --cookie 'HOMERSESSID=" + $cookies["HOMERSESSID"] + "' -X POST \\\n" + "-d '" + JSON.stringify(objQuery) + "' \\\n" + ' "' + window.location.protocol + "//" + window.location.host + "/" + url + '"\n';
            $scope.parsingStatus = "ok";
            $scope.parsingColorClass = "green";
        } catch (e) {
            $scope.parsingStatus = "Bad parsing: [" + e.message + "]";
            $scope.parsingColorClass = "red";
        }
    };
    
    */

    $scope.datasources = geochartWdgt.data.datasources.datasources;

    //--------------------------------------------------------------------------------------
    // On datasource select
    //--------------------------------------------------------------------------------------
    $('body').on('change', '#widgetDatasources', function() {
        $("#query").val($scope.config.panel.datasource.settings.query).trigger('change');
        $("#path").val($scope.config.panel.datasource.settings.path).trigger('change');
    });

    //$scope.updateDebugUrl();

    //==========================================================================================
    // Chart basic settings
    //==========================================================================================

    //------------------------------------------------------------------------------------------
    // Select Chart
    //------------------------------------------------------------------------------------------
    $scope.selectType = function() {
        if ($scope.config.chart.type.value == 'total') {
            $scope.config.panel.total = true;
        } else {
            if ($scope.config.panel) $scope.config.panel.total = false;
        }
    };

    //------------------------------------------------------------------------------------------
    // Select Engine
    //------------------------------------------------------------------------------------------
    $scope.selectEngine = function() {
        if ($scope.config.chart.update) $scope.config.chart.update.clear();
    };

    //==========================================================================================
    // Filters
    //==========================================================================================

    // add an item
    
    $scope.addFilter = function() {
        if (!$scope.config.panel.filters) {
            $scope.config.panel.filters = [];
        }
        $scope.config.panel.filters.push({
            type: $scope.config.panel.filter.type,
            value: $scope.config.panel.filtervalue.value
        });
    };

    // remove an item
    $scope.removeFilter = function(index) {
        $scope.config.panel.filters.splice(index, 1);
    };

    //==========================================================================================
    // General
    //==========================================================================================

    
    // remove an item
    $scope.reset = function(index) {
        $scope.config.panel.values = [];
        $scope.config.panel.filters = [];
    };

});


////////////////////////////////////////////////////////////////////////////////////////////
// Widget object
////////////////////////////////////////////////////////////////////////////////////////////
var geochartWdgt = {};

geochartWdgt.capitalize = function (text) {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}



////////////////////////////////////////////////////////////////////////////////////////////
// Service functions
////////////////////////////////////////////////////////////////////////////////////////////
geochartWdgt.service = {};

//==========================================================================================
// Add filters
//==========================================================================================
geochartWdgt.query = function($scope, query, userProfile) { 

    var timedate = userProfile.getProfile("timerange");
    //var filters = $scope.config.panel.filters;
    //var filterParams = [];
    
    query.timestamp = {};
    query.timestamp.from = timedate.from.getTime();
    query.timestamp.to = timedate.to.getTime();

    //query.param.limit = $scope.config.panel.limit;
    //query.param.total = $scope.config.panel.total;

    
    if (typeof filters == 'object') {
        filters.forEach(function(filter) {
            var obj = {};
            obj[filter.type] = filter.value;
            filterParams.push(obj);
        });

        query.param.filter = filterParams;
    }
    

    return query;

};


geochartWdgt.generateId = function($scope) { // Generate unique ID for the chart

    if (!$scope.d3Selector) {
            // Init D3
        var d3ID = "d3" + Math.floor(Math.random()*10001);

        var element =  document.getElementById(d3ID);
        if (typeof(element) != 'undefined' && element != null)
        {
            geochartWdgt.generateId($scope);
        } else {
            $scope.d3ID = d3ID;
            $scope.d3Selector = "#" + d3ID;
        }

        return true;
    }
    
    return false;

};


geochartWdgt.colorRandom = function (y) {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    var colors = ["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6","#ffffcc","#e5d8bd","#fddaec"];
    return color;
};


////////////////////////////////////////////////////////////////////////////////////////////
// Settings
////////////////////////////////////////////////////////////////////////////////////////////
geochartWdgt.data = {}

// External datasource: js/widgets/datasource.js
geochartWdgt.data.datasources = {
    "version": 1,
    "datasources": [
	{
            "name": "Geo Stats",
            "type": "JSON",
            "settings": {
                "path": "statistic\/country",
                "query": "{\n   \"timestamp\": {\n          \"from\": \"@from_ts\",\n          \"to\":  \"@to_ts\"\n   },\n  \"param\": {\n        \"filter\": [ \n             \"@filters\"\n       ],\n       \"limit\": \"@limit\",\n       \"total\": \"@total\"\n   }\n}",
                "method": "GET",
                "limit": 200,
                "total": false,
                "eval": {
                    incoming: {
                        name: "test incoming",
                        value: "var object = @incoming; return object"
                    }
                },
                "timefields" : [
                    { "field": "from_ts", "desc": "From Timestamp" },
                    { "field": "to_ts", "desc": "To Timestamp" }
                ],
                "fieldvalues": [
                    { "field": "total", "desc": "All Geo Stats" }
                ],
                "filters": [
  		    { "type": "method", "desc": "SIP Method", options: [ {"value": "!ALL"},{"value":"!TOTAL"},{"value": "TOTAL"},{"value": "INVITE"},{"value": "UPDATE"}, {"value": "REGISTER"}, {"value": "CANCEL"}, {"value": "BYE"}, {"value": "OPTIONS"}, {"value": "300"}, {"value": "401"}, {"value": "407"}, {"value": "200"} ] },
  		    { "type": "source_ip", "desc": "Source IP", options: [ {"value": "0.0.0.0"} ] },
  		    { "type": "country", "desc": "Source Country", options: [ {"value": "ALL"} ] }
                ]
            }
        }
    ]
};

//==========================================================================================
// Adding toggleText to jquery
//==========================================================================================
$.fn.extend({
    toggleText: function (a, b) {
        if (this.text() == a) { 
            this.text(b); 
        }
        else { 
            this.text(a) 
        }
    }
});

//==========================================================================================
// Events
//==========================================================================================

$(document).ready(function() {

    //--------------------------------------------------------------------------------------
    // Settings expert mode show/hide
    //--------------------------------------------------------------------------------------
    $('body').on('click', '#seeChartExpert', function(e) {
        e.preventDefault();
        $("#chartExpert").toggleClass("hidden");
        $("#seeChartExpert .glyphicon").toggleClass("glyphicon-chevron-down glyphicon-chevron-up");
        $("#seeChartExpert .text").toggleText("Switch to expert mode", "Switch to normal mode");
    });


});
