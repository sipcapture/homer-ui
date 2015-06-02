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

angular.module(homer.modules.auth.name).factory(homer.modules.auth.services.authorization, [
'authentication',
function (authentication) {
 var authorize = function (loginRequired, requiredPermissions, permissionCheckType) {
    var result = homer.modules.auth.enums.authorised.authorised,
        user = authentication.getCurrentLoginUser(),
        loweredPermissions = [],
        hasPermission = true,
        permission, i;
        
    permissionCheckType = permissionCheckType || homer.modules.auth.enums.permissionCheckType.atLeastOne;
    if (loginRequired === true && user === undefined) {
        result = homer.modules.auth.enums.authorised.loginRequired;
    } else if ((loginRequired === true && user !== undefined) &&
        (requiredPermissions === undefined || requiredPermissions.length === 0)) {
        // Login is required but no specific permissions are specified.
        result = homer.modules.auth.enums.authorised.authorised;
    } else if (requiredPermissions) {
        loweredPermissions = [];
        angular.forEach(user.permissions, function (permission) {
            loweredPermissions.push(permission.toLowerCase());
        });

        for (i = 0; i < requiredPermissions.length; i += 1) {
        
            permission = requiredPermissions[i].toLowerCase();
            if (permissionCheckType === homer.modules.auth.enums.permissionCheckType.combinationRequired) {
                hasPermission = hasPermission && loweredPermissions.indexOf(permission) > -1;
                // if all the permissions are required and hasPermission is false there is no point carrying on
                if (hasPermission === false) {
                    break;
                }
            } else if (permissionCheckType === homer.modules.auth.enums.permissionCheckType.atLeastOne) {
                hasPermission = loweredPermissions.indexOf(permission) > -1;
                // if we only need one of the permissions and we have it there is no point carrying on
                if (hasPermission) {
                    break;
                }
            }
        }

        result = hasPermission ? homer.modules.auth.enums.authorised.authorised : homer.modules.auth.enums.authorised.notAuthorised;
    }

    return result;
};

    return {
     authorize: authorize
    };
}]);
}(angular, homer));
