import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeStyleFieldComponent } from './code-style-field.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';

@NgModule({
  imports: [
    CommonModule,
    MatMenuModule,
    MatFormFieldModule,
    FontAwesomeModule
  ],
  declarations: [CodeStyleFieldComponent],
  exports: [CodeStyleFieldComponent]
})
export class CodeStyleFieldModule {

  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas, fab, far);
  }
}
