export class DictionaryModel {
    static login = {
        header: 'Login',
        username: 'Username',
        password: 'Password',
        authentication: 'Authentication',
        authTypes: {
            internal: 'Internal',
            ldap: 'LDAP'
        },
        signInButton: 'Sign in',
        error: {
            apiNotFound: {
                header: 'API NOT FOUND',
                message: 'Couldn\'t reach your API server. Please check your settings'
            }
        }, 
        copyright: '© 2020-2021 QXIP BV, All Rights Reserved'
    }
    static terms = {
        dashboard: 'Dashboard',
        mapping: 'Mapping',
        sentences: { 
            copy: 'copied to clipboard',
            failedCopy: 'couldn\'t be copied'
        },
        tab: 'Tab',
        localStorage: 'Local storage',
        callTerms: {
            callid: 'Call ID'
        },
        words: {
            success: {
                successfully: 'successfully',
                successfull: 'successfull'
            },
            remove: {
                removed: 'removed',
                remove: 'remove'
            },
            update: {
                updated: 'updated',
                update: 'update'
            },
            reset: {
                reset: 'reset'
            }
        },
        interacts: {
            buttons: {
                close: 'Close',
                ok: 'Ok',
                cancel: 'Cancel',
                save: 'Save'
            }
        }
    }
    static widgets = {
        widget: 'widget',
        search: {
            buttons: {
                search: 'Search',
                clear: 'Clear',
                newTab: 'New Search tab',
                newBrowserTab: 'New Browser tab',
                or: 'OR',
                and: 'AND'
            }
        }
    }
    static methods = {
        INVITE: 'INVITE',
        BYE: 'BYE',
        ACK: 'ACK',
        OPTIONS: 'OPTIONS',
        SUBSCRIBE: 'SUBSCRIBE',
        CANCEL: 'CANCEL'
    }
    static preferences = {
        'about': 'About',
        'ip alias': 'IP Aliases',
        users: 'Users',
        'user settings': 'User settings',
        advanced: 'Advanced settings',
        mapping: `${DictionaryModel.terms.mapping}`,
        hepsub: 'HEPSub',
        scripts: 'Scripts',
        interceptions: 'Interceptions',
        agentsub: 'Agent subcriptions',
        reset: 'Reset',
        'auth token': 'API authentication tokens',
        'system overview': 'System overview'
    }
    static notifications = {
        success: {
            linkCopy: `Link ${DictionaryModel.terms.sentences.copy}`,
            shareLinkCopy: `Share link ${DictionaryModel.terms.sentences.copy}`,
            callidCopy: (CallID) => 
                `${DictionaryModel.terms.callTerms.callid}: ${CallID} ${DictionaryModel.terms.sentences.copy}`,
            dashboardShared: `${DictionaryModel.terms.dashboard} shared`,
            passwordChanged: `${DictionaryModel.login.password} ${DictionaryModel.terms.words.success.successfully} ${DictionaryModel.terms.words.update.updated}`,
            tabRemoved: `${DictionaryModel.terms.tab} ${DictionaryModel.terms.words.success.successfully} ${DictionaryModel.terms.words.remove.removed}`,
            localStorageCleared: `${DictionaryModel.terms.localStorage} clear ${DictionaryModel.terms.words.success.successfull}`,
            dashboardReset: `${DictionaryModel.terms.dashboard} ${DictionaryModel.terms.words.reset} ${DictionaryModel.terms.words.success.successfull}`,
            mappingsReset: `${DictionaryModel.terms.mapping} ${DictionaryModel.terms.words.reset} ${DictionaryModel.terms.words.success.successfull}`,
            resync: `Resync was ${DictionaryModel.terms.words.success.successfull}`,
            fileUpload: `File was uploaded ${DictionaryModel.terms.words.success.successfully}`
        },
        warning: {
            forcePassword: `Admin forced you to change your ${DictionaryModel.login.password.toLowerCase()}`,
        },
        error: {
            wrongOldPassword: `You've entered incorrect old ${DictionaryModel.login.password.toLowerCase()}`,
            samePasswords: `The new password you entered is the same as your old ${DictionaryModel.login.password.toLowerCase()}. Enter a different ${DictionaryModel.login.password.toLowerCase()}`,
            localStorageNotCleared: `${DictionaryModel.terms.localStorage} not cleared`,
            dashboardReset: `${DictionaryModel.terms.dashboard} wasn't ${DictionaryModel.terms.words.reset}`,
            mappingsReset: `${DictionaryModel.terms.mapping} wasn't ${DictionaryModel.terms.words.reset}`,
            callIdCopy: `${DictionaryModel.terms.callTerms.callid}  ${DictionaryModel.terms.sentences.failedCopy}`,
            linkCopy: `Link ${DictionaryModel.terms.sentences.failedCopy}`,
            shareLinkCopy: `Share link ${DictionaryModel.terms.sentences.failedCopy}`,
            noIntenetError: 'There seems to be an issue with your internet connection',
            invalidJWT: 'Invalid JWT token, please use your credentials to log in again',
            mappingIssue: `couldn't retrieve the correct settings for this mapping`
        },
        notice: {
            resultContainerReset: 'Result container field was reset to default value'
        }
    }
}
