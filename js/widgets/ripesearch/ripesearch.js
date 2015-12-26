/*
 * HOMER 5 UI (Xenophon)
 *
 * Copyright (C) 2011-2015 Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Copyright (C) 2011-2015 Lorenzo Mangani <lorenzo.mangani@gmail.com> QXIP B.V.
 * License AGPL-3.0 http://opensource.org/licenses/AGPL-3.0
 *
*/

'use strict';

angular.module('homer.widgets.ripesearch', ['adf.provider'])
  .value('RIPEServiceUrl', 'https://stat.ripe.net/data/visibility/data.json?resource=')
  .config(function(dashboardProvider){
    dashboardProvider
      .widget('ripesearch', {
        title: 'RIPE DB Search',
        group: 'Tools',
        name: 'ripesearch',
        description: 'Display RIPE Visibility for a given IP/AS',
        templateUrl: 'js/widgets/ripesearch/ripesearch.html',
        controller: 'ripeCtrl',
        reload: true,
        resolve: {
          data: function(ripesearchService, config){
            if (!config.rscount){ config.rscount = 4; }
            if (config.location){
              return ripesearchService.get(config.location,config.rscount);
            }
          }
        },
        edit: {
          templateUrl: 'js/widgets/ripesearch/edit.html'
        }
      });
  })
  .service('ripesearchService', function($q, $http, RIPEServiceUrl){
    return {
      get: function(location,counter){
        var deferred = $q.defer();
        var url = RIPEServiceUrl + location;
        $http.get(url)
          .success(function(data){
	    // console.log('RIPE-QUERY:',data);
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
  .controller('ripeCtrl', function($scope, data, config){
    $scope.data = data;
    $scope.data.config = config;
  });
