import {DICOM_TAGS} from '../dicomValues.js';

const swap16 = (val) => {
  return ((val & 0xff) << 8) | ((val >> 8) & 0xff);
};

const decodePixelData = (arrayBuffer, transferSyntax, metaData) => {
  switch (transferSyntax) {
    case '1.2.840.10008.1.2':
    case '1.2.840.10008.1.2.1':
      return decodeLittleEndian(arrayBuffer, metaData);
    case '1.2.840.10008.1.2.2':
      return decodeBigEndian(arrayBuffer, metaData);
  }
  throw new Error('This viewer currently does not support a transfer-' +
      `syntax of ${transferSyntax}`);
};

const decodeLittleEndian = (arrayBuffer, metaData) => {
  if (metaData[DICOM_TAGS.BITS_ALLOCATED] == 16) {
    // Handle 16 bit pixels

    // Check if pixels are stored as unsigned integers or signed integers
    if (metaData[DICOM_TAGS.PIXEL_REPRESENTATION] == 0) {
      return new Uint16Array(arrayBuffer);
    } else {
      return new Int16Array(arrayBuffer);
    }
  } else if (metaData[DICOM_TAGS.BITS_ALLOCATED] == 8 ||
        metaData[DICOM_TAGS.BITS_ALLOCATED] == 1) {
    // Handle 8 bit pixels

    // Check if pixels are stored as unsigned integers or signed integers
    if (metaData[DICOM_TAGS.PIXEL_REPRESENTATION] == 0) {
      return new Uint8Array(arrayBuffer);
    } else {
      return new Int8Array(arrayBuffer);
    }
  } else {
    throw new Error('This viewer currently only support DICOM images ' +
        'with 8 bit or 16 bit pixels');
  }
};

const decodeBigEndian = (arrayBuffer, metaData) => {
  if (metaData[DICOM_TAGS.BITS_ALLOCATED] == 16) {
    // Handle 16 bit pixels

    let pixelData;

    // Check if pixels are stored as unsigned integers or signed integers
    if (metaData[DICOM_TAGS.PIXEL_REPRESENTATION] == 0) {
      pixelData = new Uint16Array(arrayBuffer);
    } else {
      pixelData = new Int16Array(arrayBuffer);
    }

    // Swap bytes to account for big endian
    for (let i = 0; i < pixelData.length; i++) {
      pixelData[i] = swap16(pixelData[i]);
    }

    return pixelData;
  } else if (metaData[DICOM_TAGS.BITS_ALLOCATED] == 8 ||
        metaData[DICOM_TAGS.BITS_ALLOCATED] == 1) {
    // Handle 8 bit pixels

    // Check if pixels are stored as unsigned integers or signed integers
    if (metaData[DICOM_TAGS.PIXEL_REPRESENTATION] == 0) {
      return new Uint8Array(arrayBuffer);
    } else {
      return new Int8Array(arrayBuffer);
    }
  } else {
    throw new Error('This viewer currently only support DICOM images ' +
        'with 8 bit or 16 bit pixels');
  }
};

export default decodePixelData;
