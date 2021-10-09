import { Functions } from 'src/app/helpers/functions';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators'


function rndId() {
  return '_' + Math.floor(Math.random() * 999999);
}

interface OptionType {
  checked: boolean;
  value: string;
}

@Component({
  selector: 'app-multi-select-field',
  templateUrl: './multi-select-field.component.html',
  styleUrls: ['./multi-select-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class MultiSelectFieldComponent implements OnInit {
  /** CONST */
  AND = '&&';
  OR = '||';
  NOT = '!=';
  EQUAL = '==';
  LABEL = 'label';
  BOOL = 'bool';

  rx = /(\|\|)|(\&\&)|(\!\=)|([A-Za-z0-9\.\-_\:])+/ig;
  rxValue = /([A-Za-z0-9\.\-_\:])+/ig;
  rxLogic = /(\|\|)|(\&\&)|(\!\=)/ig;
  /** END CONST */
  checkClassCss: any = { '&&': 'and', '||': 'or', '!=': 'not', '==': 'equal' };
  myControl: FormControl;

  filteredOptions: Observable<OptionType[]>;
  collection: any[] = [];
  _listNameValue: any[] | null = null;
  @Input() options: string[] = ['One', 'Two', 'Three'];
  @Input() isFilterLine = true;
  @Input() placeholder: string = '';

  @Input() set dataList(data: any) {
    this._listNameValue = data;
    this.options = Functions.arrayUniques(data?.map(i => i?.name) || []);
  }
  get dataList() {
    return this.options.map(i => ({ value: i, name: i })) || [];
  }
  __flagIsInitd = false;
  @Input() set value(v: any) {
    this.collection = [];
    if (this._listNameValue && v instanceof Array) {
      const _1 = Functions.arrayUniques(v).map(i => [i.match(this.rx)]?.map(([a1, a2]) => {
        const value = a2 ? a2 : a1;
        const bool = a2 ? a1 : '';
        return bool + (this._listNameValue.find(m => m.value === value)?.name || value)
      }));
      this.onKeyUpFilterTree({ important: true, text: _1.join() });
    } else {
      this.onKeyUpFilterTree({ important: true, text: !v ? '' : v?.join() });
    }
  }

  @Output() valueChange = new EventEmitter<string[]>();

  @Output() changeData: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild(MatAutocompleteTrigger) autoTrigger: MatAutocompleteTrigger | any = null;
  openPanel(): void {
    setTimeout(() => {
      this.autoTrigger.openPanel();
    }, 10);
  }

  constructor(private cdr: ChangeDetectorRef) {
    this.filteredOptions = new Observable<OptionType[]>();
    this.myControl = new FormControl();
  }

  ngOnInit() {
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value).map(value => {
        return <OptionType>{
          checked: false,
          value
        }
      }))
    );
  }
  private _filter(value: string): string[] {
    const filterValue: any = ((value.replace(/\s/g, '') || '').match(this.rxValue) || []).join('');
    const _collection = this.collection.filter(i => i.type === this.LABEL).map(j => j.value);
    const options = this.options.filter(i => !_collection.includes(i))
    return !filterValue ? options : options.filter(option => option.toLowerCase().includes(filterValue.toLowerCase()));
  }

  checkText(text = '', selectionText = '') {
    return (text.match(this.rxLogic) || []).join('') + selectionText;
  }
  onKeyUpFilterTree(event: any = null) {
    const text: string = event.text != null ? event.text : this.myControl.value;
    switch (event.key) {
      case 'Delete':
        this.collection = [];
        this.emit();
        break;
      case 'Backspace':
        if (text === '') {
          this.collection.pop();
          this.emit();
        }
        break;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
    }
    const isSpaceAfterValue = event.keyCode === 32 && text.match(this.rx)?.length > 1;
    if (isSpaceAfterValue || [188].includes(event.keyCode) || event.key === 'Enter' || event.important) {
      text.match(this.rx)?.forEach(txt => {
        const type = this.checkClassCss[txt] ? this.BOOL : this.LABEL;
        if (type === this.LABEL && this.collection.find(i => i.value === txt)) {
          return;
        }
        this.collection.push({
          id: rndId(),
          type,
          value: txt
        });
      });

      this.collection = this.collection.filter((i, k, a) => i.type === this.BOOL && a[k + 1]?.type !== this.BOOL || i.type === this.LABEL)
      if (this.collection.length === 1 && this.collection[0].type === this.BOOL) {
        this.collection = [];
      }

      this.myControl.setValue(this.collection.length === 0 ? '' : ' ');
      if (!event.important) {
        this.emit();
      }
    }
    this.cdr.detectChanges();
  }

  addElement(value: string, type = '', index: number = -1): void {
    if (type !== '') {

      this.collection.push({
        id: rndId(),
        type: this.BOOL,
        value: type
      }, {
        id: rndId(),
        type: this.LABEL,
        value: value
      });
    } else {
      const item = {
        id: rndId(),
        type: this.BOOL,
        value: value
      };
      if (index != -1) {
        this.collection.splice(index, 0, item)
      } else {
        this.collection.unshift(item);
      }
    }
    this.myControl.setValue(' ');
    this.openPanel();
    this.emit();
  }
  acClick(): void {
    this.onKeyUpFilterTree({ important: true, text: this.myControl.value || '' });
    this.emit();
  }
  deleteChip(item: any) {
    this.collection = this.collection.filter(({ id }) => item.id !== id);

    this.emit();
    this.cdr.detectChanges();
  }
  changeLogicChip(idx, bool) {
    if (idx > 0 && this.collection[idx - 1].type === this.BOOL) {
      this.collection[idx - 1].value = bool;
      this.collection = this.collection.filter(i => i.value !== this.EQUAL);
      this.emit();
    } else {
      this.addElement(bool, '', idx);
    }
  }
  emit() {
    this.collection = this.collection.filter((i, k, a) => i.type === this.BOOL && a[k + 1]?.type !== this.BOOL || i.type === this.LABEL)
    if (this.collection.length === 1 && this.collection[0].type === this.BOOL) {
      this.collection = [];
    }

    this.changeData.emit(this.collection);

    if (this._listNameValue) {
      const collectValuesByName = [];
      const _listNameValue = Functions.cloneObject(this._listNameValue);
      this.collection.forEach((i, k, arr) => {
        let bool;
        if (arr[k - 1]?.type === this.BOOL) {
          bool = arr[k - 1].value;
        }
        if (i.type === this.LABEL) {
          const _labels = _listNameValue.filter(j => j.name === i.value);
          if (_labels.length > 0) {
            collectValuesByName.push(..._labels.map(j => {
              if (bool != null) {
                j.value = bool + j.value
              }
              return j.value;
            }));
          } else {
            collectValuesByName.push(bool ? bool + i.value : i.value);
          }
        }
      });
      this.valueChange.emit(collectValuesByName)
    } else {
      this.valueChange.emit(this.collection.reduce((a, b, k, arr) => {
        if (b.type === this.LABEL) {
          let item = b.value;
          if (arr[k - 1] && arr[k - 1].type === this.BOOL) {
            item = arr[k - 1].value + item
          }
          a.push(item);
        }
        return a;
      }, []));
    }

    this.cdr.detectChanges();
  }
}
