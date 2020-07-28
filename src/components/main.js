import React, {useState, useEffect} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {Typography, Breadcrumbs, Link, Box} from '@material-ui/core';
import Auth from '../auth.js';
import * as api from '../api.js';
import SearchList from './searchlist.js';


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

  const signIn = () => {
    Auth.signIn();
  };

  // Generic flow for populating data into our react component
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
    loadData(async () => {
      const data = await api.fetchStudies(projectId, location,
          dataset, dicomStore);

      // Add a new field "displayValue" to each study for the SearchList
      return data.map((study) => ({...study,
        displayValue: study['00100020'].Value[0]}));
    }, studies.setLoading, studies.setData);

  const loadSeries =
      async (projectId, location, dataset, dicomStore, studyId) =>
        loadData(async () => {
          const data = await api.fetchSeries(projectId, location,
              dataset, dicomStore, studyId);

          // Add a new field "displayValue" to each series for the SearchList
          return data.map((series) => ({...series,
            displayValue: series['00080060'].Value[0]}));
        }, series.setLoading, series.setData);

  // Methods for selecting a list item and loading data for the next list
  /** @param {string} projectId Project to select */
  const selectProject = (projectId) => {
    projects.setSelected(projectId);
    loadLocations(projectId);
  };

  /** @param {string} locationId Location to select */
  const selectLocation = (locationId) => {
    locations.setSelected(locationId);
    loadDatasets(projects.selected, locationId);
  };

  /** @param {string} dataset Dataset to select */
  const selectDataset = (dataset) => {
    datasets.setSelected(dataset);
    loadDicomStores(projects.selected, locations.selected, dataset);
  };

  /** @param {string} dicomStore Dicom Store to select */
  const selectDicomStore = (dicomStore) => {
    dicomStores.setSelected(dicomStore);
    loadStudies(projects.selected, locations.selected,
        datasets.selected, dicomStore);
  };

  /** @param {Object} study Study to select */
  const selectStudy = (study) => {
    studies.setSelected(study);

    loadSeries(projects.selected, locations.selected, datasets.selected,
        dicomStores.selected, study['0020000D'].Value[0]);
  };

  /** @param {Object} _series Series to select */
  const selectSeries = (_series) => {
    series.setSelected(_series);
  };

  /**
   * Clears all state up to and including project and reloads
   * projects
   */
  const clearAndLoadProjects = () => {
    projects.setSelected(null);

    clearLocation();
    locations.setData([]);

    loadProjects();
  };

  /** Clears all state up to and including location */
  const clearLocation = () => {
    locations.setSelected(null);

    clearDataset();
    datasets.setData([]);
  };
  /** Clears location state and reloads locations list */
  const clearAndLoadLocations = () => {
    clearLocation();
    loadLocations(projects.selected);
  };

  /** Clears all state up to and including dataset */
  const clearDataset = () => {
    datasets.setSelected(null);

    clearDicomStore();
    dicomStores.setData([]);
  };
  /** Clears dataset state and reloads dataset list */
  const clearAndLoadDatasets = () => {
    clearDataset();
    loadDatasets(projects.selected, locations.selected);
  };

  /** Clears all state up to and including dicom store */
  const clearDicomStore = () => {
    dicomStores.setSelected(null);

    clearStudy();
    studies.setData([]);
  };
  /** Clears dicomStore state and reloads dicomStore list */
  const clearAndLoadDicomStores = () => {
    clearDicomStore();
    loadDicomStores(projects.selected, locations.selected, datasets.selected);
  };

  /** Clears all state up to and including study */
  const clearStudy = () => {
    studies.setSelected(null);

    clearSeries();
    series.setData([]);
  };
  /** Clears study state and reloads study list */
  const clearAndLoadStudies = () => {
    clearStudy();
    loadStudies(projects.selected, locations.selected,
        datasets.selected, dicomStores.selected);
  };

  /** Clears all state up to and including series */
  const clearSeries = () => {
    series.setSelected(null);
  };
  /** Clears series state and reloads series list */
  const clearAndLoadSeries = () => {
    clearSeries();
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
              <Link color="inherit" href="#" onClick={clearAndLoadProjects}>
                {projects.selected}
              </Link> :
              <Typography color="textPrimary">
                Select Project
              </Typography>}
            {locations.selected ?
              <Link color="inherit" href="#" onClick={clearAndLoadLocations}>
                {locations.selected}
              </Link> :
              projects.selected ?
                <Typography color="textPrimary">
                  Select Location
                </Typography> : null}
            {datasets.selected ?
              <Link color="inherit" href="#" onClick={clearAndLoadDatasets}>
                {datasets.selected}
              </Link> :
              locations.selected ?
                <Typography color="textPrimary">
                  Select Dataset
                </Typography> : null}
            {dicomStores.selected ?
              <Link color="inherit" href="#" onClick={clearAndLoadDicomStores}>
                {dicomStores.selected}
              </Link> :
              datasets.selected ?
                <Typography color="textPrimary">
                  Select Dicom Store
                </Typography> : null}
            {studies.selected ?
              <Link color="inherit" href="#" onClick={clearAndLoadStudies}>
                {studies.selected.displayValue}
              </Link> :
              dicomStores.selected ?
                <Typography color="textPrimary">
                  Select Study
                </Typography> : null}
            {series.selected ?
              <Link color="inherit" href="#" onClick={clearAndLoadSeries}>
                {series.selected.displayValue}
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
          items={studies.data}
          onClickItem={selectStudy}
          isLoading={studies.loading} /> : null}
      {(studies.selected && !series.selected) ?
        <SearchList
          items={series.data}
          onClickItem={selectSeries}
          isLoading={series.loading} /> : null}
    </div >
  );
}
