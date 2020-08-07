/** @module dicomValues */

/** Content type to use for fetching DICOM files */
const DICOM_CONTENT_TYPE = 'multipart/related;' +
    'type="application/octet-stream";' +
    'transfer-syntax=1.2.840.10008.1.2.1';

/** Byte length of the top boundary for multipart content types
 * @constant {number} */
const DCM_BOUNDARY_TOP_BYTE_LEN = 143;

/** Byte length of the bottom boundary for multipart content types
 * @constant {number} */
const DCM_BOUNDARY_BOTTOM_BYTE_LEN = 68;

const DICOM_TAGS = {
  STUDY_UID: '0020000D',
  SERIES_UID: '0020000E',
  INSTANCE_UID: '00080018',
  INSTANCE_NUMBER: '00200013',
  PATIENT_ID: '00100020',
  MODALITY: '00080060',
  NUM_ROWS: '00280010',
  NUM_COLUMNS: '00280011',
  PHOTO_INTERP: '00280004',
  MIN_PIXEL_VAL: '00280106',
  MAX_PIXEL_VAL: '00280107',
};

export {
  DICOM_CONTENT_TYPE,
  DCM_BOUNDARY_TOP_BYTE_LEN,
  DCM_BOUNDARY_BOTTOM_BYTE_LEN,
  DICOM_TAGS,
};
