// MOCKED — representative stand-in written for this exercise, not pulled from
// a real design system. Shape (standalone Angular component, @Input()
// decorators) is meant to be plausible, not authoritative. See ADR 0004 on
// the mock/real boundary.
//
// Same canonical concept as patterns/react/Button.stories.tsx (`state`,
// `size`) — the design system's naming convention doesn't change across
// frameworks, only the syntax does. Decorator-based (@Input()), not a
// mechanical translation of the React function-component shape: no JSX,
// no props object, a class with a template and getters instead.

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
  @Input() state: 'default' | 'danger' = 'default';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  get buttonClasses(): string {
    return `btn btn-${this.state} btn-${this.size}`;
  }
}
