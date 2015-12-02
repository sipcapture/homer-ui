"use strict";

angular.module("homer.widgets.sipcapture", [ "adf.provider", "highcharts-ng", "chart.js" ]).value("localApiUrl", "api/v1/").value("sipcaptureApiUrl", "api/v1/").config(function(dashboardProvider) {
    var widget = {
        templateUrl: "js/widgets/sipcapture/sipcapture.html",
        reload: true,
        resolve: {
            sipdata: function($scope, sipcaptureService, config) {
                if (config.path && config.query) {
                    return sipcaptureService.get(config, config.path, config.query);
                }
            }
        },
        edit: {
            templateUrl: "js/widgets/sipcapture/edit.html",
            controller: "sipcaptureEditController"
        },
        refresh: true
    };
    dashboardProvider.widget("sipcaptureChart", angular.extend({
        title: "SIPCapture Charts",
        description: "Display SIPCapture API data as charts",
        controller: "sipcaptureCtrl"
    }, widget));
}).service("sipcaptureService", function($q, $http, sipcaptureApiUrl, userProfile) {
    return {
        get: function(config, path, query) {
            var deferred = $q.defer();
            var url = sipcaptureApiUrl + path;
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
            var timedate = userProfile.getProfile("timerange");
            objQuery.timestamp.from = timedate.from.getTime();
            objQuery.timestamp.to = timedate.to.getTime();
            $http.post(url, objQuery).success(function(data) {
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
}).controller("sipcaptureCtrl", function($scope, config, sipdata, sipcaptureService) {
    function parseDate(input) {
        return input * 1e3;
    }
    var rangeDate = {};
    var data = {};
    var fields = config.panel.fieldname.split(";");
    var values = config.panel.fieldvalue.split(";");
    $scope.reloadIt = function() {
        $scope.$parent.changeReloading(true);
        sipcaptureService.get(config, config.path, config.query).then(function(sdata) {
            if (config.chart.hasOwnProperty("library") && config.chart.library.value == "canvasjs") {
                            
            var seriesData = checkCanvasJSData(sdata);
            if (config.chart.type["value"] == "pie") {
                    //$scope.canvasLabels = ["Download Sales", "In-Store Sales", "Mail-Order Sales", "Tele Sales", "Corporate Sales"];
                    $scope.canvasLabels = seriesData[0].label;
                    $scope.canvasData = seriesData[0].data;
                }  
                else {
              
                    $scope.canvasLabels = seriesData[0].label;
                    $scope.canvasData = seriesData[0].data;
                    $scope.canvasSeries = seriesData[0].series;                                                                         
                }

                    $scope.$parent.changeReloading(false);                                
            } else if (config.chart.hasOwnProperty("library") && config.chart.library.value == "d3") {
                $scope.$parent.changeReloading(false);
                sipcaptureWdgt.d3.draw($scope, config.chart.type["value"], sdata);
            } else {            
                        
                var seriesData = checkData(sdata);
                var chart = $scope.chartObj;
                var slen = seriesData.length;
                for (var i = 0, len = chart.series.length; i < len; i++) {
                    if (i < slen) chart.series[i].update(seriesData[i], true); else if (chart.series[i]) chart.series[i].remove(false);
                }
                for (i; i < slen; i++) chart.addSeries(seriesData[i], true);
                $scope.$parent.changeReloading(false);            
                console.log("RELOADING");
            }
            
        }, function(sdata) {
            console.log("data");
            return;
        });
    };
    
    
    function checkData(locdata) {
        var rangeDate = {};
        angular.forEach(locdata, function(commit) {
            var timevalue = parseDate(commit[config.panel.timefield]);
            var fv = [];
            angular.forEach(fields, function(fl) {
                fv.push(commit[fl]);
            });
            var fieldname = fv.join("|");
            var fieldvalue = 0;
            angular.forEach(values, function(fl) {
                if (config.panel.fieldsum) fieldvalue = parseInt(commit[fl]); else fieldvalue = parseInt(commit[fl]);
            });
            if (!rangeDate.hasOwnProperty(fieldname)) rangeDate[fieldname] = [];
            rangeDate[fieldname].push([ timevalue, fieldvalue ]);
        });
        var seriesData = [];
        if (config.chart.type["value"] == "pie") {
            seriesData.push({
                type: config.chart.type["value"],
                name: $scope.$parent.model.title,
                data: []
            });
            angular.forEach(rangeDate, function(count, key) {
                var valtotal = 0;
                angular.forEach(count, function(cntval) {
                    valtotal += cntval[1];
                });
                seriesData[0].data.push([ key, valtotal ]);
            });
        } else {
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
    
    function checkCanvasJSData(locdata) {
        var rangeDate = {};
        angular.forEach(locdata, function(commit) {
            var timevalue = parseDate(commit[config.panel.timefield]);
            var fv = [];
            angular.forEach(fields, function(fl) {
                fv.push(commit[fl]);
            });
            var fieldname = fv.join("|");
            var fieldvalue = 0;
            angular.forEach(values, function(fl) {
                if (config.panel.fieldsum) fieldvalue = parseInt(commit[fl]); else fieldvalue = parseInt(commit[fl]);
            });
            if (!rangeDate.hasOwnProperty(fieldname)) rangeDate[fieldname] = [];
            rangeDate[fieldname].push([ timevalue, fieldvalue ]);
        });
        var seriesData = [];
        seriesData.push({
                type: config.chart.type["value"],
                name: $scope.$parent.model.title,
                data: [],
                series: [],
                label: []
        });
        if (config.chart.type["value"] == "pie") {
            angular.forEach(rangeDate, function(count, key) {
                var valtotal = 0;
                angular.forEach(count, function(cntval) {
                    valtotal += cntval[1];
                });
                seriesData[0].data.push(valtotal);
                seriesData[0].label.push(key);
            });
        } else {                   
            
            var dataTime = [];
            var timeMa = {};
        var sData = {};
            
            angular.forEach(rangeDate, function(count, key) {
                count.sort(function(a, b) {
                    return a[0] - b[0];
                });
                
                angular.forEach(count, function(mdata, az) {
                        if(!timeMa.hasOwnProperty(mdata[0])) {
                            dataTime.push(mdata[0]);
                            timeMa[mdata[0]] = 1;
                        }
                });                                
            });
            
            dataTime.sort(function(a, b) {
                return a - b;
            });

        var emz = [];
        var sIndex = 0;

        angular.forEach(dataTime, function(m, k) {
            timeMa[m] = k;
            emz.push(0);
            var date = new Date(m);
            var hours = date.getHours();
            var minutes = "0" + date.getMinutes();
            var seconds = "0" + date.getSeconds();          
            var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
                    seriesData[0].label.push(formattedTime);
            });
    
            angular.forEach(rangeDate, function(count, key) {
            var td = emz.slice();       
            angular.forEach(count, function(mdata, az) {
                sIndex = timeMa[mdata[0]];  
                td[sIndex] = mdata[1];          
            });    
            seriesData[0].series.push(key);                     
            seriesData[0].data.push(td);
        });             
        
        //console.log("------------------>");
        //console.log(seriesData);
            
        }
        return seriesData;
    }

    /* DRAW DATA */
    
    if (sipdata) {
            
        if (config.chart.hasOwnProperty("library") && config.chart.library.value == "canvasjs") {
        
            var seriesData = checkCanvasJSData(sipdata);

            //chartJsProvider.setOptions({
             //           responsive: true,
             //           maintainAspectRatio: false
            //});
            
            $scope.chartHeight = config.chart.size.height;
            $scope.chartWidth = config.chart.size.width;
            $scope.canvasChartOptions = {
                        responsive: true,                
                        animation : false,        
                        maintainAspectRatio: false
                        //legendTemplate : '<ul class="tc-chart-js-legend"><% for (var i=0; i<segments.length; i++){%><li><span style="background-color:<%=segments[i].fillColor%>"></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>'                        
            };

        if (config.chart.legend) {
                    if (config.chart.legend.enabled && config.chart.legend.enabled == true) {
            $scope.canvasShowLegend = true;
                    }
            }

            if (config.chart.type["value"] == "pie") {

                $scope.canvasLabels = seriesData[0].label;
                $scope.canvasData = seriesData[0].data;
        $scope.canvasChartType = 'Pie';
                
            }
            else {
                  
             $scope.canvasLabels = seriesData[0].label;
                 $scope.canvasData = seriesData[0].data;
                 $scope.canvasSeries = seriesData[0].series;
                 if(config.chart.type["value"] == "bar") $scope.canvasChartType = 'Bar';        
                 else if(config.chart.type["value"] == "line") $scope.canvasChartType = 'Line';     
                 else $scope.canvasChartType = 'Line';      
            }
        } else if (config.chart.hasOwnProperty("library") && config.chart.library.value == "d3") {
            $scope.d3Enabled = true;
            $scope.chartHeight = config.chart.size.height;

            sipcaptureWdgt.d3.draw($scope, config.chart.type["value"], sipdata);
        } else {
            $scope.chartHighchart = true;
            
            var seriesData = checkData(sipdata);
        
            if (config.chart.type["value"] == "pie") {
                $scope.chartConfig = {
                    chart: {
                        type: "pie",
                        plotBackgroundColor: null,
                        plotBorderWidth: null,
                        plotShadow: false
                    },
                    title: {
                        text: $scope.$parent.model.title,
                        style: {
                            display: "none"
                        }
                    },
                    plotOptions: {
                        pie: {
                            allowPointSelect: true,
                            cursor: "pointer",
                            depth: 0,
                            dataLabels: {
                                enabled: true,
                                color: "#000000",
                                connectorColor: "#000000",
                                format: "<b>{point.name}</b>: {point.percentage:.1f} %"
                            },
                            showInLegend: false
                        }
                    },
                    series: seriesData
                };
                if (config.chart.ccc) {
                    var cols = new Array();
                    cols = config.chart.ccc.split(",");
                    if (!$scope.chartConfig.hasOwnProperty("colors")) {
                        $scope.chartConfig.colors = [];
                    }
                    $scope.chartConfig.colors = cols;
                }
                if (config.chart.ddd) {
                    $scope.chartConfig.chart["options3d"] = {
                        enabled: true,
                        alpha: 45,
                        beta: 0
                    };
                    $scope.chartConfig.plotOptions.pie["depth"] = 35;
                }
                if (config.chart.size) {
                    if (!$scope.chartConfig.hasOwnProperty("size")) {
                        $scope.chartConfig.size = {};
                    }
                    if (parseInt(config.chart.size.width) > 0) {
                        $scope.chartConfig.size.width = config.chart.size.width;
                    }
                    if (parseInt(config.chart.size.height) > 0) {
                        $scope.chartConfig.size.height = config.chart.size.height;
                    }
                }
                if (config.chart.legend) {
                    if (config.chart.legend.enabled && config.chart.legend.enabled == true) {
                        $scope.chartConfig.plotOptions.pie.showInLegend = config.chart.legend.enabled;
                        $scope.chartConfig.plotOptions.pie.dataLabels.enabled = false;
                    }
                }
            } else {
                $scope.chartConfig = {
                    chart: {
                        type: config.chart.type["value"]
                    },
                    title: {
                        text: $scope.$parent.model.title,
                        style: {
                            display: "none"
                        }
                    },
                    xAxis: {
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
                    series: seriesData
                };
                $scope.chartConfig.chart["zoomType"] = "x";
                $scope.chartConfig.tooltip["crosshairs"] = true;
                $scope.chartConfig.tooltip["shared"] = true;
                if (config.chart.ccc) {
                    var cols = new Array();
                    cols = config.chart.ccc.split(",");
                    $scope.chartConfig["colors"] = cols;
                }
                if (config.chart.sss) {
                    var type = config.chart.type["value"];
                    $scope.chartConfig.plotOptions[type] = new Object();
                    if (config.chart.ppp) {
                        $scope.chartConfig.plotOptions[type].stacking = "percent";
                    } else {
                        $scope.chartConfig.plotOptions[type].stacking = "normal";
                    }
                }
                if (config.chart.ddd) {
                    $scope.chartConfig.chart.options3d = {
                        enabled: true,
                        alpha: 15,
                        beta: 10,
                        depth: 50,
                        viewDistance: 30
                    };
                    $scope.chartConfig.plotOptions.column["depth"] = 25;
                    $scope.chartConfig.chart.margin = 60;
                }
                if (config.chart.size) {
                    if (!$scope.chartConfig.hasOwnProperty("size")) {
                        $scope.chartConfig.size = {};
                    }
                    if (parseInt(config.chart.size.width) > 0) {
                        $scope.chartConfig.size.width = config.chart.size.width;
                    }
                    if (parseInt(config.chart.size.height) > 0) {
                        $scope.chartConfig.size.height = config.chart.size.height;
                    }
                }
                if (config.chart.legend) {
                    if (config.chart.legend.align) $scope.chartConfig.legend.align = config.chart.legend.align;
                    if (config.chart.legend.enabled) $scope.chartConfig.legend.enabled = config.chart.legend.enabled;
                    if (config.chart.legend.layout) $scope.chartConfig.legend.layout = config.chart.legend.layout;
                }
                if (config.chart.yaxis && config.chart.yaxis.title && config.chart.yaxis.title.length > 0) {
                    $scope.chartConfig.yAxis.title.text = config.chart.yaxis.title;
                }
            }
        }
    }
}).controller("sipcaptureEditController", function($scope, $cookies, sipcaptureApiUrl, userProfile) {
    $scope.charts = [ {
        id: 1,
        label: "Spline",
        value: "spline"
    }, {
        id: 2,
        label: "Line",
        value: "line"
    }, {
        id: 3,
        label: "Area spline",
        value: "areaspline"
    }, {
        id: 4,
        label: "Bar",
        value: "bar"
    }, {
        id: 5,
        label: "Scatter",
        value: "scatter"
    }, {
        id: 6,
        label: "Pie",
        value: "pie"
    }, {
        id: 7,
        label: "Column",
        value: "column"
    }, {
        id: 8,
        label: "Gauge",
        value: "solidgauge"
    }, {
        id: 9,
        label: "Heatbox",
        value: "heatmap"
    } ];
    $scope.library = [ {
        id: 1,
        label: "Highchart",
        value: "higchart"
    }, {
        id: 2,
        label: "Canvas JS",
        value: "canvasjs"
    }, {
        id: 3,
        label: "D3JS",
        value: "d3"
    } ];
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
    $scope.updateDebugUrl = function() {
        var url = sipcaptureApiUrl + $scope.config.path;
        try {
            var objQuery = JSON.parse($scope.config.query);
            var timedate = userProfile.getProfile("timerange");
            objQuery.timestamp.from = timedate.from.getTime();
            objQuery.timestamp.to = timedate.to.getTime();
            $scope.debug = "curl -v --cookie 'HOMERSESSID=" + $cookies["HOMERSESSID"] + "' -X POST \\\n" + "-d '" + JSON.stringify(objQuery) + "' \\\n" + ' "' + window.location.protocol + "//" + window.location.host + "/" + url + '"\n';
            $scope.parsingStatus = "ok";
            $scope.parsingColorClass = "green";
        } catch (e) {
            $scope.parsingStatus = "Bad parsing: [" + e.message + "]";
            $scope.parsingColorClass = "red";
        }
    };
    $scope.updateDebugUrl();
});


////////////////////////////////////////////////////////////////////////////////////////////
// Widget object
////////////////////////////////////////////////////////////////////////////////////////////
var sipcaptureWdgt = {};

sipcaptureWdgt.capitalize = function (text) {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

////////////////////////////////////////////////////////////////////////////////////////////
// D3 Properties and functions
////////////////////////////////////////////////////////////////////////////////////////////
sipcaptureWdgt.d3 = {
    duration : 1000,
    events : []
};

sipcaptureWdgt.generateId = function($scope) { // Generate unique ID for the chart

    if (!$scope.d3Selector) {
            // Init D3
        var d3ID = "d3" + Math.floor(Math.random()*10001);

        var element =  document.getElementById(d3ID);
        if (typeof(element) != 'undefined' && element != null)
        {
            sipcaptureWdgt.generateId($scope);
        } else {
            $scope.d3ID = d3ID;
            $scope.d3Selector = "#" + d3ID;
        }

        return true;
    }
    
    return false;

};

//==========================================================================================
// D3 create
//==========================================================================================
sipcaptureWdgt.d3.create = function($scope, chart, data, animate) {

    console.log('creating');
    var selector = $scope.d3Selector;
    var d3chart;
    var resizeEvent;

    d3chart = d3.select(selector).datum(data);
    
    if (animate) {  
        d3chart.transition()
               .duration(sipcaptureWdgt.d3.duration);
    }
    d3chart.call(chart);
    
    resizeEvent = nv.utils.windowResize(chart.update);

    sipcaptureWdgt.d3.events.push(resizeEvent);
};

//==========================================================================================
// D3 clear events
//==========================================================================================
sipcaptureWdgt.d3.clear = function() {

    var events = sipcaptureWdgt.d3.events;

    events.forEach(function(e) {
        e.clear();
    });
    
};

//==========================================================================================
// Pre format data 
//==========================================================================================
sipcaptureWdgt.d3.data = function($scope, data) {

    var fieldname =  $scope.config.panel.fieldname.split(";");
    var fieldvalue =  $scope.config.panel.fieldvalue.split(";");
    var timefield =  $scope.config.panel.timefield;

    var names = [];
    var values = {};
    var timefields = [];
    var timefieldData;
    var customData = [];

    data.forEach(function(entry) {

        var name = "";
        var value = 0;
        
        fieldname.forEach(function(n) {
            if (entry[n]) {
                if (name) {
                    name = name + " | ";
                }
                name = name + entry[n];
            }
        });
        
        fieldvalue.forEach(function(v) {
            value = value + parseInt(entry[v]);
        });

        if (names.indexOf(name) === -1) { // Getting names
            names.push(name)
        }

        timefieldData = entry[timefield];

        if (timefields.indexOf(timefieldData) === -1) { // Getting timefields
            timefields.push(timefieldData)
        }

        if (!(name in values)) { // Create key if don't exists
            values[name] = {}
        }
        values[name][timefieldData] = (values[name][timefieldData] || 0) + value;
    });

    names.forEach(function(name) { // Order and fill empty data

        var valuesData = [];
        var total = 0;

        timefields.forEach(function(timefield) {
            total = total + (parseInt(values[name][timefield]) || 0);

            valuesData.push({
                timefield : timefield,
                value : parseInt(values[name][timefield]) || 0
            });

        });

        customData.push({
            key : name,
            values : valuesData,
            value: total
        });

    });

    return customData;
};

//==========================================================================================
// D3 scatterChart
//==========================================================================================
sipcaptureWdgt.d3.scatterChart = {};

//------------------------------------------------------------------------------------------
// D3 scatterChart prepare data
//------------------------------------------------------------------------------------------
sipcaptureWdgt.d3.scatterChart.data = function(data) {
    
    var values;
    var shapes = ['circle', 'cross', 'triangle-up', 'triangle-down', 'diamond', 'square'];

    data.forEach(function(entry) {
        
        values = entry.values;

        var groupShape = shapes[0];
        if (groupShape) {
            shapes.shift();
        } else {
            groupShape = 'circle';
        }

        values.forEach(function(row) {

            row.size = row.value;
            row.shape = groupShape;

        });
         
    });

    return data;

};

//------------------------------------------------------------------------------------------
// D3 scatterChart prepare for creation
//------------------------------------------------------------------------------------------
sipcaptureWdgt.d3.scatterChart.prepare = function($scope, animate, data) {

    nv.addGraph(function() {
        var chart = nv.models.scatterChart()
                    .showDistX(true)
                    .showDistY(true)
                    .x(function(d) { return d.timefield; })
                    .y(function(d) { return d.value; })
                    .color(d3.scale.category10().range());

        chart.xAxis.tickFormat(function(d) { return d3.time.format('%H:%M')(new Date(d * 1000))});
        chart.yAxis.tickFormat(d3.format('d'));
        chart.xScale(d3.time.scale());

        sipcaptureWdgt.d3.create($scope, chart, data, animate);

        return chart;
    });

};

//==========================================================================================
// D3 lineChart
//==========================================================================================
sipcaptureWdgt.d3.lineChart = {};

//------------------------------------------------------------------------------------------
// D3 lineChart prepare for creation
//------------------------------------------------------------------------------------------
sipcaptureWdgt.d3.lineChart.prepare = function($scope, animate, data) {

    nv.addGraph(function() {

        var chart = nv.models.lineChart()
            .x(function(d) { return d.timefield; })
            .y(function(d) { return d.value; });

        chart.xAxis.tickFormat(function(d) { return d3.time.format('%H:%M')(new Date(d * 1000))});
        chart.yAxis.tickFormat(d3.format('d'));
        chart.xScale(d3.time.scale());

        sipcaptureWdgt.d3.create($scope, chart, data, animate);

        return chart;
    });

};


//==========================================================================================
// D3 stackedAreaChart
//==========================================================================================
sipcaptureWdgt.d3.stackedAreaChart = {};

//------------------------------------------------------------------------------------------
// D3 stackedAreaChart prepare for creation
//------------------------------------------------------------------------------------------
sipcaptureWdgt.d3.stackedAreaChart.prepare = function($scope, animate, data) {

    nv.addGraph(function() {

        var chart = nv.models.stackedAreaChart()
                    .clipEdge(true)
                    .x(function(d) { return d.timefield; })
                    .y(function(d) { return d.value; });

        chart.xAxis.tickFormat(function(d) { return d3.time.format('%H:%M')(new Date(d * 1000))});
        chart.yAxis.tickFormat(d3.format('d'));
//            chart.xScale(d3.time.scale());

        sipcaptureWdgt.d3.create($scope, chart, data, animate);

        return chart;
    });

};

//==========================================================================================
// D3 multiBarChart
//==========================================================================================
sipcaptureWdgt.d3.multiBarChart = {};

//------------------------------------------------------------------------------------------
// D3 multiBarChart prepare for creation
//------------------------------------------------------------------------------------------
sipcaptureWdgt.d3.multiBarChart.prepare = function($scope, animate, data) {

    nv.addGraph(function() {
        var chart = nv.models.multiBarChart()
            .x(function(d) { return d.timefield; })
            .y(function(d) { return d.value; })

        chart.yAxis.tickFormat(d3.format('d'));
        chart.xAxis.tickFormat(function(d) { return d3.time.format('%H:%M')(new Date(d * 1000))});

        sipcaptureWdgt.d3.create($scope, chart, data, animate);

        return chart;
    });

};

//==========================================================================================
// D3 pieChart
//==========================================================================================
sipcaptureWdgt.d3.pieChart = {};

//------------------------------------------------------------------------------------------
// D3 pieChart prepare for creation
//------------------------------------------------------------------------------------------
sipcaptureWdgt.d3.pieChart.prepare = function($scope, animate, data) {
    
    nv.addGraph(function() {
        var chart = nv.models.pieChart()
            .x(function(d) { return d.key; })
            .y(function(d) { return d.value; })
            .valueFormat(d3.format('d'))
            .showLabels(false);

        sipcaptureWdgt.d3.create($scope, chart, data, animate);

        return chart;
    });

};

//==========================================================================================
// D3 Draw
//==========================================================================================
sipcaptureWdgt.d3.draw = function($scope, type, data) {
    
    var firstRun = sipcaptureWdgt.generateId($scope);

    var customData = sipcaptureWdgt.d3.data($scope, data);
    
    if (type == "pie") {
        sipcaptureWdgt.d3.pieChart.prepare($scope, firstRun, customData);
    } else if (type == "scatter") {
        customData = sipcaptureWdgt.d3.scatterChart.data(customData);
        sipcaptureWdgt.d3.scatterChart.prepare($scope, firstRun, customData);
    } else if (type == "line") {
        sipcaptureWdgt.d3.lineChart.prepare($scope, firstRun, customData);
    } else if (type == "areaspline") {
        sipcaptureWdgt.d3.stackedAreaChart.prepare($scope, firstRun, customData);
    } else {
        sipcaptureWdgt.d3.multiBarChart.prepare($scope, firstRun, customData);
    }
};
