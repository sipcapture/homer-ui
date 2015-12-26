(function(angular, homer) {
    "use strict";
    defineHomerAngularModule(homer.modules.app.name).controller("homerAppController", [ "$scope", "$rootScope", "eventbus", "$state", homer.modules.auth.services.authentication, "$location", "dialogs", homer.modules.core.services.profile, function($scope, $rootScope, eventbus, $state, authentication, $location, $dialogs, userProfile) {
        $rootScope.homerApp = "HOMER";
        $rootScope.homerVersion = "5.0.1 Release";
        console.log("HOMER INIT:", $rootScope.homerVersion);
        $scope.header = "templates/empty.html";
        $scope.menu = "templates/empty.html";
        $scope.ribbon = "templates/empty.html";
        $scope.footer = "templates/empty.html";
        $scope.shortcut = "templates/empty.html";
        $scope.templateSet = false;
        $rootScope.currentUser = {};
        $scope.addDashBoard = function() {
            var dlg = $dialogs.create("templates/dialogs/newdialog.html", "newDashboardCtrl", {}, {
                key: false,
                back: "static"
            });
            dlg.result.then(function(dashboardname) {
                if (dashboardname != "upload") {
                    $scope.dashboardname = dashboardname;
                    eventbus.broadcast(homer.modules.pages.events.newDashboardItem, dashboardname);
                } else {
                    eventbus.broadcast(homer.modules.pages.events.dashBoardChanged, dashboardname);
                }
            }, function() {
                $scope.name = "No name, defaulting to New";
            });
        };
        $scope.showLeftMenu = false;
        $scope.boolLeftMenu = false;
        $scope.boolDropDownAlert = false;
        $scope.boolDropDownUserMenu = false;
        $scope.boolDropDownSearch = false;
        $scope.changeClass = function() {
            $scope.boolLeftMenu = !$scope.boolLeftMenu;
            eventbus.broadcast("globalWidgetRecreate", 1);
        };
        $scope.triggerDoSearch = function() {
            $scope.boolLeftMenu = false;
        };
        $scope.expandLeftMenu = function() {
            $scope.boolLeftMenu = false;
        };
        function toggle(obj) {
            if (obj == "boolDropDownAlert") {
                $scope.boolDropDownAlert = !$scope.boolDropDownAlert;
            } else {
                $scope.boolDropDownAlert = false;
            }
            if (obj == "boolDropDownSearch") {
                $scope.boolDropDownSearch = !$scope.boolDropDownSearch;
            } else {
                $scope.boolDropDownSearch = false;
            }
            if (obj == "boolDropDownUserMenu") {
                $scope.boolDropDownUserMenu = !$scope.boolDropDownUserMenu;
            } else {
                $scope.boolDropDownUserMenu = false;
            }
            if (obj == "boolDropDownLastMenu") {
                $scope.boolDropDownLastMenu = !$scope.boolDropDownLastMenu;
            } else {
                $scope.boolDropDownLastMenu = false;
            }
            if (obj == "boolDropDownRefreshMenu") {
                $scope.boolDropDownRefreshMenu = !$scope.boolDropDownRefreshMenu;
            } else {
                $scope.boolDropDownRefreshMenu = false;
            }
        }
        $scope.showAlertBox = function() {
            toggle("boolDropDownAlert");
        };
        $scope.showSearchBox = function() {
            toggle("boolDropDownSearch");
        };
        $scope.showUserMenuBox = function() {
            toggle("boolDropDownUserMenu");
        };
        $scope.showLastMenuBox = function() {
            toggle("boolDropDownLastMenu");
        };
        $scope.showRefreshMenuBox = function() {
            toggle("boolDropDownRefreshMenu");
        };
        $scope.searchClass = "btn btn-primary";
        $scope.showMenu = function() {
            $scope.showLeftMenu = !$scope.showLeftMenu;
        };
        $scope.doLogout = function() {
            $scope.showLeftMenu = false;
            $scope.dropDownUserMenuClass = "";
            $location.path(homer.modules.auth.routes.logout);
        };
        $scope.doResetProfile = function() {
            $scope.showLeftMenu = false;
            $scope.dropDownUserMenuClass = "";
            userProfile.deleteAllProfile();
            console.log(userProfile);
            $location.path(homer.modules.auth.routes.logout);
        };
        eventbus.subscribe(homer.modules.auth.events.userLoggedIn, function(event, args) {
            if (!$scope.templateSet) {
                $scope.showLeftMenu = true;
                $scope.header = "templates/header.html";
                $scope.menu = "templates/left-panel.html";
                $scope.ribbon = "templates/ribbon.html";
                $scope.footer = "templates/footer.html";
                $scope.shortcut = "templates/shortcut.html";
                $scope.templateSet = true;
                if ($state.current.name != "" && $state.current.name != "login") {
                    $state.go($state.current, {}, {
                        reload: true
                    });
                }
            }
        });
        eventbus.subscribe(homer.modules.auth.events.userLoggedOut, function(event, args) {
            $scope.showLeftMenu = false;
            if ($scope.templateSet) {
                $scope.header = null;
                $scope.menu = null;
                $scope.ribbon = null;
                $scope.footer = null;
                $scope.shortcut = null;
                $scope.templateSet = false;
            }
        });
        eventbus.subscribe(homer.modules.pages.events.hideLeftMenu, function(event, args) {
            $scope.boolLeftMenu = true;
        });
    } ]).controller("HomerDatepickerCtrl", function($scope, $rootScope, $filter, dialogs, userProfile, eventbus, $interval, $state) {
        var dt = new Date(new Date().setHours(new Date().getHours() - 2));
        $scope.timerange = userProfile.profileScope.timerange;
        var stop;
        (function() {
            $scope.$watch(function() {
                return userProfile.profileScope.timerange;
            }, function(newVal, oldVal) {
                if (newVal !== oldVal) {
                    $scope.timerange = newVal;
                }
            });
        })();
        $scope.toggleMin = function() {
            $scope.minDate = $scope.minDate ? null : new Date().setFullYear(2013, 0, 1);
            $scope.maxDate = $scope.maxDate ? null : new Date().setFullYear(2032, 0, 1);
        };
        $scope.toggleMin();
        $scope.dateOptions = {
            formatYear: "yy",
            startingDay: 1,
            showWeeks: false
        };
        $scope.formats = [ "yyyy/MM/dd", "yyyy-MM-dd", "dd.MM.yyyy", "shortDate" ];
        $scope.formatDate = $scope.formats[1];        
        $scope.hstep = 1;
        $scope.mstep = 15;
        $scope.setFromNow = function() {
            var dt = new Date(new Date().setMinutes(new Date().getMinutes() + 5));
            $scope.timerange = {
                from: new Date(),
                to: dt
            };
            userProfile.setProfile("timerange", $scope.timerange);
            eventbus.broadcast("globalWidgetReload", 1);
        };
        $scope.timeWindow = false;
        function updateTimeRange(refreshCustom) {
            if ($scope.timerange.custom) {
                $scope.filterIndicator = $scope.timerange.custom;
            } else {
                var timeDiff;
                timeDiff = $scope.timerange.to - $scope.timerange.from;
                $scope.filterIndicator = "From " + $filter("date")($scope.timerange.from, "yyyy-MM-dd HH:mm:ss") + " to " + $filter("date")($scope.timerange.to, "yyyy-MM-dd HH:mm:ss Z");
            }
            if (refreshCustom) {
                //$scope.timerange.customFrom = $filter("date")($scope.timerange.from, "yyyy-MM-dd HH:mm:ss");
                //$scope.timerange.customTo = $filter("date")($scope.timerange.to, "yyyy-MM-dd HH:mm:ss");
                $scope.timerange.customFrom = $scope.timerange.from;
                $scope.timerange.customTo = $scope.timerange.to;
            }
        }
        $scope.updateFrequency = "";
        updateTimeRange(true);
        $rootScope.setRange = function(type, tss) {
            console.log("SELECT RANGE:", tss);
            if ($scope.timerange.to != tss.to || $scope.timerange.from != tss.from) {
                $scope.timerange.to = tss.to;
                $scope.timerange.from = tss.from;
                $scope.timerange.custom = "";
                userProfile.setProfile("timerange", $scope.timerange);
                eventbus.broadcast("globalWidgetReload", 1);
                updateTimeRange(true);
            }
        };
        $scope.toggleTimeWindow = function() {
            $scope.timeWindow = !$scope.timeWindow;
        };
        $scope.isActive = function(item) {
            if ($scope.timerange.custom == item) {
                return true;
            }
            return false;
        };
        $scope.isUpdatingActive = function(item) {
            if ($scope.updateFrequency == item) {
                return true;
            }
            return false;
        };
        $scope.selectCustomeTime = function() {
            $scope.timerange.custom = "";
            $scope.timerange.to = new Date($scope.timerange.customTo);
            $scope.timerange.from = new Date($scope.timerange.customFrom);
            userProfile.setProfile("timerange", $scope.timerange);
            eventbus.broadcast("globalWidgetReload", 1);
            $scope.timeWindow = false;
            updateTimeRange(false);
        };
        $scope.last = function(min, text) {
            var dt = new Date(new Date().setMinutes(new Date().getMinutes() - min));
            $scope.timerange = {
                from: dt,
                to: new Date(),
                custom: text
            };
            userProfile.setProfile("timerange", $scope.timerange);
            eventbus.broadcast("globalWidgetReload", 1);
            $scope.timeWindow = false;
            updateTimeRange(true);
        };        
        
        $scope.next = function(min, text) {
            var dt = new Date(new Date().setMinutes(new Date().getMinutes() + min));
            $scope.timerange = {
                from: new Date(),
                to: dt,
                custom: text
            };
            userProfile.setProfile("timerange", $scope.timerange);
            eventbus.broadcast("globalWidgetReload", 1);
            $scope.timeWindow = false;
            updateTimeRange(true);
        };
        $scope.open = function($event, opened) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope[opened] = true;
        };
        $scope.setToNow = function(type) {
            if (type == 1) {
                $scope.timerange.customFrom = new Date();
            } else {
                $scope.timerange.customTo = new Date();
            }
        };
        $scope.refresh = function(seconds, name) {
            console.log("REFRESH:" + seconds);
            seconds = parseInt(seconds);
            if (seconds < 1) {
                eventbus.broadcast("globalWidgetReload", 1);
                return;
            }
            if (angular.isDefined(stop)) {
                $scope.cancelRefresh();
            }
            $scope.timeWindow = false;
            $scope.activeInterval = true;
            if ($state.current.name == "result") {
                stop = $interval(function() {
                    $scope.timerange.to.setSeconds($scope.timerange.to.getSeconds() + seconds);
                    userProfile.setProfile("timerange", $scope.timerange);
                    eventbus.broadcast(homer.modules.pages.events.resultSearchSubmit, "fullsearch");
                }, seconds * 1e3);
            } else {
                stop = $interval(function() {
                    updateTimeRange(false);
                    $scope.timerange.from.setSeconds($scope.timerange.from.getSeconds() + seconds);
                    $scope.timerange.to.setSeconds($scope.timerange.to.getSeconds() + seconds);
                    userProfile.setProfile("timerange", $scope.timerange);
                    eventbus.broadcast("globalWidgetReload", 1);
                }, seconds * 1e3);
            }
            $scope.updateFrequency = name;
        };
        $scope.cancelRefresh = function() {
            if (angular.isDefined(stop)) {
                $interval.cancel(stop);
                stop = undefined;
                $scope.activeInterval = false;
            }
            $scope.timeWindow = false;
            $scope.updateFrequency = "";
        };
        eventbus.subscribe(homer.modules.pages.events.destroyRefresh, function(event, name, model) {
            $scope.cancelRefresh();
        });
        eventbus.subscribe(homer.modules.pages.events.setTimeRange, function(event, timeRange, model) {
            $scope.timerange = timeRange;
            console.log("SET RANGE", $scope.timerange);
            userProfile.setProfile("timerange", $scope.timerange);
            updateTimeRange(true);                        
        });
    }).controller("timerangeDialogCtrl", function($log, $scope, $modalInstance, data) {
        $scope.timerange = data;
        $scope.options = {
            hstep: [ 1, 2, 3 ],
            mstep: [ 1, 5, 10, 15, 25, 30 ]
        };
        $scope.$watch("timerange.from", function(val, old) {
            $log.info("Date Changed: " + val);
            $scope.opened = false;
        });
        $scope.setDate = function() {
            if (!angular.isDefined($scope.timerange.from)) $scope.timerange.from = new Date();
            if (!angular.isDefined($scope.timerange.to)) $scope.timerange.to = new Date();
        };
        $scope.setDate();
        $scope.done = function() {
            $modalInstance.close($scope.timerange);
        };
    }).config(function(dialogsProvider) {
        dialogsProvider.useBackdrop(true);
        dialogsProvider.useEscClose(true);
        dialogsProvider.useCopy(false);
        dialogsProvider.setSize("sm");
    }).controller("newDashboardCtrl", function($scope, $modalInstance, data, FileUploader) {
        $scope.dashboard = {
            name: ""
        };
        $scope.cancel = function() {
            $modalInstance.dismiss("canceled");
        };
        $scope.hitEnter = function(evt) {
            if (angular.equals(evt.keyCode, 13) && !(angular.equals($scope.dashboard, null) || angular.equals($scope.dashboard, ""))) $scope.save();
        };
        var uploader = $scope.uploader = new FileUploader({
            url: "api/v1/dashboard/upload"
        });
        $scope.save = function() {
            if ($scope.uploader.queue.length > 0) {
                uploader.uploadAll();
            } else {
                if ($scope.nameDialog.$valid) $modalInstance.close($scope.dashboard.name);
            }
        };
        uploader.filters.push({
            name: "customFilter",
            fn: function(item, options) {
                return this.queue.length < 1;
            }
        });
        uploader.onCompleteAll = function() {
            console.info("onCompleteAll");
            $modalInstance.close("upload");
        };
    });
})(angular, homer);