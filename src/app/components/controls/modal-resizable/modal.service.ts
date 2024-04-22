import { Injectable } from '@angular/core';

export const IS_DIFF = 'isDiff';
export const IS_DIFF_RIGHT = 'isDiff-right';
export const IS_DIFF_LEFT = 'isDiff-left';

// @Injectable()
@Injectable({ providedIn: 'root' })
export class ModalService {
    items: any[] = [];
    _activeZIndex: any[] = [];
    draggingId: string | number | null;
    diffWindowRair: any[] = [];
    isDiffWindow: any;
    getOpacity: boolean = false;

    setDropLayer(bool: boolean, id: string | number, zIndex = 0, isDropLeft = false, isDropRight = false) {
        if (id == IS_DIFF) {
            const isDiffPosition = ((isDropLeft && IS_DIFF_LEFT) || (isDropRight && IS_DIFF_RIGHT));
            this.isDiffWindow = bool ? isDiffPosition : null;
        }

        if (bool) {
            this.items[id] = bool;
            this.setActive(id, zIndex)
        } else {
            delete this.items[id];
            this.removeActive(id)
        }
        let b;
        b = Object.values(this.items)
            .reduce((a, b) => a = a || b, false);

        this.getOpacity = this.draggingId !== IS_DIFF && b;
    }
    checkZIndex(id) {
        if (this.draggingId === IS_DIFF) {
            return false;
        }
        const max = Math.max(...Object.values(this._activeZIndex), 0);
        return this._activeZIndex[id] >= max;
    }
    setActive(id, zIndex) {
        this._activeZIndex[id] = zIndex;
    }
    removeActive(id) {
        if (id === IS_DIFF) {
            this.isDiffWindow = null;
        }
        delete this._activeZIndex[id];

    }
    setDraggingId(id) {
        this.draggingId = id;
    }
    removeDraggingId() {
        this.draggingId = null;
    }
    isDragging() {
        return this.draggingId != null;
    }
    getPair() {
        let firstItem = this.draggingId;
        let [secondItem] = [...Object.keys(this._activeZIndex).filter(i => this.checkZIndex(i))];

        const pair = [firstItem, secondItem];

        switch (this.isDiffWindow) {
            case IS_DIFF_RIGHT:
                return [firstItem, null];

            case IS_DIFF_LEFT:
                return [null, firstItem];
        }
        return pair.filter(i => !!i);
    }
}
