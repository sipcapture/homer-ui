/*
 * HOMER 5 UI (Xenophon)
 *
 * Copyright (C) 2011-2015 Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Copyright (C) 2011-2015 Lorenzo Mangani <lorenzo.mangani@gmail.com> QXIP B.V.
 * License AGPL-3.0 http://opensource.org/licenses/AGPL-3.0
 *
*/

'use strict';

angular.module('homer.widgets.ripewhois', ['adf.provider'])
  .value('WhoisServiceUrl', '//stat.ripe.net/data/whois/data.json?resource=')
  .config(function(dashboardProvider){
    dashboardProvider
      .widget('ripewhois', {
        title: 'RIPE Whois Search',
        description: 'Display RIPE WHOIS Data for a given IP/AS',
        templateUrl: 'js/widgets/ripewhois/ripewhois.html',
        controller: 'ripewhoCtrl',
        reload: true,
        resolve: {
          data: function(whoisService, config){
            if (config.location){
              return whoisService.get(config.location);
            }
          }
        },
        edit: {
          templateUrl: 'js/widgets/ripewhois/edit.html'
        }
      });
  })
  .service('whoisService', function($q, $http, WhoisServiceUrl){
    return {
      get: function(location){
        var deferred = $q.defer();
        var url = WhoisServiceUrl + location;
        $http.get(url)
          .success(function(data){
	    // console.log('RIPE-WHOIS-QUERY:',data);
            if (data && data.status === "ok"){
              deferred.resolve(data);
            } else {
              deferred.reject();
            }
          })
          .error(function(){
            deferred.reject();
          });
        return deferred.promise;
      }
    };
  })
  .controller('ripewhoCtrl', function($scope, data, config){
    $scope.data = data;
  });
