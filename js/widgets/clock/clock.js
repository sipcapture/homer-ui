/*
 * HOMER 5 UI (Xenophon)
 *
 * Copyright (C) 2011-2015 Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Copyright (C) 2011-2015 Lorenzo Mangani <lorenzo.mangani@gmail.com> QXIP B.V.
 * License AGPL-3.0 http://opensource.org/licenses/AGPL-3.0
 *
*/

'use strict';

angular.module('homer.widget.clock', ['adf.provider'])
  .config(function(dashboardProvider){
    dashboardProvider
      .widget('clock', {
        title: 'Tool: Clock',
        description: 'Displays date and time',
        templateUrl: 'js/widgets/clock/view.html',
        controller: 'clockController',
        controllerAs: 'clock',
        config: {
          timePattern: 'HH:mm:ss',
          datePattern: 'YYYY-MM-DD',
	  location: 'Europe/Amsterdam',
	  showseconds: false
        },
        edit: {
          templateUrl: 'js/widgets/clock/edit.html'
        }
      });
  })
  .controller('clockController', function($scope, $interval, config){
    var clock = this;

    $scope.tz = [];            
    var locations = config.location.split(',');
    angular.forEach(locations, function(tz){
             tz = tz.replace(/ /g,'');
             var offset = timeZoneData[tz];
	     var sec = $scope.config.showseconds ? 'german' : 'none';
	     var update = $scope.config.showseconds ? 1000 : 60000;
	     $scope.tz.push({'offset': offset, 'name': tz, 'update': update, 'showseconds': sec});
    });

    function add_leading_zero (num){
       return ('0'+num).slice(-2);
    }


    function setDateAndTime(){

	$scope.clocks = [];    
	/* Here should be UTC different */        
	angular.forEach($scope.tz, function(ltz){
			     var d = new Date(); 
			     var offset = ltz.offset;
			     var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
			     if(d.dst()) offset+=1;
			     var date = new Date(utc + (3600000*offset));
			     var localdate = add_leading_zero(date.getDate()) + "-"+add_leading_zero(date.getMonth()+1)+"-"+ date.getFullYear();	
			     var localtime = add_leading_zero(date.getHours()) + ":"+add_leading_zero(date.getMinutes())+":"+ add_leading_zero(date.getSeconds());	
			     $scope.clocks.push({'name':ltz.name, 'time': localtime, 'date': localdate });			                                  			     
        });
    }

    setDateAndTime();

    // refresh every second
    var promise = $interval(setDateAndTime, 1000);

    // cancel interval on scope destroy
    $scope.$on('$destroy', function(){
      $interval.cancel(promise);
    });
  });
