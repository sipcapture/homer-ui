/*
 * HOMER 5 UI (Xenophon)
 *
 * Copyright (C) 2011-2015 Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Copyright (C) 2011-2015 Lorenzo Mangani <lorenzo.mangani@gmail.com> QXIP B.V.
 * License AGPL-3.0 http://opensource.org/licenses/AGPL-3.0
 *
*/

(function (angular, homer) {
    'use strict';

    angular.module(homer.modules.core.name).factory(homer.modules.core.services.profile, [
        '$q',
	'$http',
        'eventbus',
        '$log',
        function ($q, $http, eventbus, $log) {
                                
	       var loadedProfile = false;

               var myProfile = {};               

               var profileScope = {
                    timerange: {
                         from: new Date(new Date().getTime() - 900*1000), 
                         to: new Date()
                    },
                    search: {},
		    transaction: {},
		    result: {},
		    node: {},
                    limit: 200
               };
               
	       myProfile["result"] = profileScope["result"];
	       myProfile["node"] = profileScope["node"];
	       myProfile["transaction"] = profileScope["transaction"];
               myProfile["limit"] = profileScope["limit"];
               myProfile["timerange"] = profileScope["timerange"];
	       myProfile["search"] = profileScope["search"];
                                                                                     
               var key = function(obj){
                    return obj.lastName + obj.firstName; // just an example
               };               
                
               var setProfile = function (key, data)
               {                
                    setLocalProfile(key,data);
                    setRemoteProfile(key,data);                    
               };
                
               var getProfile = function(key)
               {                
                    return getLocalProfile(key);
               };
                
               var deleteProfile = function(key)
               {                
                    deleteLocalProfile(key);
                    deleteRemoteProfile(key);                    
               };                
               
               var deleteAllProfile = function()
               {                
                    deleteAllRemoteProfile();                    
               };                
                                 
               var setLocalProfile = function (key, data)
               {                
                    myProfile[key] = data;
               };
                
               var getLocalProfile = function(key)
               {                
                    return myProfile[key];
               };
                
               var deleteLocalProfile = function(key)
               {                
                    delete myProfile[key];
               };                
               
	       var getAllRemoteProfile = function ()
               {
			var deferred = $q.defer();
                        $http.get('api/v1/profile/store', {handleStatus:[403,503]})
                                .success(function(data) {                                     
					angular.forEach(data.data, function(value,key){
						var jsonObj = JSON.parse(value);
				                /* workaround for bad json date string */
                              			if(key == "timerange") 
						{
							jsonObj.from = new Date(jsonObj.from);
							jsonObj.to = new Date(jsonObj.to);    
							profileScope.timerange = jsonObj;     
						}                               
			                        setLocalProfile(key, jsonObj);
                        			profileScope[key] = jsonObj;  
						loadedProfile = true;
						deffered.resolve("yes");
					});                                                                
                                })
                                .error(function(){
                                        //deffered.resolve();
					deferred.reject();

                                });

			return deferred.promise;

               };
                
               var getRemoteProfile = function (id)
               {
                        var deferred = $q.defer();
                        $http.get('api/v1/profile/store/' + id, {handleStatus:[403,503]})
                                .success(function(data){
					var jsonObj = JSON.parse(value);
				        /* workaround for bad json date string */
                              		if(key == "timerange") 
					{
						jsonObj.from = new Date(jsonObj.from);
						jsonObj.to = new Date(jsonObj.to);    
						profileScope.timerange = jsonObj;
					}                               
			                setLocalProfile(key, jsonObj);
                        		profileScope[key] = jsonObj;  
					
                                        deferred.resolve(data.data);
                                })
                                .error(function(){
                                        deferred.reject();
                                });

                        return deferred.promise;
               };
                
               var setRemoteProfile = function (id, sdata)
               {
                        var url = "api/v1/profile/store";
                        if(id != null) url = 'api/v1/profile/store/'+id;
                        
                        var data = { id: id, param: sdata }                                             

                        var defer = $q.defer();
                        $http.post(url, data, {handleStatus:[403,503]}).then(
                                /* good response */
                            function (results) {
                                
                                defer.resolve(results.data);
                            },
                            /* bad response */
                            function (results) {
                                defer.reject();
                            }
                         );
                        return defer.promise;
               };
                
               var deleteRemoteProfile = function (id, data)
               {

                        var defer = $q.defer();
                        $http.delete('api/v1/profile/store/'+id, {handleStatus:[403,503]}).then(
                                /* good response */
                            function (results) {
                                defer.resolve(results.data);
                            },
                            /* bad response */
                            function (results) {
                                defer.reject();
                            }
                         );
                        return defer.promise;
               };
               
               var deleteAllRemoteProfile = function ()
               {

                        var defer = $q.defer();
                        $http.delete('api/v1/profile/store/', {handleStatus:[403,503]}).then(
                                /* good response */
                            function (results) {
                                defer.resolve(results.data);
                            },
                            /* bad response */
                            function (results) {
                                defer.reject();
                            }
                         );
                        return defer.promise;
               };
                                  
               var getAll = function() 
               {  
                      var deferred = $q.defer();
                      if(loadedProfile == true) {
                          deferred.resolve(loadedProfile);
                          return deferred.promise;
                      }
                      
                      $http.get('api/v1/profile/store', {handleStatus:[403,503]})
                                .success(function(data) {
                                        angular.forEach(data.data, function(value,key){
                                                var jsonObj = angular.fromJson(value);
                                                /* workaround for bad json date string */
                                                if(key == "timerange")
                                                {
                                                        jsonObj.from = new Date(jsonObj.from);
                                                        jsonObj.to = new Date(jsonObj.to);
                                                        profileScope.timerange = jsonObj;
                                                }
                                                setLocalProfile(key, jsonObj);
                                                profileScope[key] = jsonObj;
                                                loadedProfile = true;
                                                deferred.resolve(key);
                                        });
                                })
                                .error(function(status){
				        deferred.reject("Error: request returned status " + status); 
                                });

                      return deferred.promise;                      
                };

               return {
                   setProfile: setProfile,
                   getProfile: getProfile,
                   deleteProfile: deleteProfile,
                   setLocalProfile: setLocalProfile,
                   getLocalProfile: getLocalProfile,
                   deleteLocalProfile: deleteLocalProfile,
                   deleteAllProfile: deleteAllProfile,
                   getRemoteProfile: getRemoteProfile,                   
                   setRemoteProfile: setRemoteProfile,                   
                   deleteRemoteProfile: deleteRemoteProfile,
                   getAll: getAll,
                   profileScope: profileScope
               };
          }
    ]);
}(angular, homer));
