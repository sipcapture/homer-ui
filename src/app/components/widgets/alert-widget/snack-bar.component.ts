import {Component, Inject} from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Component({
  selector: 'snack-bar',
  templateUrl: 'snack-bar.component.html',
  styles: [`
    .snack-bar {
    	box-sizing: border-box;
    	display:block;
    	width:calc(100% + 34px);
    	height:calc(100% + 28px);
    	margin: -14px -17px;
      	border-radius: 4px;
      	padding: 14px 16px;
      	
    }
  `],
})
export class SnackBarComponent {
  constructor(
        @Inject(MAT_SNACK_BAR_DATA) public data: any
        ) {}
}