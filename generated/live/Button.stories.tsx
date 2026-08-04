// MOCKED — representative stand-in written for this exercise, not pulled from
// a real design system. Shape (CSF3, prop naming) is meant to be plausible,
// not authoritative. See LOOM-2 / intro.md decision #5 on the mock/real boundary.

import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { state: 'default', size: 'md', children: 'Button' },
};

export const Danger: Story = {
  args: { state: 'danger', size: 'md', children: 'Delete' },
};

export const Sizes: Story = {
  args: { state: 'default', size: 'sm', children: 'Button' },
};