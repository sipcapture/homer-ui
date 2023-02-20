import { Overlay, OverlayConfig, OverlayRef } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { ComponentRef, Injectable, Injector, StaticProvider } from "@angular/core";
import { AlertComponent } from "@app/components";
import { AlertSubject } from "@app/models/alert.model";
import { AlertOverlayRef } from "./alert-ref";
import { ALERT_OVERLAY } from "./alert.tokens";
interface AlertDialogConfig {
    panelClass?: string;
    hasBackdrop?: boolean;
    backdropClass?: string;
    message?: AlertSubject;
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
    dialogRef: AlertOverlayRef | null;
    timeoutId;
    overlayComponent: AlertComponent;
    constructor(private injector: Injector, private overlay: Overlay) {}

    open(config: AlertDialogConfig = {}) {
        if (this.dialogRef) {
            this.overlayComponent.addNotification(config.message)
            return this.dialogRef;
        } else {
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
            overlayComponent.closeAlert.subscribe((_) =>{ 
                this.dialogRef.close(); 
                this.dialogRef = null;
            });
            overlayRef.backdropClick().subscribe((_) => dialogRef.close());
            return dialogRef;
        }
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
    ): Injector {
        const injectionTokens2: StaticProvider[] = [];

        injectionTokens2.push({provide: AlertOverlayRef, useValue: dialogRef});
        injectionTokens2.push({provide: ALERT_OVERLAY, useValue: config.message});
        return Injector.create({parent: this.injector, providers: injectionTokens2});
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
