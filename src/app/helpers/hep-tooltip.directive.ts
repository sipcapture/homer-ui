import {
    Directive,
    Input,
    TemplateRef,
    OnInit,
    ElementRef,
    HostListener,
    ViewContainerRef,
    Component,
} from '@angular/core';

import {
    ComponentType,
    ComponentPortal,
    TemplatePortal,
} from '@angular/cdk/portal';

import {
    OverlayRef,
    Overlay,
    OverlayPositionBuilder,
} from '@angular/cdk/overlay';

@Directive({
    selector: '[hepTooltip]',
})
export class HepTooltipDirective implements OnInit {
    @Input('hepTooltip') tooltipContent: TemplateRef<any> | ComponentType<any>;

    private _overlayRef: OverlayRef;
    constructor(
        private overlay: Overlay,
        private overlayPostionBuilder: OverlayPositionBuilder,
        private elementRef: ElementRef,
        private viewContainerRef: ViewContainerRef
    ) { }
    ngOnInit(): void {
        if (this.tooltipContent) {
            const position = this.overlayPostionBuilder
                .flexibleConnectedTo(this.elementRef)
                .withPositions([
                    {
                        originX: 'center',
                        originY: 'bottom',
                        overlayX: 'center',
                        overlayY: 'top',
                        offsetX: 0,
                        offsetY: 8,
                    },
                    {
                        originX: 'center',
                        originY: 'top',
                        overlayX: 'center',
                        overlayY: 'bottom',
                        offsetX: 0,
                        offsetY: -8,
                    },
                ]);

            this._overlayRef = this.overlay.create({
                positionStrategy: position,
                scrollStrategy: this.overlay.scrollStrategies.close(),
                panelClass: 'custom-tooltip',
            });
        } else {
            console.log('tooltip content non shown');
        }
    }
    @HostListener('mouseover')
    private _show(): void {
        if (this._overlayRef) {
            let containerPortal: TemplatePortal<any> | ComponentPortal<any>;
            if (this.tooltipContent instanceof TemplateRef) {
                containerPortal = new TemplatePortal(
                    this.tooltipContent,
                    this.viewContainerRef
                );
            } else {
                containerPortal = new ComponentPortal(
                    this.tooltipContent,
                    this.viewContainerRef
                );
            }
            this._overlayRef.attach(containerPortal);
        }
    }
    @HostListener('mouseout')
    private _hide(): void {
        if (this._overlayRef) {
            this._overlayRef.detach();
        }
    }
}
