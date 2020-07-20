import React, {useState, useEffect} from 'react';
import {Typography, Button, TextField} from '@material-ui/core';
import * as auth from './auth.js';
import * as api from './api.js';

/**
 * Initial Component to contain the app
 * @return {ReactComponent} <App/>
 */
export default function App() {
  const [accessToken, setAccessToken] = useState(null);
  const [url, setUrl] = useState('');
  const [fetchResult, setFetchResult] = useState('');
  const [isError, setIsError] = useState(false);

  // When this react component is mounted, check the
  // access token to see if user is signed in or not
  useEffect(() => {
    setAccessToken(auth.getAccessToken());
  }, []);

  const signIn = () => {
    auth.signInToGoogle();
  };

  const signOut = () => {
    auth.signOut();
    setAccessToken(auth.getAccessToken());
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
    <div style={{padding: 20}}>
      <Typography variant="h4">
        Performant DICOM Viewer
      </Typography>
      {!accessToken ?
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
