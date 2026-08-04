import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  template: `
    <button [ngClass]="buttonClasses">
      <ng-content></ng-content>
    </button>
  `,
})
export class ButtonComponent {
  @Input() variant: 'default' | 'danger' = 'default';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  get buttonClasses(): string {
    return `btn btn-${this.variant} btn-${this.size}`;
  }
}
