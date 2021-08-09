/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { UpdateAlertService } from './update-alert.service';

describe('Service: UpdateAlert', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UpdateAlertService]
    });
  });

  it('should ...', inject([UpdateAlertService], (service: UpdateAlertService) => {
    expect(service).toBeTruthy();
  }));
});
