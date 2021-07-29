import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
    name: 'moment',
    pure: false
})

export class MomentPipe implements PipeTransform {
transform(timestamp: any, format: any) {
    return moment(timestamp).format(format)
    }
}
