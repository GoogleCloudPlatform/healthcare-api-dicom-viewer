/** @module api */
import * as auth from './auth.js';

/**
 * Fetches a url using a stored access token, signing the user in
 * if no access token exists
 * @param {string} url The url to fetch
 * @return {Promise<Response>} Fetch response object
 */
const authenticatedFetch = async (url) => {
  const accessToken = auth.getAccessToken();
  if (accessToken) {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status == 401) {
        auth.signIn();
      } else {
        throw new Error(await response.text());
      }
    }

    return response;
  } else {
    auth.signIn();
  }
};

// TODO: Add ability to filter by search query, to
//       later implement with navigation views
/**
 * Fetches a list of the user's google cloud projects recursively
 * @param {string=} pageToken Page token to use for the request
 * @param {Array=} projects Projects fetched from a previous iteration
 * @return {Promise<Array<string>>} List of projects available to the user
 */
const fetchProjects = async (pageToken) => {
  const response = await gapi.client.cloudresourcemanager.projects.list({
    pageToken,
  });
  const data = response.result;

  // If next page token is present in the response, fetch again and
  // concat result to the current project list
  if (data.nextPageToken) {
    if (pageToken) {
      return data.projects.concat(await fetchProjects(data.nextPageToken));
    }
    return data.projects.concat(await fetchProjects(data.nextPageToken))
        .map((project) => project.projectId);
  }

  if (pageToken) {
    return data.projects;
  }
  return data.projects.map((project) => project.projectId);
};

/**
 * Fetches a list of the possible locations for a given project
 * @param {string} projectId Project id to search locations for
 * @return {Promise<Array<string>>} List of locations available for project
 */
const fetchLocations = async (projectId) => {
  const data = await gapi.client.healthcare.projects.locations.list({
    name: `projects/${projectId}`,
  });

  // Return a list of location Id's
  return data.result.locations.map((location) => location.locationId);
};

/**
 * Fetches a list of the datasets in a project location
 * @param {string} projectId Project id
 * @param {string} location Location
 * @return {Promise<Array<string>>} List of datasets available
 */
const fetchDatasets = async (projectId, location) => {
  // TODO: Handle page tokens
  const data = await gapi.client.healthcare.projects.locations.datasets.list({
    parent: `projects/${projectId}/locations/${location}`,
  });

  // Return a list of datasets by only using content of string after last '/'
  return data.result.datasets
      .map((dataset) => dataset.name.split('/').slice(-1)[0]);
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
  const data = await gapi.client.healthcare.projects.locations.datasets
      .dicomStores.list({
        parent: `projects/${projectId}/locations/${location}/` +
          `datasets/${dataset}`,
      });

  // Return a list of dicomStores by only using content of string after last '/'
  return data.result.dicomStores.map((dicomStore) =>
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
  const data = await gapi.client.healthcare.projects.locations.datasets
      .dicomStores.searchForStudies({
        parent: `projects/${projectId}/locations/${location}/` +
    `datasets/${dataset}/dicomStores/${dicomStore}`,
        dicomWebPath: 'studies',
      });

  return data.result;
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
  const data = await gapi.client.healthcare.projects.locations.datasets
      .dicomStores.studies.searchForSeries({
        parent: `projects/${projectId}/locations/${location}/` +
    `datasets/${dataset}/dicomStores/${dicomStore}`,
        dicomWebPath: `studies/${studyId}/series`,
      });

  return data.result;
};

export {authenticatedFetch, fetchProjects, fetchLocations, fetchDatasets,
  fetchDicomStores, fetchStudies, fetchSeries};
