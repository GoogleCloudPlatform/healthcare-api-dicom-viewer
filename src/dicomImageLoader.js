/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** @module dicomImageLoader */
import * as api from './api.js';
import {DICOM_TAGS} from './dicomValues.js';
import {IMAGE_LOADER_PREFIX} from './config.js';

/** Stores metaData for each imageId
 * @type {Object.<string, object>} */
const metaDataDict = {};

/**
 * Sets metaData value for a specific instance imageId
 * @param {string} imageId The imageId for the instance
 * @param {Object} metaData The metaData for the instance
 */
const setMetadata = (imageId, metaData) => {
  // Map the Value object to metaData.
  const mappedMetaData = {};
  for (const key in metaData) {
    if (metaData.hasOwnProperty(key)) {
      const value = metaData[key].Value;
      if (value) {
        // If value is an array with one value, simply store the
        // value, otherwise store the whole array
        if (value.length == 1) {
          mappedMetaData[key] = value[0];
        } else {
          mappedMetaData[key] = value;
        }
      }
    }
  }
  metaDataDict[imageId] = mappedMetaData;
};

/**
 * Creates a cornerstone image object from metadata and pixel data
 * @param {string} imageId The imageId associated with this dicom image
 * @param {Int16Array} pixelData Pixel data array of DICOM image
 * @return {Object} Cornerstone image object
 */
const createImageObjectFromDicom = (imageId, pixelData) => {
  // Retrieve metaData for this instance
  const metaData = metaDataDict[imageId];

  const height = metaData[DICOM_TAGS.NUM_ROWS];
  const width = metaData[DICOM_TAGS.NUM_COLUMNS];

  const photoInterp = metaData[DICOM_TAGS.PHOTO_INTERP];
  const invert = photoInterp == 'MONOCHROME1' ? true: false;

  const getPixelData = () => pixelData;

  // Calculate min pixel value if not provided in dicom file
  let minPixelValue = metaData[DICOM_TAGS.MIN_PIXEL_VAL];
  if (!minPixelValue) {
    minPixelValue = pixelData[0];
    for (let i = 1; i < pixelData.length; i++) {
      if (pixelData[i] < minPixelValue) {
        minPixelValue = pixelData[i];
      }
    }
  }

  // Calculate max pixel value if not provided in dicom file
  let maxPixelValue = metaData[DICOM_TAGS.MAX_PIXEL_VAL];
  if (!maxPixelValue) {
    maxPixelValue = pixelData[0];
    for (let i = 1; i < pixelData.length; i++) {
      if (pixelData[i] > maxPixelValue) {
        maxPixelValue = pixelData[i];
      }
    }
  }

  // Construct image object from above values
  const image = {
    imageId: imageId,
    minPixelValue: minPixelValue,
    maxPixelValue: maxPixelValue,
    slope: 1.0,
    intercept: 0,
    windowCenter: (maxPixelValue + minPixelValue) / 2,
    windowWidth: maxPixelValue - minPixelValue,
    getPixelData: getPixelData,
    rows: height,
    columns: width,
    height: height,
    width: width,
    color: false,
    columnPixelSpacing: 1.0,
    rowPixelSpacing: 1.0,
    invert: invert,
    sizeInBytes: width * height * 2,
  };

  return image;
};

/**
 * Cornerstone image loader for viewing dicom files from Google Healthcare Api
 * @param {string} imageId Url for the dicom file
 * @return {{promise: Promise<Object>}} Object containing promise for
 *    cornerstone
 */
const loadImage = (imageId) => {
  const url = imageId.replace(IMAGE_LOADER_PREFIX, 'https');

  const promise = new Promise((resolve, reject) => {
    api.fetchDicomFile(url)
        .then((byteArray) => {
          const image = createImageObjectFromDicom(imageId, byteArray);
          resolve(image);
        })
        .catch((error) => {
          reject(error);
        });
  });


  return {
    promise,
  };
};

export {loadImage, setMetadata};
