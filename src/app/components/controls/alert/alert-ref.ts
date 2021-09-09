import { OverlayRef } from '@angular/cdk/overlay';

export class AlertOverlayRef {

    constructor(private overlayRef: OverlayRef) { }

    close(): void {
        this.overlayRef.dispose();
    }
}
