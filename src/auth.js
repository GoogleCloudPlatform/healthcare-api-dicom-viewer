/** @module auth */
import {CLIENT_ID} from './config.js';

// eslint-disable-next-line no-var
let GoogleAuth;
const SCOPE = 'https://www.googleapis.com/auth/cloud-healthcare https://www.googleapis.com/auth/cloud-platform';

let onInitializedCallback = () => {};

/**
 * Initialize the gapi.client object
 */
const initClient = () => {
  const redirectUri = window.location.origin;

  gapi.client.init({
    'clientId': CLIENT_ID,
    'scope': SCOPE,
    'ux_mode': 'redirect',
    'redirect_uri': redirectUri,
  }).then(function() {
    GoogleAuth = gapi.auth2.getAuthInstance();

    onInitializedCallback();
  });
};

/**
 * Sets the function to run when initClient finishes
 * @param {function(): any} callback Called after client initializes
 */
const onInitialized = (callback) => {
  onInitializedCallback = callback;
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
  if (isSignedIn) {
    return gapi.auth2.getAuthInstance().currentUser.get()
        .getAuthResponse().access_token;
  }
  return null;
};

export {initClient, onInitialized, signIn, signOut,
  isSignedIn, onSignedInChanged, getAccessToken};
