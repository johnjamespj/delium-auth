export interface PasswordPayload {
    salt: string;
    verifier: string;
}

export interface UserSimple {
    id: string;
    email: string;
    verified: boolean;
}

export interface User {
    id: string;
    email: string;
    passwordPayload: PasswordPayload;
    verified: boolean;    
    customAttributes: CustomAttributes;
}

export interface CustomAttributes {
    [key: string]: any;
}

export interface SRPSessionInfo{
    user: User;
    serverSecretEphemeral: string;
}