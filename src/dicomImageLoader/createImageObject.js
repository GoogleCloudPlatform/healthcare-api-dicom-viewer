import * as dicomParser from 'dicom-parser';

/**
 * Creates a cornerstone image object from a DICOM P10 file
 * @param {string} imageId The imageId associated with this dicom image
 * @param {Uint8Array} dicomByteArray Byte array of P10 DICOM contents
 * @return {Object} Cornerstone image object
 */
const createImageObjectFromDicom = (imageId, dicomByteArray) => {
  // Parse dicom data to retrieve image values
  const dataSet = dicomParser.parseDicom(dicomByteArray);

  const width = dataSet.uint16('x00280011');
  const height = dataSet.uint16('x00280010');

  const photoInterp = dataSet.string('x00280004');
  const invert = photoInterp == 'MONOCHROME1' ? true: false;

  // Get pixel data from dicomParser
  const pixelDataElement = dataSet.elements.x7fe00010;
  const pixelData = new Int16Array(dataSet.byteArray.buffer,
      pixelDataElement.dataOffset);

  const getPixelData = () => pixelData;

  // Calculate min pixel value if not provided in dicom file
  let minPixelValue = dataSet.int16('x00280106');
  if (!minPixelValue) {
    minPixelValue = pixelData[0];
    for (let i = 1; i < pixelData.length; i++) {
      if (pixelData[i] < minPixelValue) {
        minPixelValue = pixelData[i];
      }
    }
  }

  // Calculate max pixel value if not provided in dicom file
  let maxPixelValue = dataSet.int16('x00280107');
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
    sizeInBytes: width * height,
  };

  return image;
};

export default createImageObjectFromDicom;