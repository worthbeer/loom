import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  template: `
    <button [ngStyle]="buttonStyle">
      <ng-content></ng-content>
    </button>
  `,
})
export class ButtonComponent {
  @Input() state: 'default' | 'danger' = 'default';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  get buttonStyle(): Record<string, string> {
    return {
      background: this.state === 'danger' ? '#C0392B' : 'transparent',
      borderRadius: '4px',
    };
  }
}
