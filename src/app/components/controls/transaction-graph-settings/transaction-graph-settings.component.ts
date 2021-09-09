import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Functions } from '@app/helpers/functions';
import { UserConstValue } from '@app/models';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-transaction-graph-settings',
  templateUrl: './transaction-graph-settings.component.html',
  styleUrls: ['./transaction-graph-settings.component.scss']
})
export class TransactionGraphSettingsComponent implements OnInit {
    _options;
    maxValue = -50000;
    isRepulsion: boolean;
    isLSSet = false;
    @Input() set options(value) {
        this._options = value;
        
        const ls = Functions.JSON_parse(localStorage.getItem(UserConstValue.GRAPH_SETTINGS));
        if (ls !== null && typeof value !== 'undefined' && !this.isLSSet) {
            setTimeout(() => {
                if (
                    this.options.physics.barnesHut.gravitationalConstant === 0 &&
                    this.options.physics.barnesHut.centralGravity === 0 &&
                    this.options.physics.barnesHut.springConstant === 0 ) {
                        this.isRepulsion = true;
                }
                this._options = ls;
                this.optionsChanged.emit(this.options);
                this.isLSSet = true;
                this.cdr.detectChanges();
            }, 200);
        }
    };
    get options() {
        return this._options;
    }
    
    @Output() optionsChanged = new EventEmitter();
    isInfoOpened = false;
    constructor(
        private cdr: ChangeDetectorRef,
        public translateService: TranslateService
        ) {
            translateService.addLangs(['en'])
            translateService.setDefaultLang('en')
         }

    ngOnInit(): void {
        
    }

    openInfo() {
        if (this.isInfoOpened) {
            return;
        }
        setTimeout(() => {
            this.isInfoOpened = true;
            this.cdr.detectChanges();
        });
        this.cdr.detectChanges();
    }
    hideInfo() {
        this.isInfoOpened = false;
        this.cdr.detectChanges();
    }
    formatLabel(value: number) {  
        const percent = Math.round(Math.abs(value) / Math.abs(-50000) * 100);
        return percent;
    }
    changeOptions() {
        localStorage.setItem(UserConstValue.GRAPH_SETTINGS, JSON.stringify(this.options))
        this.optionsChanged.emit(this.options);
    }
    toggleRepulsion() {
        if (!this.isRepulsion) {
            this.options.physics.barnesHut.gravitationalConstant = -20000;
            this.options.physics.barnesHut.centralGravity = 0.05;
            this.options.physics.barnesHut.springConstant = 0.01
        } else {
            this.options.physics.barnesHut.gravitationalConstant = 0;
            this.options.physics.barnesHut.centralGravity = 0;
            this.options.physics.barnesHut.springConstant = 0
        }
        this.changeOptions();
    }
}
