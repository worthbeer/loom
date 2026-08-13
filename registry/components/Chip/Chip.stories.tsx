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
