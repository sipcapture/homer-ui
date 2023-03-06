export interface AlertMessage {
    isTranslation?: boolean;
    message: string;
    fullObject?: string | Object;
    translationParams?: Object;
}
export interface AlertSubject {
    type: 'success' | 'error' | 'warning' | 'notice';
    text: AlertMessage['message'];
    object?: AlertMessage['fullObject'];
}
export interface AlertProper extends AlertSubject {
    timeout: ReturnType<typeof setTimeout>;
    isOpen: boolean;
}
export interface AlertMessage {
    isTranslation?: boolean;
    message: string;
    fullObject?: string | Object;
    translationParams?: Object;
}
export const MessageTimer = 5000; // 5 seconds