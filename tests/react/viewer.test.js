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
    [DICOM_TAGS.NUM_FRAMES]: {
      Value: [2], // instance2 is a multi-frame instance
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

test('Instances/frames display in correct order', async (done) => {
  const correctImageOrder = [
    {uid: 'instance1-UID', frame: '1'},
    {uid: 'instance2-UID', frame: '1'},
    {uid: 'instance2-UID', frame: '2'}, // instance2 has 2 frames, so it shows up twice
    {uid: 'instance3-UID', frame: '1'},
  ];

  // Override the onImageReady function in the viewer
  // to check that images are being loaded in correct order
  Viewer.prototype.onImageReady = function(image) {
    // imageId is a url, so split by '/' token
    const imageIdSplit = image.imageId.split('/');

    // Last element in imageId url is frame number (ex: .../frames/1)
    const frame = imageIdSplit[imageIdSplit.length - 1];

    // 3rd to last element in imageId url is instance uid
    // (ex: .../instances/INSTANCE_UID/frames/1)
    const instanceUID = imageIdSplit[imageIdSplit.length - 3];

    // Ensure images were returned in correct order
    const correctImage = correctImageOrder.shift();
    expect(instanceUID).toEqual(correctImage.uid);
    expect(frame).toEqual(correctImage.frame);

    if (correctImageOrder.length == 0) {
      /* After all images have been loaded, check that dicom
         image sequencer queues are empty, and there are no
         references to images in the sequencer to avoid mem leak */
      expect(this.dicomSequencer.instanceQueue.length).toBe(0);
      expect(this.dicomSequencer.fetchQueue.length).toBe(0);
      expect(Object.keys(this.dicomSequencer.loadedImages).length).toBe(0);
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

  // Click start button to begin fetching
  fireEvent.click(screen.getByRole('button'));
});
