// MOCKED — representative stand-in written for this exercise, not pulled from
// a real design system. Shape (CSF3, prop naming) is meant to be plausible,
// not authoritative. See ADR 0004 on the mock/real boundary.
//
// Added alongside fixtures/chip-dual-red.json (LOOM-6.5's ambiguity test
// fixture) so read_component_patterns('Chip', 'react') returns a real
// example instead of []. Agrees with Button's `state`/`size` naming
// (unlike Alert's deliberate drift) and demonstrates a required-a11y-prop
// convention: every Chip must carry an explicit `aria-label`, since its
// visible content alone (a short label or count) is often not sufficient
// for assistive tech. This is the convention LOOM-10's required-prop gate
// rule enforces — see tools/gate.js's requiredPropsPresent() and
// generated/Chip.*.tsx for the passing/failing fixtures.

import type { Meta, StoryObj } from '@storybook/react';
import { Chip } from './Chip';

const meta: Meta<typeof Chip> = {
  title: 'Components/Chip',
  component: Chip,
};
export default meta;

type Story = StoryObj<typeof Chip>;

export const Default: Story = {
  args: { state: 'default', size: 'sm', 'aria-label': 'Default chip', children: 'Default' },
};

export const AlertState: Story = {
  args: { state: 'alert', size: 'sm', 'aria-label': 'Alert chip', children: 'Alert' },
};
