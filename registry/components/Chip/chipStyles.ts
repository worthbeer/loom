// Real styling helper, same convention as ../Button/buttonStyles.ts —
// Chip.tsx only ever existed as a gate/critic test fixture
// (generated/Chip.clean.tsx) before now, not something meant to compile
// and render for real.
import styles from './Chip.module.css';

export function chipStyles({ state, size }: { state: 'default' | 'alert'; size: 'sm' | 'md' }) {
  return [styles.chip, styles[`chip-${state}`], styles[`chip-${size}`]].join(' ');
}
