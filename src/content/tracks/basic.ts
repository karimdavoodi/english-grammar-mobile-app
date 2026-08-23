/**
 * Basic track compatibility export.
 *
 * New content is authored in cluster modules; callers that still import the
 * historical track module continue to receive the same TrackInput shape.
 */

import type { TrackInput } from '../types';
import { basicCluster01 } from './basic/basic-01';
import { basicCluster02 } from './basic/basic-02';

export const basicTrack: TrackInput = {
  id: 'basic',
  order: 1,
  name: 'Basic',
  label: 'Beginner',
  eligibleStartingPoint: true,
  levels: [...basicCluster01, ...basicCluster02],
};
