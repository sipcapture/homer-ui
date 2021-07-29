import { Pipe, PipeTransform } from '@angular/core';
import * as _moment from 'moment-timezone';
const moment: any = _moment;

@Pipe({name: 'timeZone'})
export class TimeZonePipe implements PipeTransform {
  transform(value, type) {
    if (type === 'region') {
      value = value.substr(0, value.indexOf('/'));
    } else if (type === 'location'){
      value = value.substr(value.indexOf('/') + 1);
    } else if (type === 'offset') {
      value = moment.tz(value).format('Z z');
    }
    return value;
  }
}
