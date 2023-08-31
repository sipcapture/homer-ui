export interface User {
    firstname: string;
    lastname: string;
    username: string;
    email: string;
    partid: number;
    usergroup: string;
    department: string;
    id?: number;
    guid?: string;
    scope?: string;
    token?: string;
    user?: {
        admin: boolean;
        force_password: boolean;
        username: string;
        isExternal?: boolean
    }
}
export interface UserProfile {
    admin: boolean
    avatar: string
    department: string
    color: string
    displayname: string
    external_auth: boolean
    external_profile: string
    group: string
    username: string
    guid: string
}
export interface UserJWT {
    avatar: string
    displayname: string
    exp: number
    externalauth: boolean
    externaltype: string
    force_password: boolean
    guid: string
    partid: number
    useradmin: boolean
    usergroup: string
    username: string
}