import * as cornerstone from 'cornerstone-core';
import * as dicomImageLoader from './dicomImageLoader/dicomImageLoader.js';

cornerstone.registerImageLoader('dicomImageLoader', dicomImageLoader.loadImage);
dicomImageLoader.configure({
  useWebworkersToFetch: true,
  useWebworkersToParse: false,
});
