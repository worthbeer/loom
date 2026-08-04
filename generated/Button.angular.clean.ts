import { Component, Input } from '@angular/core';
import { NgStyle } from '@angular/common';
import { resolveToken } from './token-resolver';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [NgStyle],
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
      background: this.state === 'danger' ? resolveToken('color/red/600') : resolveToken('color/blue/100'),
      color: this.state === 'danger' ? resolveToken('color/gray/100') : resolveToken('color/gray/900'),
      borderRadius: resolveToken('radius/sm'),
    };
  }
}
