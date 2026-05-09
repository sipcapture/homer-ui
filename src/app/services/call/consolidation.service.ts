import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { tap, takeUntil } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})

export class CallCaptureIdConsolidationService implements OnDestroy {
  private consolidationFilterSubject = new BehaviorSubject<{isConsolidateCaptureIds: boolean, consolidationTimeThreshold: number}>({isConsolidateCaptureIds: false, consolidationTimeThreshold: 500});
  done$ = new Subject<void>();

  consolidationFilter$ = this.consolidationFilterSubject.asObservable();

  ngOnDestroy() {
    this.done$.next();
    this.done$.complete();
  }

  setConsolidationFilter(value: any) {
    this.done$.next();
    this.consolidationFilterSubject.next(value);
  }

  private expandItemSubject = new Subject<number>();
  expandedItem$ = this.expandItemSubject.asObservable();

  setExpandedItem(idx: number) {
    this.expandItemSubject.next(idx);
  }

  consolidateMessages(messages: any[]) {
    const {isConsolidateCaptureIds, consolidationTimeThreshold} = this.consolidationFilterSubject.getValue();
    const stopProcessing$ = this.done$.asObservable();
    let finished = false;

    // Check if processing should be stopped
    const unsubscribe$ = new Subject<void>();
    stopProcessing$.pipe(takeUntil(unsubscribe$)).subscribe(() => {
      finished = true;
    });      

    const fingerprintGroups: Map<string, any[]> = new Map();

    for (let item of messages) {
      if (finished) {
        // aborting early!
        unsubscribe$.next();
        unsubscribe$.complete();
        return messages;
      }

      item.isConsolidated = false;
      if (item.subItems) {
        delete item.subItems;
      }

      if (!isConsolidateCaptureIds) {
        continue;
      }

      const messageDataItem = item.messageData?.item;
      if (!messageDataItem) {
        continue;
      }

      const fingerprint = messageDataItem.fingerprint;
      if (!fingerprint) {
        continue;
      }

//      let groups = fingerprintGroups.get(fingerprint) || [];

      let groups = fingerprintGroups.get(fingerprint);
      if (!groups) {
        groups = [];
        fingerprintGroups.set(fingerprint, groups);
      }

      const parentItem = groups.find(parent => 
        this.canBeConsolidated(item, parent, consolidationTimeThreshold)
      );

      if (parentItem) {
        if (!parentItem.subItems) {
          parentItem.subItems = [];
        }
        
        parentItem.subItems.push(item);
        item.isConsolidated = true;
      } else {
        groups.push(item);
      }

      fingerprintGroups.set(fingerprint, groups);
    }

    unsubscribe$.next();
    unsubscribe$.complete();
    return messages;
  }

  private canBeConsolidated(item: any, parentItem: any, timeThreshold: number): boolean {
    const parentCaptureId = parentItem.messageData?.item?.captureId;
    const thisCaptureId = item.messageData?.item?.captureId;
    
    // Time threshold check
    const timeDiff = Math.abs(item.micro_ts - parentItem.micro_ts);
    if (timeDiff > timeThreshold) {
      return false;
    }
    
    // Parent and current item should have different captureIds
    if (parentCaptureId === thisCaptureId) {
      return false;
    }
    
    // Check if captureId already exists in subItems
    if (parentItem.subItems?.some(subItem => 
      subItem.messageData?.item?.captureId === thisCaptureId)) {
      return false;
    }
    
    // All checks passed, can be consolidated
    return true;
  }
}
