import { ValidatorFn, AbstractControl } from '@angular/forms';

export function emailValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
        const nameRe: RegExp = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
        const valid = nameRe.test(control.value);
        return !valid ? {'forbiddenName': {value: control.value}} : null;
    };
}