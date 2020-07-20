import React, {useState, useEffect} from 'react';
import {Typography, Button, TextField} from '@material-ui/core';
import * as auth from './auth.js';
import * as api from './api.js';

/**
 * Initial Component to contain the app
 * @return {ReactComponent} <App/>
 */
export default function App() {
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [url, setUrl] = useState('');
  const [fetchResult, setFetchResult] = useState('');
  const [isError, setIsError] = useState(false);

  // When this react component is mounted, load GoogleAuth
  // library and initialize listeners
  useEffect(() => {
    // Load GooglAuth library on mount
    gapi.load('client:auth2', auth.initClient);
    auth.onInitialized(() => {
      setIsAuthInitialized(true);

      // Set up listener to listen to signed in state changes
      auth.onSignedInChanged((isSignedIn) => {
        setIsSignedIn(isSignedIn);
        setAccessToken(auth.getAccessToken());
      });

      // Check if user is already signed in on page load
      setIsSignedIn(auth.isSignedIn());
      setAccessToken(auth.getAccessToken());
    });
  }, []);

  const signIn = () => {
    auth.signIn();
  };

  const signOut = () => {
    auth.signOut();
  };

  const makeAuthenticatedFetch = async () => {
    if (url) {
      try {
        const result = await api.authenticatedFetch(url);
        setFetchResult(await result.text());
        setIsError(false);
      } catch (error) {
        console.log(error);
        setFetchResult(error.message);
        setIsError(true);
      }
    }
  };

  return (
    <div style={{padding: 20, display: isAuthInitialized ? 'block' : 'none'}}>
      <Typography variant="h4">
        Performant DICOM Viewer
      </Typography>
      {!isSignedIn ?
        <Button
          variant="contained"
          color="primary"
          onClick={signIn}>Sign in</Button> :
        <Button
          variant="contained"
          color="primary"
          onClick={signOut}>Sign out</Button>}
      <Typography variant="body1">
        Access Token: {accessToken}
      </Typography>
      <TextField
        label="URL"
        onChange={(e) => setUrl(e.target.value)}
        fullWidth={true}/><br/><br/>
      <Button
        variant="contained"
        color="primary"
        onClick={makeAuthenticatedFetch}
        disabled={!url}>Make Authenticated Request</Button>
      <Typography color={isError ? 'error' : 'initial'}>
        {fetchResult}
      </Typography>
    </div>
  );
}
