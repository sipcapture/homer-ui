import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorOffsetPipe } from '@app/pipes/colorOffset.pipe';

@NgModule({
    imports: [
        CommonModule,
    ],
    declarations: [
        ColorOffsetPipe
    ],
    exports: [ColorOffsetPipe]
})
export class ColorOffsetModule {}
