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

/** @module config */
/* eslint-disable max-len */

/** Client ID for this application in Google Cloud
 * @constant {string} */
const CLIENT_ID = 'YOUR_CLIENT_ID'; /** Fill this in with your own client-id */

/** Prefix to use on instance url's to inform cornerstoneJS to use our image loader
 * @constant {string} */
const IMAGE_LOADER_PREFIX = 'dicomImageLoader';

export {
  CLIENT_ID,
  IMAGE_LOADER_PREFIX,
};
