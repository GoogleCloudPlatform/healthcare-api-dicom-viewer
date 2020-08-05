/* eslint-disable max-len */
import React from 'react';
import {render, fireEvent, screen, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import * as api from '../../src/api.js';
import Viewer from '../../src/components/viewer.js';
import {DICOM_TAGS} from '../../src/dicomValues.js';
import '../../src/cornerstonesetup.js';

// Set up mock functions for api calls and cornerstoneJS
jest.mock('../../src/api.js');

// Ensure the makeCancelable function is NOT mocked as it is needed
// for the viewer component to function properly
const {makeCancelable} = jest.requireActual('../../src/api.js');
api.makeCancelable = makeCancelable;

// fetchInstances will resolve 3 fake instances not in order
api.fetchMetadata.mockResolvedValue([
  {
    [DICOM_TAGS.INSTANCE_UID]: {
      Value: ['instance2-UID'],
    },
    [DICOM_TAGS.INSTANCE_NUMBER]: {
      Value: [2],
    },
    [DICOM_TAGS.NUM_COLUMNS]: {
      Value: [3],
    },
    [DICOM_TAGS.NUM_ROWS]: {
      Value: [3],
    },
  },
  {
    [DICOM_TAGS.INSTANCE_UID]: {
      Value: ['instance1-UID'],
    },
    [DICOM_TAGS.INSTANCE_NUMBER]: {
      Value: [1],
    },
    [DICOM_TAGS.NUM_COLUMNS]: {
      Value: [3],
    },
    [DICOM_TAGS.NUM_ROWS]: {
      Value: [3],
    },
  },
  {
    [DICOM_TAGS.INSTANCE_UID]: {
      Value: ['instance3-UID'],
    },
    [DICOM_TAGS.INSTANCE_NUMBER]: {
      Value: [3],
    },
    [DICOM_TAGS.NUM_COLUMNS]: {
      Value: [3],
    },
    [DICOM_TAGS.NUM_ROWS]: {
      Value: [3],
    },
  },
]);

// fetchDicomFile will mock 9 "pixel values" for a fake 3x3 dicom image
api.fetchDicomFile.mockResolvedValue(new Int16Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));

test('Start button is disabled until instance metadata is fetched', async () => {
  render(
      <Viewer
        project="project"
        location="location"
        dataset="dataset"
        dicomStore="dicomStore"
        study={{[DICOM_TAGS.STUDY_UID]: {Value: ['study-uid']}}}
        series={{[DICOM_TAGS.SERIES_UID]: {Value: ['series-uid']}}} />,
  );

  // Ensure start button is disabled and eventually becomes enabled
  expect(screen.getByRole('button')).toHaveAttribute('disabled');
  await waitFor(() => expect(screen.getByRole('button')).not.toHaveAttribute('disabled'));
});

test('Instances display in correct order', async (done) => {
  const correctInstanceOrder = [
    'instance1-UID',
    'instance2-UID',
    'instance3-UID',
  ];

  // Override the onImageReady function in the viewer
  // to check that images are being loaded in correct order
  Viewer.prototype.onImageReady = function(image) {
    const instanceUID = image.imageId.split('/').pop();
    expect(instanceUID).toEqual(correctInstanceOrder.shift());
    if (correctInstanceOrder.length == 0) {
      done();
    }
  };

  render(
      <Viewer
        project="project"
        location="location"
        dataset="dataset"
        dicomStore="dicomStore"
        study={{[DICOM_TAGS.STUDY_UID]: {Value: ['study-uid']}}}
        series={{[DICOM_TAGS.SERIES_UID]: {Value: ['series-uid']}}} />,
  );

  // Wait for start button to be enabled and then click it
  await waitFor(() => expect(screen.getByRole('button')).not.toHaveAttribute('disabled'));
  fireEvent.click(screen.getByRole('button'));
});
