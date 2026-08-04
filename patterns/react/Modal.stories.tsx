// MOCKED — representative stand-in written for this exercise, not pulled from
// a real design system. Shape (CSF3, prop naming) is meant to be plausible,
// not authoritative. See ADR 0004 on the mock/real boundary.
//
// Different shape from Button/Chip/Alert: a boolean visibility prop, not a
// variant enum. Real component libraries are genuinely inconsistent here —
// MUI uses `open`, Chakra/Reach use `isOpen`, antd uses `visible` — so
// `open` is one legitimate real-world choice among several, not an
// obviously "correct" one; it's canonical *for this library* because this
// is the file that says so, same authority Button's `state` has.

import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from './Modal';

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
};
export default meta;

type Story = StoryObj<typeof Modal>;

export const Open: Story = {
  args: { open: true, children: 'Modal content' },
};

export const Closed: Story = {
  args: { open: false, children: 'Modal content' },
};
