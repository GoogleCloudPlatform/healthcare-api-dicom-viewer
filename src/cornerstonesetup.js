import * as cornerstone from 'cornerstone-core';
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import * as dicomParser from 'dicom-parser';
import * as auth from './auth.js';
import * as dicomImageLoader from './dicomImageLoader.js';

cornerstone.registerImageLoader('dicomImageLoader', dicomImageLoader.loadImage);
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
cornerstoneWADOImageLoader.configure({
  beforeSend: (xhr) => {
    const accessToken = auth.getAccessToken();
    if (accessToken) {
      xhr.setRequestHeader('Accept', 'application/dicom; transfer-syntax=*');
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    } else {
      auth.signInToGoogle();
    }
  },
});

cornerstoneWADOImageLoader.webWorkerManager.initialize();
