export interface User {
    id?: number;
    firstname: string;
    lastname: string;
    username: string;
    email: string;
    guid?: string;
    partid: number;
    usergroup: string;
    department: string;
    token?: string;
}
