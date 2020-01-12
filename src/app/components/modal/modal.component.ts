import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html'
})
export class ModalComponent {  
  /**
   * @Input & @Output decorators allow communication between Child and Parent component
   * @Input allow Parent component to send data
   * @Output allow Child component to emit an Event to Parent component
   */

  // Receive true or false from Parent component
  @Input() modal: boolean;

  // Tell to parent component that modal is close
  @Output() closeModal = new EventEmitter();

  toggle() {
    this.closeModal.emit();
  }
 
}
