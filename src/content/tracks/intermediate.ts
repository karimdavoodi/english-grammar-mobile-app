/** Intermediate track compatibility export assembled from authoring clusters. */

import type { TrackInput } from '../types';
import { intermediateCluster01 } from './intermediate/intermediate-01';

export const intermediateTrack: TrackInput = {
  id: 'intermediate',
  order: 2,
  name: 'Intermediate',
  label: 'Intermediate',
  eligibleStartingPoint: true,
  levels: intermediateCluster01,
};
