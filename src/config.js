/** @module config */
/* eslint-disable max-len */

/** Client ID for this application in Google Cloud
 * @constant {string} */
const CLIENT_ID = 'YOUR_CLIENT_ID'; /** Fill this in with your own client-id */

/** Base url for the cloud resource manager api endpoints
 * @constant {string}
 * @default */
const CLOUD_RESOURCE_MANAGER_API_BASE = 'https://cloudresourcemanager.googleapis.com';

/** Base url for the healthcare api endpoints
 * @constant {string}
 * @default */
const HEALTHCARE_API_BASE = 'https://healthcare.googleapis.com';

export {
  CLIENT_ID,
  CLOUD_RESOURCE_MANAGER_API_BASE,
  HEALTHCARE_API_BASE,
};
