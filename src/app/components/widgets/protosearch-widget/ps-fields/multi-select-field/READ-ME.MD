How to use this
===============
```ts
import { MultiSelectFieldModule } from './ps-fields/multi-select-field/multi-select-field.module';
@NgModule({
  imports: [
    MultiSelectFieldModule,
    . . .
  ]
})
export class AppModule { }
```

```ts
  property1: string[] = [ "!=aaa", "||bbb", "&&google.com", "ffff.net" ];
  dataList: string[] = [
    'fist-host_name',
    '127.0.0.1',
    'other-host',
    'second.host.com'
  ];
```

```html
<app-multi-select-field
  [(value)]="property1"
  [options]="dataList"
></app-multi-select-field>
```
