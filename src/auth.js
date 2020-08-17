/** @module Auth */
import {CLIENT_ID} from './config.js';

let GoogleAuth;
const SCOPE = [
  'https://www.googleapis.com/auth/cloud-healthcare',
  'https://www.googleapis.com/auth/cloudplatformprojects.readonly',
].join(' ');
const DISCOVERY_DOCS = [
  'https://cloudresourcemanager.googleapis.com/$discovery/rest?version=v1',
  'https://healthcare.googleapis.com/$discovery/rest?version=v1beta1',
];

/**
 * Initialize the gapi.client object
 */
const initClient = async () => {
  return new Promise((resolve, reject) => {
    gapi.load('client:auth2', () => {
      const redirectUri = window.location.origin;

      gapi.client.init({
        'clientId': CLIENT_ID,
        'scope': SCOPE,
        'discoveryDocs': DISCOVERY_DOCS,
        'ux_mode': 'redirect',
        'redirect_uri': redirectUri,
      }).then(() => {
        GoogleAuth = gapi.auth2.getAuthInstance();
        resolve();
      }).catch((error) => {
        reject(error);
      });
    });
  });
};

/**
 * Signs user in with GoogleAuth
 * @return {Promise<GoogleUser>} Promise that resolves with
 *    the Google User that was signed in
*/
const signIn = () => GoogleAuth.signIn();

/**
 * Signs user in with GoogleAuth
 * @return {Promise} Promise that resolves when user is
 *    signed out
 */
const signOut = () => GoogleAuth.signOut();

/**
 * Checks if user is signed in or not
 * @return {boolean} User signed in status
 */
const isSignedIn = () => GoogleAuth.isSignedIn.get();

/**
 * Sets the function to run when user's signed in state changes
 * @param {function(boolean): any} callback Called when
 *    signed in state changes
 */
const onSignedInChanged = (callback) => {
  GoogleAuth.isSignedIn.listen(callback);
};

/**
 * Retrives the access token from the GoogleAuth client
 * @return {string} Access token (or null if none present)
 */
const getAccessToken = () => {
  if (isSignedIn()) {
    return GoogleAuth.currentUser.get()
        .getAuthResponse().access_token;
  }
  return null;
};

const Auth = {
  initClient,
  signIn,
  signOut,
  isSignedIn,
  onSignedInChanged,
  getAccessToken,
};

export default Auth;
