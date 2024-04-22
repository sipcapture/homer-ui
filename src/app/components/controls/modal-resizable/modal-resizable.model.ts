export interface TouchPosition {
    x: number,
    y: number
}
export interface WinSize {
    height: number,
    width: number
}
export interface WinPositon {
    x: number,
    y: number,
    h: number
}

export interface ModalCoordinates {
    x: number;
    y: number;
    width: number;
    height: number;
    isFullPage: boolean;    
}
export interface DetailDialogStateModel {
    modal: ModalCoordinates;
    tab: string;
}
export const defaultX = 23;
export const defaultY = 9;
export const defaultWidth = 1400;
export const defaultHeight = 600;