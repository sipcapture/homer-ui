import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
  selector: "app-setting-pcap-import",
  templateUrl: "./setting-pcap-import-widget.component.html",
  styleUrls: ["./setting-pcap-import-widget.component.scss"],
})
export class SettingPcapImportWidgetComponent {
 pcapws : string = '';
  constructor(
    public dialogRef: MatDialogRef<SettingPcapImportWidgetComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
