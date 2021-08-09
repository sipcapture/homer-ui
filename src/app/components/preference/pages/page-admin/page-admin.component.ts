import { Functions } from '@app/helpers/functions';
import { Component, Input } from '@angular/core';
import { AdminService, StreamType } from '@app/services/preferences/admin.service';
import { HttpResponse } from '@angular/common/http';
import { AlertService } from '@app/services';

@Component({
  selector: 'app-page-admin',
  templateUrl: './page-admin.component.html',
  styleUrls: ['./page-admin.component.scss']
})
export class PageAdminComponent {
  @Input() page: string;

  constructor(
    private adminService: AdminService,
    private alertService: AlertService,
  ) { }

  public async download() {
    const data: HttpResponse<Blob> = await this.adminService.getFile();
    const { headers, body }: { headers: any, body: Blob } = data;
    const fName = headers.get('content-disposition') ||
      `logs-${(new Date()).toISOString()}.zip`;
    Functions.saveToFile(<Blob>body, fName);
  }
  public async dumpRequest(streamName: StreamType) {
    try {
      const { data }: any = await this.adminService.dumpRequest(streamName);
      this.alertService.success(data?.message);
    } catch (err) {
      this.alertService.error(err);
    }
  }
}
