/**
 * Tests for the Task 12 SettingsScreen: the theme choice (Device / Light / Dark
 * with the current one marked), the Review link, and the confirmed reset flow.
 *
 * Presentational and fixture-data driven — no navigation, storage, or reducers.
 * The reset confirmation is exercised through the native Alert mock, mirroring
 * the LevelPlayScreen abandon-dialog tests.
 */

import React from 'react';
import { Alert } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SettingsScreen } from '../SettingsScreen';

async function render(ui: React.ReactElement) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(ui);
  });
  return tree;
}

async function press(tree: ReactTestRenderer.ReactTestRenderer, testID: string) {
  await ReactTestRenderer.act(() => {
    tree.root.findByProps({ testID }).props.onPress();
  });
}

function textOf(tree: ReactTestRenderer.ReactTestRenderer, testID: string): string {
  const children = tree.root.findByProps({ testID }).props.children;
  if (Array.isArray(children)) {
    return children.map(child => String(child)).join('');
  }
  return String(children);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('SettingsScreen — theme choice', () => {
  it('renders all three theme options and marks the current one selected', async () => {
    const tree = await render(
      <SettingsScreen
        themePreference="dark"
        onChangeTheme={jest.fn()}
        onReset={jest.fn()}
        onOpenReview={jest.fn()}
      />,
    );

    expect(textOf(tree, 'settings-theme-label-device')).toBe('Device');
    expect(textOf(tree, 'settings-theme-label-light')).toBe('Light');
    expect(textOf(tree, 'settings-theme-label-dark')).toBe('Dark');

    // The current preference is marked with a check; the others are not.
    expect(textOf(tree, 'settings-theme-check-dark')).toBe('✓');
    expect(tree.root.findAllByProps({ testID: 'settings-theme-check-device' })).toHaveLength(0);
    expect(tree.root.findAllByProps({ testID: 'settings-theme-check-light' })).toHaveLength(0);

    // Selected state is announced via accessibilityState.
    expect(
      tree.root.findByProps({ testID: 'settings-theme-dark' }).props.accessibilityState,
    ).toEqual({ selected: true });
    expect(
      tree.root.findByProps({ testID: 'settings-theme-light' }).props.accessibilityState,
    ).toEqual({ selected: false });
  });

  it('calls onChangeTheme with the tapped preference', async () => {
    const onChangeTheme = jest.fn();
    const tree = await render(
      <SettingsScreen
        themePreference="device"
        onChangeTheme={onChangeTheme}
        onReset={jest.fn()}
        onOpenReview={jest.fn()}
      />,
    );

    await press(tree, 'settings-theme-dark');
    expect(onChangeTheme).toHaveBeenCalledTimes(1);
    expect(onChangeTheme).toHaveBeenCalledWith('dark');

    await press(tree, 'settings-theme-light');
    expect(onChangeTheme).toHaveBeenCalledWith('light');

    await press(tree, 'settings-theme-device');
    expect(onChangeTheme).toHaveBeenCalledWith('device');
  });
});

describe('SettingsScreen — Review link', () => {
  it('calls onOpenReview when Review mistakes is tapped', async () => {
    const onOpenReview = jest.fn();
    const tree = await render(
      <SettingsScreen
        themePreference="device"
        onChangeTheme={jest.fn()}
        onReset={jest.fn()}
        onOpenReview={onOpenReview}
      />,
    );

    await press(tree, 'settings-review');
    expect(onOpenReview).toHaveBeenCalledTimes(1);
  });
});

describe('SettingsScreen — reset', () => {
  it('shows a confirmation dialog and calls onReset only after confirming', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const onReset = jest.fn();
    const tree = await render(
      <SettingsScreen
        themePreference="device"
        onChangeTheme={jest.fn()}
        onReset={onReset}
        onOpenReview={jest.fn()}
      />,
    );

    await press(tree, 'settings-reset');

    // The dialog appears before anything is erased.
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(onReset).not.toHaveBeenCalled();

    // The cancel action closes the dialog without a callback — nothing is erased.
    const firstButtons = alertSpy.mock.calls[0][2] as Array<{
      text: string;
      style?: string;
      onPress?: () => void;
    }>;
    expect(firstButtons.find(b => b.text === 'Cancel')).toBeDefined();
    expect(firstButtons.find(b => b.text === 'Cancel')?.onPress).toBeUndefined();

    // Confirm the reset → onReset fires.
    await press(tree, 'settings-reset');
    const confirm = alertSpy.mock.calls[1][2] as Array<{
      text: string;
      style?: string;
      onPress?: () => void;
    }>;
    const resetButton = confirm.find(b => b.text === 'Reset');
    await ReactTestRenderer.act(() => {
      resetButton!.onPress!();
    });
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});

describe('SettingsScreen — back affordance and accessibility', () => {
  it('calls onBack when the back button is pressed', async () => {
    const onBack = jest.fn();
    const tree = await render(
      <SettingsScreen
        themePreference="device"
        onChangeTheme={jest.fn()}
        onReset={jest.fn()}
        onOpenReview={jest.fn()}
        onBack={onBack}
      />,
    );

    const button = tree.root.findByProps({ testID: 'settings-back' });
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toBe('Back');
    await press(tree, 'settings-back');
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('omits the back button when no onBack is provided', async () => {
    const tree = await render(
      <SettingsScreen
        themePreference="device"
        onChangeTheme={jest.fn()}
        onReset={jest.fn()}
        onOpenReview={jest.fn()}
      />,
    );
    expect(tree.root.findAllByProps({ testID: 'settings-back' })).toHaveLength(0);
  });

  it('exposes header roles, button roles, and descriptive labels', async () => {
    const tree = await render(
      <SettingsScreen
        themePreference="device"
        onChangeTheme={jest.fn()}
        onReset={jest.fn()}
        onOpenReview={jest.fn()}
      />,
    );

    expect(tree.root.findByProps({ testID: 'settings-heading' }).props.accessibilityRole).toBe(
      'header',
    );
    expect(tree.root.findByProps({ testID: 'settings-theme-label' }).props.accessibilityRole).toBe(
      'header',
    );
    expect(tree.root.findByProps({ testID: 'settings-theme-dark' }).props.accessibilityRole).toBe(
      'button',
    );
    expect(
      tree.root.findByProps({ testID: 'settings-theme-dark' }).props.accessibilityLabel,
    ).toBe('Dark theme');
    expect(tree.root.findByProps({ testID: 'settings-reset' }).props.accessibilityLabel).toBe(
      'Reset game',
    );
    expect(tree.root.findByProps({ testID: 'settings-review' }).props.accessibilityLabel).toBe(
      'Review mistakes',
    );
  });
});
