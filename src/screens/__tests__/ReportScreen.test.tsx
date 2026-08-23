/**
 * Tests for the ReportScreen (docs/ui-plan-1.md Task 4): the persisted content
 * report outbox. Covers the empty state, a normal per-question report, the
 * general-feedback sentinel labeled "General feedback" (not a fake question id),
 * the editable note, and the Send reports action.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import type { ContentReport } from '../../state/reports';
import { GENERAL_REVIEW_FEEDBACK_ID } from '../../state/reports';
import { renderScreen } from '../../test-utils';
import { ReportScreen } from '../ReportScreen';

function makeReport(overrides: Partial<ContentReport> = {}): ContentReport {
  return {
    id: 'r1',
    questionId: 'b01q01',
    note: '',
    timestamp: '2026-08-01T10:00:00.000Z',
    appVersion: '1.0.0',
    version: 1,
    ...overrides,
  };
}

/** Read the rendered text of the first node carrying `testID`. */
function textOf(tree: ReactTestRenderer.ReactTestRenderer, testID: string): string {
  const children = tree.root.findByProps({ testID }).props.children;
  if (Array.isArray(children)) {
    return children.map(child => String(child)).join('');
  }
  return String(children);
}

/** Count host-rendered nodes carrying a testID (Pressable duplicates it on hosts). */
function hostCount(tree: ReactTestRenderer.ReactTestRenderer, testID: string): number {
  return tree.root.findAll(
    node => typeof node.type === 'string' && node.props.testID === testID,
  ).length;
}

describe('ReportScreen — outbox', () => {
  it('shows an empty outbox state when there are no pending reports', async () => {
    const tree = await renderScreen(
      <ReportScreen reports={[]} onUpdate={jest.fn()} onExport={jest.fn()} />,
    );
    expect(tree.root.findByProps({ testID: 'reports-empty' })).toBeTruthy();
    expect(hostCount(tree, 'export-reports')).toBe(0);
  });

  it('renders a normal report with its question id and an editable note', async () => {
    const tree = await renderScreen(
      <ReportScreen
        reports={[makeReport()]}
        onUpdate={jest.fn()}
        onExport={jest.fn()}
      />,
    );
    expect(textOf(tree, 'report-question-b01q01')).toBe('Question: b01q01');
    expect(tree.root.findByProps({ testID: 'report-note-b01q01' })).toBeTruthy();
    expect(hostCount(tree, 'export-reports')).toBe(1);
  });
});

describe('ReportScreen — general feedback (Task 4)', () => {
  it('labels the general-feedback sentinel "General feedback", not a fake question id', async () => {
    const tree = await renderScreen(
      <ReportScreen
        reports={[makeReport({ id: 'g1', questionId: GENERAL_REVIEW_FEEDBACK_ID })]}
        onUpdate={jest.fn()}
        onExport={jest.fn()}
      />,
    );
    expect(textOf(tree, 'report-question-general-review-feedback')).toBe('General feedback');
    expect(textOf(tree, 'report-question-general-review-feedback')).not.toContain(
      GENERAL_REVIEW_FEEDBACK_ID,
    );
    // The editable note input still renders for the sentinel report.
    expect(
      tree.root.findByProps({ testID: 'report-note-general-review-feedback' }),
    ).toBeTruthy();
  });

  it('saves an edited note for the general-feedback draft', async () => {
    const onUpdate = jest.fn();
    const tree = await renderScreen(
      <ReportScreen
        reports={[makeReport({ id: 'g1', questionId: GENERAL_REVIEW_FEEDBACK_ID })]}
        onUpdate={onUpdate}
        onExport={jest.fn()}
      />,
    );
    const input = tree.root.findByProps({ testID: 'report-note-general-review-feedback' });
    await ReactTestRenderer.act(() => {
      input.props.onChangeText('The app closed when I opened Review.');
    });
    // Re-find after the state update so the blur handler sees the new note.
    const updated = tree.root.findByProps({ testID: 'report-note-general-review-feedback' });
    await ReactTestRenderer.act(() => {
      updated.props.onBlur();
    });
    expect(onUpdate).toHaveBeenCalledWith('g1', 'The app closed when I opened Review.');
  });
});

describe('ReportScreen — export', () => {
  it('calls onExport when Send reports is pressed', async () => {
    const onExport = jest.fn();
    const tree = await renderScreen(
      <ReportScreen
        reports={[makeReport()]}
        onUpdate={jest.fn()}
        onExport={onExport}
      />,
    );
    await ReactTestRenderer.act(() => {
      tree.root.findByProps({ testID: 'export-reports' }).props.onPress();
    });
    expect(onExport).toHaveBeenCalledTimes(1);
  });
});
