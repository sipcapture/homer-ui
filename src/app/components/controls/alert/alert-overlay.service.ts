import { Overlay, OverlayConfig, OverlayRef } from "@angular/cdk/overlay";
import { ComponentPortal, PortalInjector } from "@angular/cdk/portal";
import { ComponentRef, Injectable, Injector } from "@angular/core";
import { AlertComponent } from "@app/components";
import { AlertOverlayRef } from "./alert-ref";
import { ALERT_OVERLAY } from "./alert.tokens";

export interface Message {
    text: string;
    object?: string;
    type: string;
}

interface AlertDialogConfig {
    panelClass?: string;
    hasBackdrop?: boolean;
    backdropClass?: string;
    message?: Message;
}
const DEFAULT_CONFIG: AlertDialogConfig = {
    hasBackdrop: false,
    backdropClass: "dark-backdrop",
    panelClass: "tm-file-preview-dialog-panel",
    message: null,
};
@Injectable()
export class AlertOverlayService {
    isOpen = false;
    dialogRef;
    timeoutId;
    overlayComponent;
    constructor(private injector: Injector, private overlay: Overlay) {}

    open(config: AlertDialogConfig = {}) {
        if (this.dialogRef) {
            this.resetTimer();
            this.dialogRef.close();
        }
        // Override default configuration
        const dialogConfig = { ...DEFAULT_CONFIG, ...config };

        // Returns an OverlayRef which is a PortalHost
        const overlayRef = this.createOverlay(dialogConfig);

        // Instantiate remote control
        const dialogRef = new AlertOverlayRef(overlayRef);
        this.dialogRef = dialogRef;
        const overlayComponent = this.attachDialogContainer(
            overlayRef,
            dialogConfig,
            dialogRef
        );
        this.overlayComponent = overlayComponent
        overlayComponent.closeAlert.subscribe((_) => dialogRef.close());
        overlayComponent.resetTimer.subscribe((_) => this.resetTimer());
        overlayComponent.clearMessageTimer.subscribe((_) => this.clearMessageTimer())
        overlayRef.backdropClick().subscribe((_) => dialogRef.close());
        this.clearMessageTimer();
        return dialogRef;
    }

    clearMessageTimer() {
        if (!this.overlayComponent.isOpen) {
            this.resetTimer();
            this.timeoutId = setTimeout(() => {
                this.dialogRef.close()
            }, 5000);
        }
    }
    resetTimer() {
        clearTimeout(this.timeoutId);
    }
    private createOverlay(config: AlertDialogConfig) {
        const overlayConfig = this.getOverlayConfig(config);
        return this.overlay.create(overlayConfig);
    }

    private attachDialogContainer(
        overlayRef: OverlayRef,
        config: AlertDialogConfig,
        dialogRef: AlertOverlayRef
    ) {
        const injector = this.createInjector(config, dialogRef);

        const containerPortal = new ComponentPortal(
            AlertComponent,
            null,
            injector
        );
        const containerRef: ComponentRef<AlertComponent> =
            overlayRef.attach(containerPortal);

        return containerRef.instance;
    }

    private createInjector(
        config: AlertDialogConfig,
        dialogRef: AlertOverlayRef
    ): PortalInjector {
        const injectionTokens = new WeakMap();

        injectionTokens.set(AlertOverlayRef, dialogRef);
        injectionTokens.set(ALERT_OVERLAY, config.message);

        return new PortalInjector(this.injector, injectionTokens);
    }

    private getOverlayConfig(config: AlertDialogConfig): OverlayConfig {
        const positionStrategy = this.overlay
            .position()
            .global()
            .centerHorizontally()
            .centerVertically();

        const overlayConfig = new OverlayConfig({
            hasBackdrop: config.hasBackdrop,
            backdropClass: config.backdropClass,
            panelClass: config.panelClass,
            scrollStrategy: this.overlay.scrollStrategies.block(),
            positionStrategy,
        });

        return overlayConfig;
    }
}
