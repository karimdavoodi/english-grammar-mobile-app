/** Intermediate track compatibility export assembled from authoring clusters. */

import type { TrackInput } from '../types';
import { intermediateCluster01 } from './intermediate/intermediate-01';
import { intermediateCluster02 } from './intermediate/intermediate-02';
import { intermediateCluster03 } from './intermediate/intermediate-03';

export const intermediateTrack: TrackInput = {
  id: 'intermediate',
  order: 2,
  name: 'Intermediate',
  label: 'Intermediate',
  eligibleStartingPoint: true,
  levels: [...intermediateCluster01, ...intermediateCluster02, ...intermediateCluster03],
};
