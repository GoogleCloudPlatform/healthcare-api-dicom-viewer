/** @module api */
import * as auth from './auth.js';
import {
  CLOUD_RESOURCE_MANAGER_API_BASE,
  HEALTHCARE_API_BASE,
  HEALTHCARE_BETA_API_BASE,
} from './config.js';

/**
 * Fetches a url using a stored access token, signing the user in
 * if no access token exists
 * @param {RequestInfo} input The request info to fetch
 * @param {RequestInit=} init The request init object
 * @return {Promise<Response>} Fetch response object
 */
const authenticatedFetch = async (input, init) => {
  const accessToken = auth.getAccessToken();
  if (accessToken) {
    if (init) {
      // Add authorization headers to given init object
      if (init.headers) {
        init.headers['Authorization'] = `Bearer ${accessToken}`;
      } else {
        init.headers = {
          'Authorization': `Bearer ${accessToken}`,
        };
      }
    } else {
      // Initialize init object if none was given
      init = {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      };
    }

    const response = await fetch(input, init);

    if (!response.ok) {
      if (response.status == 401) {
        auth.signInToGoogle();
      } else {
        throw new Error(response.json());
      }
    }

    return response;
  } else {
    auth.signInToGoogle();
  }
};

/**
 * Fetches a list of the users google cloud projects recursively
 * @param {string=} pageToken Page token to use for the request
 * @param {Array=} projects Projects fetched from a previous iteration
 * @return {Promise<Array<string>>} List of projects available to the user
 */
const fetchProjects = async (pageToken, projects) => {
  const endpoint = '/v1/projects' +
      (pageToken ? `?pageToken=${pageToken}` : '');
  const response =
    await authenticatedFetch(CLOUD_RESOURCE_MANAGER_API_BASE + endpoint);
  const data = await response.json();

  // If next page token is present in the response, fetch again and
  // pass along the current project list
  if (data.nextPageToken) {
    if (projects) {
      return fetchProjects(data.nextPageToken,
          [...projects, ...data.projects]);
    }
    return fetchProjects(data.nextPageToken, data.projects);
  }

  // Return a list of project Id's
  if (projects) {
    return [...projects, ...data.projects].map((project) => project.projectId);
  }
  return data.projects.map((project) => project.projectId);
};

/**
 * Fetches a list of the possible locations for a given project
 * @param {string} projectId Project id to search locations for
 * @return {Promise<Array<string>>} List of locations available for project
 */
const fetchLocations = async (projectId) => {
  const endpoint = `/v1beta1/projects/${projectId}/locations`;
  const response =
    await authenticatedFetch(HEALTHCARE_BETA_API_BASE + endpoint);
  const data = await response.json();

  // Return a list of location Id's
  return data.locations.map((location) => location.locationId);
};

/**
 * Fetches a list of the datasets in a project location
 * @param {string} projectId Project id
 * @param {string} location Location
 * @return {Promise<Array<string>>} List of datasets available
 */
const fetchDatasets = async (projectId, location) => {
  // TODO: Handle page tokens
  const endpoint = `/v1/projects/${projectId}/locations/${location}/datasets`;
  const response =
    await authenticatedFetch(HEALTHCARE_API_BASE + endpoint);
  const data = await response.json();

  // Return a list of datasets by only using content of string after last '/'
  return data.datasets.map((dataset) => dataset.name.split('/').slice(-1)[0]);
};

/**
 * Fetches a list of the dicomStores in a dataset
 * @param {string} projectId Project ID
 * @param {string} location Location
 * @param {string} dataset Dataset
 * @return {Promise<Array<string>>} List of dicomStores available
 */
const fetchDicomStores = async (projectId, location, dataset) => {
  // TODO: Handle page tokens
  const endpoint =
    `/v1/projects/${projectId}/locations/${location}/datasets/${dataset}` +
    `/dicomStores`;
  const response =
    await authenticatedFetch(HEALTHCARE_API_BASE + endpoint);
  const data = await response.json();

  // Return a list of dicomStores by only using content of string after last '/'
  return data.dicomStores.map((dicomStore) =>
    dicomStore.name.split('/').slice(-1)[0]);
};

/**
 * Fetches a list of studies in a dicom store
 * @param {string} projectId Project ID
 * @param {string} location Location
 * @param {string} dataset Dataset
 * @param {string} dicomStore Dicom Store
 * @return {Promise<Array<Object>>} List of studies in the dicom store
 */
const fetchStudies =
async (projectId, location, dataset, dicomStore) => {
  const endpoint =
    `/v1/projects/${projectId}/locations/${location}/datasets/${dataset}` +
    `/dicomStores/${dicomStore}/dicomWeb/studies`;
  const response =
    await authenticatedFetch(HEALTHCARE_API_BASE + endpoint);
  const data = await response.json();

  return data;
};

/**
 * Fetches a list of series in a study
 * @param {string} projectId Project ID
 * @param {string} location Location
 * @param {string} dataset Dataset
 * @param {string} dicomStore Dicom Store
 * @param {string} studyId Study UID
 * @return {Promise<Array<Object>>} List of series in the study
 */
const fetchSeries =
async (projectId, location, dataset, dicomStore, studyId) => {
  const endpoint =
    `/v1/projects/${projectId}/locations/${location}/datasets/${dataset}` +
    `/dicomStores/${dicomStore}/dicomWeb/studies/${studyId}/series`;
  const response =
    await authenticatedFetch(HEALTHCARE_API_BASE + endpoint);
  const data = await response.json();

  return data;
};

/**
 * Fetches a list of instances in a given
 *    series
 * @param {string} projectId Project ID
 * @param {string} location Location
 * @param {string} dataset Dataset
 * @param {string} dicomStore Dicom Store
 * @param {string} studyId Study UID
 * @param {string} seriesId Series UID
 * @return {Promise<Object[]>} List of instances in the series
 */
const fetchInstances =
  async (projectId, location, dataset, dicomStore, studyId, seriesId) => {
    const endpoint =
      `/v1/projects/${projectId}/locations/${location}/datasets` +
      `/${dataset}/dicomStores/${dicomStore}/dicomWeb/studies/${studyId}` +
      `/series/${seriesId}/instances`;
    const response =
      await authenticatedFetch(HEALTHCARE_API_BASE + endpoint);
    const data = await response.json();

    return data;
  };

/**
 * Fetches a dicom file from a given url using Google Authentication
 * @param {string} url Url for the dicom file
 * @return {Uint8Array} Byte array of DICOM P10 contents
 */
const fetchDicomFile = async (url) => {
  const response = await authenticatedFetch(url, {
    headers: {
      'Accept': 'multipart/related;' +
                'type="application/dicom";' +
                'transfer-syntax=1.2.840.10008.1.2.1',
    },
  });

  let arrayBuffer = await response.arrayBuffer();
  // Strip multipart header from arrayBuffer
  arrayBuffer = arrayBuffer.slice(136, arrayBuffer.byteLength - 68);
  return new Uint8Array(arrayBuffer);
};

/**
 * @typedef {Object} CancelablePromise
 * @property {Promise} promise The promise object
 * @property {function(): undefined} cancel Function to cancel the promise
 */

/**
 * Turns a promise into a cancelable promise to avoid
 * setting state after component unmounts
 * @param {Promise} promise Promise to make cancelable
 * @return {CancelablePromise} The cancelable promise
 */
const makeCancelable = (promise) => {
  let hasCanceled_ = false;

  const wrappedPromise = new Promise((resolve, reject) => {
    promise.then(
        // eslint-disable-next-line prefer-promise-reject-errors
        (val) => hasCanceled_ ? reject({isCanceled: true}) : resolve(val),
        // eslint-disable-next-line prefer-promise-reject-errors
        (error) => hasCanceled_ ? reject({isCanceled: true}) : reject(error),
    );
  });

  return {
    promise: wrappedPromise,
    cancel() {
      hasCanceled_ = true;
    },
  };
};

export {
  authenticatedFetch, fetchProjects, fetchLocations, fetchDatasets,
  fetchDicomStores, fetchStudies, fetchSeries, fetchInstances, fetchDicomFile,
  makeCancelable,
};
