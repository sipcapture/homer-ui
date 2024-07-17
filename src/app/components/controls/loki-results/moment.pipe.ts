import { Pipe, PipeTransform } from '@angular/core';
import  moment from 'moment';

@Pipe({
    name: 'moment',
    pure: false
})

export class MomentPipe implements PipeTransform {
    transform(timestamp, format) {
        return moment(timestamp).format(format)
    }
}
