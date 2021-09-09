import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'colorOffset',
    pure: false
})

export class ColorOffsetPipe implements PipeTransform {
    transform(hsl, hue, saturation, lightness, transparency) {
        if (hsl === 'transparent') {
            return hsl;
        }
        const offsets = [hue, saturation, lightness, transparency];
        if (transparency && transparency !== 1 && !hsl.includes('hsla')) {
            hsl = hsl.replace('hsl', 'hsla');
        }
        const colorOffset = hsl.split(',').map((val, i) => {
                if (offsets[i] === '0') {
                    return val;
                }
                return val.replace(/\d+/, offsets[i]).replace(/\s/, '')
            }
        ).join(', ');
        return colorOffset;
    }
}
