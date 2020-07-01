import * as cornerstone from 'cornerstone-core';
import * as dicomImageLoader from './dicomImageLoader/dicomImageLoader.js';
import * as cornerstoneWebImageLoader from 'cornerstone-web-image-loader';
import * as auth from './auth.js';

cornerstoneWebImageLoader.external.cornerstone = cornerstone;
cornerstoneWebImageLoader.configure({
  beforeSend: function(xhr) {
    const accessToken = auth.getAccessToken();
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('Accept', `image/jpeg`);
  }
});
cornerstone.registerImageLoader('dicomImageLoader', dicomImageLoader.loadImage);
dicomImageLoader.configure({
  useWebworkersToFetch: false,
  useWebworkersToParse: false,
});
