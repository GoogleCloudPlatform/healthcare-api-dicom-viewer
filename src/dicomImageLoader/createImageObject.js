import * as dicomParser from 'dicom-parser';

/**
 * Creates a cornerstone image object from a DICOM P10 file
 * @param {string} imageId The imageId associated with this dicom image
 * @param {Uint8Array} dicomByteArray Byte array of P10 DICOM contents
 * @return {Object} Cornerstone image object
 */
const createImageObjectFromDicom = (imageId, dicomByteArray) => {
  // Parse dicom data to retrieve image values
  // const dataSet = dicomParser.parseDicom(dicomByteArray);

  const width = 512;
  const height = 512;

  // const photoInterp = dataSet.string('x00280004');
  const invert = false;

  // // Get pixel data from dicomParser
  // const pixelDataElement = dataSet.elements.x7fe00010;
  // const pixelData = new Int16Array(dataSet.byteArray.buffer,
  //     pixelDataElement.dataOffset);
  
  // console.log(pixelData);

  const getPixelData = () => dicomByteArray;

  // Calculate min pixel value if not provided in dicom file
  let minPixelValue;
  if (!minPixelValue) {
    minPixelValue = dicomByteArray[0];
    for (let i = 1; i < dicomByteArray.length; i++) {
      if (dicomByteArray[i] < minPixelValue) {
        minPixelValue = dicomByteArray[i];
      }
    }
  }

  // Calculate max pixel value if not provided in dicom file
  let maxPixelValue;
  if (!maxPixelValue) {
    maxPixelValue = dicomByteArray[0];
    for (let i = 1; i < dicomByteArray.length; i++) {
      if (dicomByteArray[i] > maxPixelValue) {
        maxPixelValue = dicomByteArray[i];
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
