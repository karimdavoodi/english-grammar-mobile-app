/**
 * WebBackButton — web-only floating back arrow.
 *
 * Presentational by design: it renders ONLY on web (never native), ONLY while
 * the stack has a screen to pop, and presses through the injected callback.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Platform } from 'react-native';
import { renderScreen } from '../../test-utils';
import { WebBackButton } from '../WebBackButton';

describe('WebBackButton', () => {
  const onGoBack = jest.fn();

  beforeEach(() => {
    onGoBack.mockClear();
  });

  afterEach(() => {
    // restores the Platform.OS replacements set in the tests below
    jest.restoreAllMocks();
  });

  function backButtons(tree: ReactTestRenderer.ReactTestRenderer) {
    return tree.root.findAllByProps({ testID: 'web-back-button' });
  }

  it('renders nothing on native platforms', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    const tree = await renderScreen(<WebBackButton canGoBack onGoBack={onGoBack} />);
    expect(backButtons(tree)).toHaveLength(0);
    await ReactTestRenderer.act(() => tree.unmount());
  });

  it('renders nothing on web while the stack cannot go back', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    const tree = await renderScreen(<WebBackButton canGoBack={false} onGoBack={onGoBack} />);
    expect(backButtons(tree)).toHaveLength(0);
    await ReactTestRenderer.act(() => tree.unmount());
  });

  it('renders the back arrow on web when a back exists, and pops on press', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    const tree = await renderScreen(<WebBackButton canGoBack onGoBack={onGoBack} />);
    // findAllByProps matches the Pressable composite AND its host nodes — pick
    // the one that actually carries the onPress handler.
    const button = backButtons(tree).find(node => typeof node.props.onPress === 'function');
    expect(button).toBeDefined();
    await ReactTestRenderer.act(() => {
      button?.props.onPress();
    });
    expect(onGoBack).toHaveBeenCalledTimes(1);
    await ReactTestRenderer.act(() => tree.unmount());
  });
});
