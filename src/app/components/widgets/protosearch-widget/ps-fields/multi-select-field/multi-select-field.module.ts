import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MultiSelectFieldComponent } from './multi-select-field.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, } from '@angular/material/autocomplete';

@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    FormsModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    MatMenuModule
  ],
  declarations: [
    MultiSelectFieldComponent
  ],
  exports: [MultiSelectFieldComponent]
})
export class MultiSelectFieldModule { }
