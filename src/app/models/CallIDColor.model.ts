export interface CallIDColor {
    callID: string;
    backgroundColor: string;
    decompiledColor: {
        hue: number;
        saturation: number;
        lightness: number;
        alpha: number;
    };
    textColor: string;
}