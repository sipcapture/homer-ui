import { TestBed } from '@angular/core/testing';

import { PrometheusService } from './prometheus.service';

describe('PrometheusService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PrometheusService = TestBed.get(PrometheusService);
    expect(service).toBeTruthy();
  });
});
