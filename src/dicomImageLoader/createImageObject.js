/** @module dicomImageLoader */
import {DICOM_TAGS} from '../dicomValues.js';
import decodePixelData from './decodePixelData.js';
import parseMultipart from '../parseMultipart.js';

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
 * @param {Object} dicomData Data returned from DICOM response
 * @param {ArrayBuffer} dicomData.pixelData Raw multipart pixel data
 * @param {string} dicomData.boundary Multipart response boundary
 * @param {Object.<string, object>=} _metaData Optional metaData to
 *    pass instead of using stored metaData, this allows Webworkers
 *    to pass in a metaData object
 * @return {Object} Cornerstone image object
 */
const createImageObjectFromDicom = (imageId, dicomData, _metaData) => {
  // Retrieve metaData for this instance
  const metaData = _metaData ? _metaData : metaDataDict[imageId];

  // Parse multipart header and boundary from arrayBuffer and
  // get transfer syntax
  const multipartData = parseMultipart(
      dicomData.pixelData,
      dicomData.boundary,
  );
  // Parse pixel data from raw bytes
  const pixelData = decodePixelData(
      multipartData.arrayBuffer,
      multipartData.transferSyntax,
      metaData,
  );

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

export default createImageObjectFromDicom;
export {setMetadata, metaDataDict};
