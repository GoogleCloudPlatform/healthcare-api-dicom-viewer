import React, {useState, useEffect} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {Typography, Breadcrumbs, Link, Box} from '@material-ui/core';
import Auth from '../auth.js';
import * as api from '../api.js';
import SearchList from './searchlist.js';
import Viewer from './viewer.js';


const useStyles = makeStyles((theme) => ({
  root: {
    background: '#fff',
  },
}));

/**
 * Main page for the app
 * @return {ReactElement} <Main />
 */
export default function Main() {
  const classes = useStyles();

  // Declare state variables
  const [, setIsSignedIn] = useState(false);

  /**
   * @typedef {Object} NavigationState
   * @property {any[]} data
   * @property {React.Dispatch<React.SetStateAction<any[]>>} setData
   * @property {boolean} loading
   * @property {React.Dispatch<React.SetStateAction<boolean>>} setLoading
   * @property {any} selected
   * @property {React.Dispatch<any>} setSelected
   */
  /**
   * Function to generate state getters and setters for
   * a list of data, loading state, and selected data
   * @return {NavigationState} Object containing navigation state variables
   */
  const generateNavigationState = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null);
    return {
      data,
      setData,
      loading,
      setLoading,
      selected,
      setSelected,
    };
  };

  // Navigation state
  const projects = generateNavigationState();
  const locations = generateNavigationState();
  const datasets = generateNavigationState();
  const dicomStores = generateNavigationState();
  const studies = generateNavigationState();
  const series = generateNavigationState();

  /* On mount, check if user is signed in already or not
  by checking for an access token in local storage */
  useEffect(() => {
    // Load GooglAuth library on mount
    Auth.initClient().then(() => {
      // Set up listener to listen to signed in state changes
      Auth.onSignedInChanged((isSignedIn) => {
        setIsSignedIn(isSignedIn);
      });

      // Check if user is already signed in on page load
      const signedIn = Auth.isSignedIn();
      setIsSignedIn(signedIn);

      if (signedIn) {
        loadProjects();
      } else {
        signIn();
      }
    });
  }, []);

  /**
   * Signs the user in with Google
   */
  const signIn = () => {
    Auth.signIn();
  };

  /**
   * Generic flow for populating data into our react component
   * @param {function(): Promise<any>} apiCall Async function to retrieve data
   * @param {function(boolean): any} setLoading Function to set loading state
   * @param {function(any): any} setData Function to set data state
   */
  const loadData = async (apiCall, setLoading, setData) => {
    setLoading(true);
    try {
      const data = await apiCall();
      setData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Use loadData to generate functions for loading all state data
  const loadProjects = async () =>
    loadData(api.fetchProjects, projects.setLoading, projects.setData);

  const loadFilteredProjects = async (searchQuery) =>
    loadData(() => api.fetchProjects(searchQuery),
        projects.setLoading, projects.setData);

  const loadLocations = async (projectId) =>
    loadData(() => api.fetchLocations(projectId),
        locations.setLoading, locations.setData);

  const loadDatasets = async (projectId, location) =>
    loadData(() => api.fetchDatasets(projectId, location),
        datasets.setLoading, datasets.setData);

  const loadDicomStores = async (projectId, location, dataset) =>
    loadData(() => api.fetchDicomStores(projectId, location, dataset),
        dicomStores.setLoading, dicomStores.setData);

  const loadStudies = async (projectId, location, dataset, dicomStore) =>
    loadData(() => api.fetchStudies(projectId, location, dataset, dicomStore),
        studies.setLoading, studies.setData);

  const loadSeries =
      async (projectId, location, dataset, dicomStore, studyId) =>
    loadData(() => api.fetchSeries(projectId, location, dataset, dicomStore, studyId),
        series.setLoading, series.setData);

  // Methods for selecting a list item and loading data for the next list
  /** @param {number} index Index of project in project list */
  const selectProject = (index) => {
    const projectId = projects.data[index];
    projects.setSelected(projectId);
    loadLocations(projectId);
  };

  /** @param {number} index Index of location in location list */
  const selectLocation = (index) => {
    const locationId = locations.data[index];
    locations.setSelected(locationId);
    loadDatasets(projects.selected, locationId);
  };

  /** @param {number} index Index of dataset in dataset list */
  const selectDataset = (index) => {
    const dataset = datasets.data[index];
    datasets.setSelected(dataset);
    loadDicomStores(projects.selected, locations.selected, dataset);
  };

  /** @param {number} index Index of dicom dtore in dicom dtore list */
  const selectDicomStore = (index) => {
    const dicomStore = dicomStores.data[index];
    dicomStores.setSelected(dicomStore);
    loadStudies(projects.selected, locations.selected,
        datasets.selected, dicomStore);
  };

  /** @param {number} index Index of study in study list */
  const selectStudy = (index) => {
    const study = studies.data[index];
    studies.setSelected(study);
    loadSeries(projects.selected, locations.selected, datasets.selected,
        dicomStores.selected, study['0020000D'].Value[0]);
  };

  /** @param {number} index Index of series in series list */
  const selectSeries = (index) => {
    series.setSelected(series.data[index]);
  };

  /**
   * Resets all navigation state after and including the given
   * navigation state value
   * @param {('project'|'location'|'dataset'|
   * 'dicomStore'|'study'|'series')} navigationStr Navigation state to reset
   */
  const resetChainedState = (navigationStr) => {
    switch (navigationStr) {
      case 'project':
        projects.setSelected(null);
        projects.setData([]);
      case 'location':
        locations.setSelected(null);
        locations.setData([]);
      case 'dataset':
        datasets.setSelected(null);
        datasets.setData([]);
      case 'dicomStore':
        dicomStores.setSelected(null);
        dicomStores.setData([]);
      case 'study':
        studies.setSelected(null);
        studies.setData([]);
      case 'series':
        series.setSelected(null);
        series.setData([]);
    }
  };

  /** Clears all state after and including projects and reloads project list */
  const reloadProjects = () => {
    resetChainedState('project');
    loadProjects();
  };

  /** Clears all state after and including locations and reloads project list */
  const reloadLocations = () => {
    resetChainedState('location');
    loadLocations(projects.selected);
  };

  /** Clears all state after and including datasets and reloads dataset list */
  const reloadDatasets = () => {
    resetChainedState('dataset');
    loadDatasets(projects.selected, locations.selected);
  };

  /** Clears all state after and including dicom
   * stores and reloads dicom store list */
  const reloadDicomStores = () => {
    resetChainedState('dicomStore');
    loadDicomStores(projects.selected, locations.selected, datasets.selected);
  };

  /** Clears all state after and including studies and reloads study list */
  const reloadStudies = () => {
    resetChainedState('study');
    loadStudies(projects.selected, locations.selected,
        datasets.selected, dicomStores.selected);
  };

  /** Clears series state and reloads series list */
  const reloadSeries = () => {
    resetChainedState('series');
    loadSeries(projects.selected, locations.selected,
        datasets.selected, dicomStores.selected,
        studies.selected['0020000D'].Value[0]);
  };

  const handleProjectSearch = (searchQuery) => {
    loadFilteredProjects(searchQuery);
  };

  return (
    <div className={classes.root}>
      <Box m={2} display="flex" flexDirection="row">
        <Box flexGrow={1}>
          <Breadcrumbs>
            {projects.selected ?
              <Link color="inherit" href="#" onClick={reloadProjects}>
                {projects.selected}
              </Link> :
              <Typography color="textPrimary">
                Select Project
              </Typography>}
            {locations.selected ?
              <Link color="inherit" href="#" onClick={reloadLocations}>
                {locations.selected}
              </Link> :
              projects.selected ?
                <Typography color="textPrimary">
                  Select Location
                </Typography> : null}
            {datasets.selected ?
              <Link color="inherit" href="#" onClick={reloadDatasets}>
                {datasets.selected}
              </Link> :
              locations.selected ?
                <Typography color="textPrimary">
                  Select Dataset
                </Typography> : null}
            {dicomStores.selected ?
              <Link color="inherit" href="#" onClick={reloadDicomStores}>
                {dicomStores.selected}
              </Link> :
              datasets.selected ?
                <Typography color="textPrimary">
                  Select Dicom Store
                </Typography> : null}
            {studies.selected ?
              <Link color="inherit" href="#" onClick={reloadStudies}>
                {studies.selected['00100020'].Value[0]}
              </Link> :
              dicomStores.selected ?
                <Typography color="textPrimary">
                  Select Study
                </Typography> : null}
            {series.selected ?
              <Link color="inherit" href="#" onClick={reloadSeries}>
                {series.selected['00080060'].Value[0]}
              </Link> :
              studies.selected ?
                <Typography color="textPrimary">
                  Select Series
                </Typography> : null}
          </Breadcrumbs>
        </Box>
      </Box>

      {!projects.selected ?
        <SearchList
          items={projects.data}
          onClickItem={selectProject}
          isLoading={projects.loading}
          onSearch={handleProjectSearch}
          searchDelay={200} /> : null}
      {(projects.selected && !locations.selected) ?
        <SearchList
          items={locations.data}
          onClickItem={selectLocation}
          isLoading={locations.loading} /> : null}
      {(locations.selected && !datasets.selected) ?
        <SearchList
          items={datasets.data}
          onClickItem={selectDataset}
          isLoading={datasets.loading} /> : null}
      {(datasets.selected && !dicomStores.selected) ?
        <SearchList
          items={dicomStores.data}
          onClickItem={selectDicomStore}
          isLoading={dicomStores.loading} /> : null}
      {(dicomStores.selected && !studies.selected) ?
        <SearchList
          items={studies.data.map((study) => study['00100020'].Value[0])}
          onClickItem={selectStudy}
          isLoading={studies.loading} /> : null}
      {(studies.selected && !series.selected) ?
        <SearchList
          items={series.data.map((series) => series['00080060'].Value[0])}
          onClickItem={selectSeries}
          isLoading={series.loading} /> : null}
      {selectedSeries ?
        <Viewer
          project={projects.selected}
          location={locations.selected}
          dataset={datasets.selected}
          dicomStore={dicomStores.selected}
          study={studies.selected}
          series={series.selected} /> : null}
    </div >
  );
}
