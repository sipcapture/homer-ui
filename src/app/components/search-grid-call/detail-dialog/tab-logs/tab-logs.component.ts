import { Component, OnInit, Input } from '@angular/core';
export interface hepLog {
    timestamp:string,
    message: string
  }
@Component({
  selector: 'app-tab-logs',
  templateUrl: './tab-logs.component.html',
  styleUrls: ['./tab-logs.component.scss']
})
export class TabLogsComponent implements OnInit {
    _data: any;
    _d: any;
    dataSource: Array<hepLog> = [];
    displayedColumns: string[] = ['timestamp', 'message'];
    get data() {
        return this._data;
    }
    @Input('data') set data(val) {
        this._d = JSON.parse(JSON.stringify(val));
        this._data = this.filterPayload([...this._d])

        // Compact Objects
    
        this._data.forEach(i => 
            
            {


            try {
                i.payload.raw = JSON.parse(i.payload.raw);
           
                console.log(i.payload.message)
                console.log(i.payload.timestamp)
            } catch (e) { }

            try {
                if(i.payload.raw){
    
                i.payload = {
                    timestamp: i.payload.create_date,
                    message: i.payload.raw,
                
                }
                this.dataSource.push(i.payload);
                };
                delete i.payload.raw.raw;
            } catch (e) { }
        

        });
    }

    filterPayload(arr){
     return arr.filter(f => f.payload.payloadType === 100)
        } 
    
    constructor() { }

    ngOnInit() {
       console.log(this.dataSource)
    }

}
