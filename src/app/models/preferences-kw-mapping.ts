export class PreferencesContentMapping{

    constructor(){}

    static get keyWordsOnHeaderMapping():Object {
        return {
            'ip alias' : "IP Aliases" ,
            'agentsub' : "Agent subscriptions",
            'advanced' : "Advanced Settings",
            'system overview' : "System Overview",
            'user settings' : 'User Settings',
            'auth token' : 'API authentication tokens',
            'hepsub' : "HEPSub",
        }
    };


    static get keyWordsOnPreferencesMapping():Object {
        return {
            'ip alias' :'IP ALIASES',
            'agentsub' :  'AGENT SUBSCRIPTIONS',
            'advanced' :'ADVANCED SETTINGS',
            'auth token' :'API AUTH',
        }
    };

}