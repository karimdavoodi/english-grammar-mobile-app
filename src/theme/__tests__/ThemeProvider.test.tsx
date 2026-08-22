/**
 * Tests for the Task 12 theme system: ThemeProvider resolves the
 * `device | light | dark` preference against the device scheme, `useTheme`
 * provides the resolved palette + tokens, and `useThemedStyles` builds
 * palette-driven styles. Also pins the no-provider fallback that lets the
 * presentational screens render in tests without a provider.
 */

import React from 'react';
import { Text, useColorScheme, View } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { darkColors, lightColors } from '../themes';
import { tokens } from '../tokens';
import { ThemeProvider, useTheme, useThemedStyles } from '../ThemeProvider';

/**
 * The RN jest preset mocks `useColorScheme` as `jest.fn(() => 'light')` — drive
 * the device scheme through that mock to exercise the `device` preference.
 */
const mockUseColorScheme = useColorScheme as jest.Mock;

/** Reads the theme value out of context and renders it as text. */
function Probe() {
  const theme = useTheme();
  return (
    <Text testID="probe">
      {theme.scheme}|{theme.colors.background}|{theme.tokens.spacing.lg}
    </Text>
  );
}

async function render(ui: React.ReactElement) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(ui);
  });
  return tree;
}

function textOf(tree: ReactTestRenderer.ReactTestRenderer, testID: string): string {
  const children = tree.root.findByProps({ testID }).props.children;
  return Array.isArray(children) ? children.map(String).join('') : String(children);
}

afterEach(() => {
  // The preset installs `jest.fn(() => 'light')`; restore that default.
  mockUseColorScheme.mockImplementation(() => 'light');
});

describe('ThemeProvider — preference resolution', () => {
  it('resolves a light preference to the light palette regardless of the device', async () => {
    mockUseColorScheme.mockReturnValue('dark');
    const tree = await render(
      <ThemeProvider preference="light">
        <Probe />
      </ThemeProvider>,
    );
    expect(textOf(tree, 'probe')).toBe(`light|${lightColors.background}|${tokens.spacing.lg}`);
  });

  it('resolves a dark preference to the dark palette regardless of the device', async () => {
    mockUseColorScheme.mockReturnValue('light');
    const tree = await render(
      <ThemeProvider preference="dark">
        <Probe />
      </ThemeProvider>,
    );
    expect(textOf(tree, 'probe')).toBe(`dark|${darkColors.background}|${tokens.spacing.lg}`);
  });

  it('follows a light device when the preference is device', async () => {
    mockUseColorScheme.mockReturnValue('light');
    const tree = await render(
      <ThemeProvider preference="device">
        <Probe />
      </ThemeProvider>,
    );
    expect(textOf(tree, 'probe')).toBe(`light|${lightColors.background}|${tokens.spacing.lg}`);
  });

  it('follows a dark device when the preference is device', async () => {
    mockUseColorScheme.mockReturnValue('dark');
    const tree = await render(
      <ThemeProvider preference="device">
        <Probe />
      </ThemeProvider>,
    );
    expect(textOf(tree, 'probe')).toBe(`dark|${darkColors.background}|${tokens.spacing.lg}`);
  });
});

describe('useTheme — no provider', () => {
  it('falls back to the light theme so fixtures render with sensible colors', async () => {
    const tree = await render(<Probe />);
    expect(textOf(tree, 'probe')).toBe(`light|${lightColors.background}|${tokens.spacing.lg}`);
  });
});

describe('useThemedStyles', () => {
  const makeStyles = (colors: typeof lightColors) =>
    ({ box: { backgroundColor: colors.primary, padding: tokens.spacing.md } } as const);

  function StylesProbe() {
    const styles = useThemedStyles(makeStyles);
    return (
      <View
        testID="styled"
        style={{ backgroundColor: styles.box.backgroundColor, padding: styles.box.padding }}
      />
    );
  }

  it('builds palette-driven styles from the active theme', async () => {
    const tree = await render(
      <ThemeProvider preference="dark">
        <StylesProbe />
      </ThemeProvider>,
    );
    const node = tree.root.findByProps({ testID: 'styled' });
    expect(node.props.style).toEqual({
      backgroundColor: darkColors.primary,
      padding: tokens.spacing.md,
    });
  });
});
