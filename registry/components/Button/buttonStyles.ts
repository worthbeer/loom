// Real styling helper — was referenced by Button.tsx but never actually
// created; Button.tsx only ever existed as a gate/critic test fixture
// before now, not something meant to compile and render for real.
import styles from './Button.module.css';

export function buttonStyles({ state, size }: { state: 'default' | 'danger'; size: 'sm' | 'md' | 'lg' }) {
  return [styles.btn, styles[`btn-${state}`], styles[`btn-${size}`]].join(' ');
}
