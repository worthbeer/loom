import { Component, Input } from '@angular/core';
import { NgStyle } from '@angular/common';
import { resolveToken } from './token-resolver';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [NgStyle],
  template: `
    <span [ngStyle]="badgeStyle">
      <ng-content></ng-content>
    </span>
  `,
})
export class BadgeComponent {
  @Input() state: 'default' | 'danger' = 'default';
  @Input() size: 'sm' | 'md' | 'lg' = 'sm';

  get badgeStyle(): Record<string, string> {
    return {
      background: resolveToken('color/red/999'),
      borderRadius: resolveToken('radius/sm'),
    };
  }
}
