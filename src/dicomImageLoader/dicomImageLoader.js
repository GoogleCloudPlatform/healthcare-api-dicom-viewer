/** @module dicomImageLoader */
import * as api from '../api.js';
import createImageObjectFromDicom from './createImageObject.js';
import DicomWorkerManager from './webworkers/dicomWorkerManager.js';

const defaultConfig = {
  useWebworkersToFetch: false,
  useWebworkersToParse: false,
};
const config = Object.assign({}, defaultConfig);
const workerManager = new DicomWorkerManager();

/**
 * Change configuration value for the dicomImageLoader
 * @param {Object} newConfig New config values to change
 * @param {boolean=} newConfig.useWebworkersToFetch Whether or not webworkers
 *    should be used to fetch requests
 * @param {boolean=} newConfig.useWebworkersToParse Whether or not webworkers
 *    should be used to create image objects from dicom
 */
const configure = (newConfig) => {
  Object.assign(config, defaultConfig, newConfig);
};

/**
 * Cornerstone image loader for viewing dicom files from Google Healthcare Api
 * @param {string} imageId Url for the dicom file
 * @return {{promise: Promise<Object>}} Object containing promise for
 * cornerstone
 */
const loadImage = (imageId) => {
  const url = imageId.replace('dicomImageLoader', 'https');

  const promise = new Promise((resolve, reject) => {
    // Promise for fetching dicom file from url
    let fetchDicomPromise;

    // Fetch with or without webworkers
    if (config.useWebworkersToFetch) {
      fetchDicomPromise = workerManager.fetchDicom(url);
    } else {
      fetchDicomPromise = api.fetchDicomFile(url);
    }

    fetchDicomPromise.then((byteArray) => {
      // Create cornerstone image object with or without webworkers
      if (config.useWebworkersToParse) {
        workerManager.createImage(imageId, byteArray).then((image) => {
          resolve(image);
        }).catch((error) => reject(error));
      } else {
        const image = createImageObjectFromDicom(imageId, byteArray);
        resolve(image);
      }
    }).catch((error) => reject(error));
  });


  return {
    promise,
  };
};

export {loadImage, configure, createImageObjectFromDicom};
