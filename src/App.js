import React, {useState, useEffect} from 'react';
import {Typography, Button, TextField} from '@material-ui/core';
import Auth from './auth.js';
import * as api from './api.js';

/**
 * Initial Component to contain the app
 * @return {ReactComponent} <App/>
 */
export default function App() {
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [url, setUrl] = useState('');
  const [fetchResult, setFetchResult] = useState('');
  const [isError, setIsError] = useState(false);

  const [project, setProject] = useState('');
  const [location, setLocation] = useState('');
  const [dataset, setDataset] = useState('');
  const [dicomStore, setDicomStore] = useState('');
  const [studyId, setStudyId] = useState('');

  // When this react component is mounted, load GoogleAuth
  // library and initialize listeners
  useEffect(() => {
    // Load Auth library on mount
    Auth.initClient().then(() => {
      setIsAuthInitialized(true);

      // Set up listener to listen to signed in state changes
      Auth.onSignedInChanged((isSignedIn) => {
        setIsSignedIn(isSignedIn);
      });

      // Check if user is already signed in on page load
      setIsSignedIn(Auth.isSignedIn());
    });
  }, []);

  const signIn = () => {
    Auth.signIn();
  };

  const signOut = () => {
    Auth.signOut();
  };

  const makeAuthenticatedFetch = async () => {
    if (url) {
      try {
        const result = await api.authenticatedFetch(url);
        setFetchResult(await result.text());
        setIsError(false);
      } catch (error) {
        setFetchResult(error.message);
        setIsError(true);
      }
    }
  };

  const makeApiCall = async (apiCall) => {
    try {
      const result = await apiCall();
      setFetchResult(JSON.stringify(result));
      setIsError(false);
    } catch (error) {
      setFetchResult(JSON.stringify(error.result));
      setIsError(true);
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
      <TextField
        label="URL"
        onChange={(e) => setUrl(e.target.value)}
        fullWidth={true}/><br/><br/>
      <Button
        variant="contained"
        color="primary"
        onClick={() => makeAuthenticatedFetch()}
        disabled={!url}>Make Authenticated Request</Button><br/><br/>
      <Button
        variant="contained"
        color="primary"
        onClick={() => makeApiCall(api.fetchProjects)}>
          fetch Projects
      </Button><br/>
      <TextField
        label="Project"
        onChange={(e) => setProject(e.target.value)}/><br/><br/>
      <Button
        variant="contained"
        color="primary"
        onClick={() => makeApiCall(() => api.fetchLocations(project))}>
          fetch Locations
      </Button><br/>
      <TextField
        label="Location"
        onChange={(e) => setLocation(e.target.value)}/><br/><br/>
      <Button
        variant="contained"
        color="primary"
        onClick={() => makeApiCall(() => api.fetchDatasets(project, location))}>
          fetch Datasets
      </Button><br/>
      <TextField
        label="Dataset"
        onChange={(e) => setDataset(e.target.value)}/><br/><br/>
      <Button
        variant="contained"
        color="primary"
        onClick={() => makeApiCall(() =>
          api.fetchDicomStores(project, location, dataset))}>
            fetch DicomStores
      </Button><br/>
      <TextField
        label="Dicom Store"
        onChange={(e) => setDicomStore(e.target.value)}/><br/><br/>
      <Button
        variant="contained"
        color="primary"
        onClick={() => makeApiCall(() =>
          api.fetchStudies(project, location, dataset, dicomStore))}>
            fetch Studies
      </Button><br/>
      <TextField
        label="StudyUID"
        onChange={(e) => setStudyId(e.target.value)}/><br/><br/>
      <Button
        variant="contained"
        color="primary"
        onClick={() => makeApiCall(() =>
          api.fetchSeries(project, location, dataset, dicomStore, studyId))}>
            fetch Series
      </Button><br/>
      <Typography variant="h4">Result</Typography>
      <Typography color={isError ? 'error' : 'initial'}>
        {fetchResult}
      </Typography>
    </div>
  );
}
