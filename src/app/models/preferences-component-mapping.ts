export class PreferencesComponentMapping {
    static accessMapping = {
        admin: {
            users: {
                add: true,
                edit: true,
                delete: true,
                copy: true,
                export: false,
                import: true
            },
            'user settings': {
                add: true,
                edit: true,
                delete: true,
            },

            'system overview': {
                reset: false,
                add: false,
                edit: false,
                delete: false,
            },
            'system overview-config': {
                reset: false,
                resync: true,
                add: false,
                edit: false,
                delete: false,
            },
            alias: {
                add: true,
                edit: true,
                delete: true,
            },
            scripts: {
                add: true,
                edit: true,
                delete: true,
            },
            'ip alias': {
                add: true,
                edit: true,
                copy: true,
                delete: true,
                import: true,
                export: false,
            },
            advanced: {
                add: true,
                edit: true,
                delete: true,
            },
            mapping: {
                reset: true,
                add: true,
                edit: true,
                delete: true,
            },
            hepsub: {
                add: true,
                edit: true,
                delete: true,
            },
            'auth token': {
                add: true,
                edit: true,
                delete: true,
            },
            agentsub: {
                add: false,
                edit: false,
                delete: true,
            },
            reset: {
                add: true,
                edit: true,
                delete: true,
            },
            admin: {
                add: true,
                edit: true,
                delete: true,
            },
        },
        commonUser: {
            users: {
                add: false,
                edit: true,
                delete: false,
            },
            'user settings': {
                add: true,
                edit: true,
                delete: true,
            },
            alias: {
                add: false,
                edit: false,
                delete: false,
            },
            'ip alias': {
                add: false,
                copy: false,
                edit: false,
                delete: false,
                import: false,
                export: false,
            },
            'system overview': {
                add: false,
                edit: false,
                delete: false,
            },
            'system overview-config': {
                add: false,
                edit: false,
                delete: false,
                resync: false,
            },
            advanced: {
                add: false,
                edit: false,
                delete: false,
            },
            mapping: {
                reset: false,
                add: false,
                edit: false,
                delete: false,
            },
            hepsub: {
                add: false,
                edit: false,
                delete: false,
            },
            'auth token': {
                add: false,
                edit: false,
                delete: false,
            },
            scripts: {
                add: false,
                edit: false,
                delete: false,
            },
            agentsub: {
                add: false,
                edit: false,
                delete: true,
            },
            reset: {
                add: false,
                edit: false,
                delete: false,
            },
            admin: {
                add: false,
                edit: false,
                delete: false,
            },
        }
    };
    static specialColumns = [
        'tools', // Button column
        'Data', 'IP Object', 'HepSub', // Data preview column
        'Status', 'Active', 'Master', 'Online', // True-false green-red column
        'DB Stats', // DB stats with tooltip
        'Last Error', //  Column with tooltip with error details
    ]
    static pagesStructureMapping = {
        admin: {
            users: ['Firstname', 'Lastname', 'Username', 'Email', 'tools'],
            'user settings': [
                'ID',
                'Username',
                // 'Partid',
                'Category',
                'Name',
                'Param',
                'Data',
                'tools',
            ],
            'ip alias': [
                'Alias',
                'CIDR IP',
                'Port',
                'CIDR Mask',
                'Group Name',
                'Server Type',
                'Shard ID',
                'Type',
                'IPV6',
                'Status',
                'IP Object',
                'tools',
            ],
            'system overview': [
                'Name',
                'Version',
                'Last Error',
                'Last Check',
                'Latency AVG',
                'Latency Min',
                'Latency Max',
                'DB Stats',
                'Master',
                'Online',
            ],
            'system overview-config': [
                'Name',
                'Version',
                'Last Error',
                'Last Check',
                'Latency AVG',
                'Latency Min',
                'Latency Max',
                'DB Stats',
                'Master',
                'Online',
                'tools',
            ],

            alias: [
                'Alias',
                'IP Address',
                'Port',
                'Mask',
                'CaptureID',
                'Status',
                'tools',
            ],
            advanced: [
                // 'Partid', 
                'Category', 
                'Param', 
                'Data',
                'tools'
            ],
            mapping: [
                // 'Partid',
                'Profile',
                'HEP alias',
                'HEP ID',
                // 'Retention',
                // 'Table Name',
                'tools',
            ],
            hepsub: [
                'Profile',
                'HEP alias',
                'HEP ID',
                'Version',
                'HepSub',
                'tools',
            ],

            'auth token': [
                'UUID',
                'Name',
                'Create Date',
                'Expire Date',
                'Active',
                'tools',
            ],
            agentsub: [
                'UUID',
                'Host',
                'Port',
                'Node',
                'Type',
                'Expire',
                'tools',
            ],
            scripts: [
                'Profile',

                'HEP Alias',
                'Type',
                'HEP ID',
                'Status',
                'tools',
            ],
        },
        commonUser: {
            users: ['Firstname', 'Lastname', 'Username', 'Email', 'tools'],
            'user settings': [
                'Username',
                // 'Partid',
                'Category',
                'Param',
                'Data',
                'tools',
            ],
            advanced: [
                // 'Partid', 
                'Category', 
                'Param', 
                'Data'
            ],
        }
    };

    static links = {
        admin: [
            // 'about',
            'users',
            'user settings',
            'alias',
            'advanced',
            'mapping',
            'hepsub',
            'auth token',
            // 'scripts',
            'agentsub',
            // 'system overview',
            'reset',
            'api documentation'
        ],
        commonUser: ['users', 'user settings', 'advanced', 'reset'],
    };

}
