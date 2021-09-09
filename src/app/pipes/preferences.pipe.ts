import { Pipe, PipeTransform } from '@angular/core';
import { PreferencesContentMapping } from '@app/models/preferences-kw-mapping';

@Pipe({
    name: 'preferences',
    pure: false
})

export class PreferencesPipe implements PipeTransform {
    transform(value:string,type:string) {
        return type === 'header'      ? PreferencesContentMapping.keyWordsOnHeaderMapping[value]:
               type === 'preferences' ? PreferencesContentMapping.keyWordsOnPreferencesMapping[value]: 
        "";
    }
}
