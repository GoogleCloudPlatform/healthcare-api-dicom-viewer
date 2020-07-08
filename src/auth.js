/** @module auth */
import {CLIENT_ID} from './config.js';

const REDIRECT_URI = location.href;

/**
 * Redirect to Google OAuth2 sign-in page
 */
const signInToGoogle = () => {
  // Google's OAuth 2.0 endpoint for requesting an access token
  const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

  // Create element to open OAuth 2.0 endpoint in new window.
  const form = document.createElement('form');
  form.setAttribute('method', 'GET'); // Send as a GET request.
  form.setAttribute('action', oauth2Endpoint);

  // Parameters to pass to OAuth 2.0 endpoint.
  const params = {
    'client_id': CLIENT_ID,
    'redirect_uri': REDIRECT_URI,
    'scope': 'https://www.googleapis.com/auth/cloud-healthcare https://www.googleapis.com/auth/cloud-platform',
    'include_granted_scopes': 'true',
    'response_type': 'token',
  };

  // Add form parameters as hidden input values.
  for (const p in params) {
    if ({}.hasOwnProperty.call(params, p)) {
      const input = document.createElement('input');
      input.setAttribute('type', 'hidden');
      input.setAttribute('name', p);
      input.setAttribute('value', params[p]);
      form.appendChild(input);
    }
  }

  // Add form to page and submit it to open the OAuth 2.0 endpoint.
  document.body.appendChild(form);
  form.submit();
};

/**
 * Removes access token from local storage
 */
const signOut = () => {
  localStorage.removeItem('oauth2-params');
};

/**
 * Checks if the current url was redirected from Google Authentication
 * and stores the access token if so
 */
const storeOAuthUrlParams = () => {
  // Parse query string to see if page request is coming from OAuth 2.0 server.
  const fragmentString = location.hash.substring(1);
  const params = {};
  const regex = /([^&=]+)=([^&]*)/g; let m;
  while (m = regex.exec(fragmentString)) {
    params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
  }
  if (Object.keys(params).length > 0) {
    localStorage.setItem('oauth2-params', JSON.stringify(params));

    // If access was denied, request login again
    if (params.error) {
      signInToGoogle();
    }
  }

  // Clear parameters from url bar once stored
  let currentUrl = location.href;
  currentUrl = currentUrl.split('#')[0];
  window.history.replaceState({}, document.title, currentUrl);
};

/**
 * Retrives the access token from local storage
 * @return {string} Access token (or null if none present)
 */
const getAccessToken = () => {
  if (typeof WorkerGlobalScope !== 'undefined' &&
      self instanceof WorkerGlobalScope) {
    // If called by a webworker, check if access token
    // has been stored in global self
    return self.accessToken;
  }


  const params = JSON.parse(localStorage.getItem('oauth2-params'));
  if (params && params['access_token']) {
    return params['access_token'];
  }
  return null;
};

export {signInToGoogle, signOut, storeOAuthUrlParams, getAccessToken};

// Run on every page load
if (typeof WorkerGlobalScope === 'undefined' ||
   !self instanceof WorkerGlobalScope) {
  storeOAuthUrlParams();
}
