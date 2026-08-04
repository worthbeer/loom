// MOCKED — representative stand-in written for this exercise, not pulled from
// a real design system. Shape (CSF3, prop naming) is meant to be plausible,
// not authoritative. See ADR 0004 on the mock/real boundary.
//
// Deliberate naming inconsistency vs. Button.stories.tsx: this uses `status`
// where Button uses `state` for the equivalent concept, and customizes via
// composition (Alert.Icon / Alert.Description / Alert.Action) instead of
// flat args. Real design systems accumulate exactly this kind of drift
// across components built by different teams/eras — left visible here on
// purpose, per chunk-0's scaffolding note, rather than normalized away.
// Whether this counts as "the same convention, differently named" or an
// actual violation is Chunk 6's job to decide, not this file's.

import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from './Alert';

const meta: Meta<typeof Alert> = {
  title: 'Components/Alert',
  component: Alert,
};
export default meta;

type Story = StoryObj<typeof Alert>;

export const Info: Story = {
  render: () => (
    <Alert status="info" size="md">
      <Alert.Icon name="info-circle" />
      <Alert.Description>Your changes have been saved.</Alert.Description>
    </Alert>
  ),
};

export const Warning: Story = {
  render: () => (
    <Alert status="warning" size="md">
      <Alert.Icon name="alert-triangle" />
      <Alert.Description>Check your input.</Alert.Description>
    </Alert>
  ),
};

// Customization example: an extra composed slot (Alert.Action) layered onto
// the same base pattern as Warning above, rather than a new flat prop.
export const WithAction: Story = {
  render: () => (
    <Alert status="warning" size="md">
      <Alert.Icon name="alert-triangle" />
      <Alert.Description>Check your input.</Alert.Description>
      <Alert.Action onClick={() => {}}>Review</Alert.Action>
    </Alert>
  ),
};
