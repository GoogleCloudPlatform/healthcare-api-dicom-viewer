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

/** @module dicomValues */

/** Content type to use for fetching DICOM files */
const DICOM_CONTENT_TYPE = 'multipart/related;' +
    'type="application/octet-stream";' +
    'transfer-syntax=1.2.840.10008.1.2.1';

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
  NUM_FRAMES: '00280008',
};

export {
  DICOM_CONTENT_TYPE,
  DICOM_TAGS,
};
