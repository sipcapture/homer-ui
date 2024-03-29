export interface SearchCallOne {
    name: string;
    value: number;
    type: string;
    hepid: number;
    profile: string;
}

export interface SearchCallModel {
    param: {
        transaction: { };
        limit: number;
        orlogic: boolean;
        archive: boolean;
        search?: {},
        location: { };
        timezone: {
            value: number;
            name: string;
        }
    };
    timestamp: {
        from: number;
        to: number;
    };
}
