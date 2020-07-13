import React, {useState, useEffect} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {Typography, Breadcrumbs, Link, Box} from '@material-ui/core';
import * as auth from '../auth.js';
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

  // Project state
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Location state
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Dataset state
  const [datasets, setDatasets] = useState([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);

  // DicomStore state
  const [dicomStores, setDicomStores] = useState([]);
  const [dicomStoresLoading, setDicomStoresLoading] = useState(false);
  const [selectedDicomStore, setSelectedDicomStore] = useState(null);

  // Study state
  const [studies, setStudies] = useState([]);
  const [studiesLoading, setStudiesLoading] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState(null);

  // Series state
  const [series, setSeries] = useState([]);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState(null);

  /* On mount, check if user is signed in already or not
  by checking for an access token in local storage */
  useEffect(() => {
    const signedIn = Boolean(auth.getAccessToken());
    setIsSignedIn(signedIn);

    if (signedIn) {
      loadProjects();
    } else {
      signIn();
    }
  }, []);

  const signIn = () => {
    auth.signInToGoogle();
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
    loadData(api.fetchProjects, setProjectsLoading, setProjects);

  const loadLocations = async (projectId) =>
    loadData(() => api.fetchLocations(projectId),
        setLocationsLoading, setLocations);

  const loadDatasets = async (projectId, location) =>
    loadData(() => api.fetchDatasets(projectId, location),
        setDatasetsLoading, setDatasets);

  const loadDicomStores = async (projectId, location, dataset) =>
    loadData(() => api.fetchDicomStores(projectId, location, dataset),
        setDicomStoresLoading, setDicomStores);

  const loadStudies = async (projectId, location, dataset, dicomStore) =>
    loadData(async () => {
      const data = await api.fetchStudies(projectId, location,
          dataset, dicomStore);

      // Add a new field "displayValue" to each study for the SearchList
      return data.map((study) => ({...study,
        displayValue: study['00100010'].Value[0].Alphabetic}));
    }, setStudiesLoading, setStudies);

  const loadSeries =
  async (projectId, location, dataset, dicomStore, studyId) =>
    loadData(async () => {
      const data = await api.fetchSeries(projectId, location,
          dataset, dicomStore, studyId);

      // Add a new field "displayValue" to each series for the SearchList
      return data.map((series) => ({...series,
        displayValue: series['0008103E'].Value[0]}));
    }, setSeriesLoading, setSeries);

  // Methods for selecting a list item and loading data for the next list
  /** @param {string} projectId Project to select */
  const selectProject = (projectId) => {
    setSelectedProject(projectId);
    loadLocations(projectId);
  };

  /** @param {string} locationId Location to select */
  const selectLocation = (locationId) => {
    setSelectedLocation(locationId);
    loadDatasets(selectedProject, locationId);
  };

  /** @param {string} dataset Dataset to select */
  const selectDataset = (dataset) => {
    setSelectedDataset(dataset);
    loadDicomStores(selectedProject, selectedLocation, dataset);
  };

  /** @param {string} dicomStore Dicom Store to select */
  const selectDicomStore = (dicomStore) => {
    setSelectedDicomStore(dicomStore);
    loadStudies(selectedProject, selectedLocation, selectedDataset, dicomStore);
  };

  /** @param {Object} study Study to select */
  const selectStudy = (study) => {
    setSelectedStudy(study);

    loadSeries(selectedProject, selectedLocation, selectedDataset,
        selectedDicomStore, study['0020000D'].Value[0]);
  };

  /** @param {Object} series Series to select */
  const selectSeries = (series) => {
    setSelectedSeries(series);
  };

  /**
   * Clears all state up to and including project and reloads
   * projects
   */
  const clearAndLoadProjects = () => {
    setSelectedProject(null);

    clearLocation();
    setLocations([]);

    loadProjects();
  };

  /** Clears all state up to and including location */
  const clearLocation = () => {
    setSelectedLocation(null);

    clearDataset();
    setDatasets([]);
  };
  /** Clears location state and reloads locations list */
  const clearAndLoadLocations = () => {
    clearLocation();
    loadLocations(selectedProject);
  };

  /** Clears all state up to and including dataset */
  const clearDataset = () => {
    setSelectedDataset(null);

    clearDicomStore();
    setDicomStores([]);
  };
  /** Clears dataset state and reloads dataset list */
  const clearAndLoadDatasets = () => {
    clearDataset();
    loadDatasets(selectedProject, selectedLocation);
  };

  /** Clears all state up to and including dicom store */
  const clearDicomStore = () => {
    setSelectedDicomStore(null);

    clearStudy();
    setStudies([]);
  };
  /** Clears dicomStore state and reloads dicomStore list */
  const clearAndLoadDicomStores = () => {
    clearDicomStore();
    loadDicomStores(selectedProject, selectedLocation, selectedDataset);
  };

  /** Clears all state up to and including study */
  const clearStudy = () => {
    setSelectedStudy(null);

    clearSeries();
    setSeries([]);
  };
  /** Clears study state and reloads study list */
  const clearAndLoadStudies = () => {
    clearStudy();
    loadStudies(selectedProject, selectedLocation,
        selectedDataset, selectedDicomStore);
  };

  /** Clears all state up to and including series */
  const clearSeries = () => {
    setSelectedSeries(null);
  };
  /** Clears series state and reloads series list */
  const clearAndLoadSeries = () => {
    clearSeries();
    loadSeries(selectedProject, selectedLocation,
        selectedDataset, selectedDicomStore,
        selectedStudy['0020000D'].Value[0]);
  };

  return (
    <div className={classes.root}>
      <Box m={2} display="flex" flexDirection="row">
        <Box flexGrow={1}>
          <Breadcrumbs>
            {selectedProject ?
              <Link color="inherit" href="#" onClick={clearAndLoadProjects}>
                {selectedProject}
              </Link> :
              <Typography color="textPrimary">
                Select Project
              </Typography>}
            {selectedLocation ?
              <Link color="inherit" href="#" onClick={clearAndLoadLocations}>
                {selectedLocation}
              </Link> :
              selectedProject ?
                <Typography color="textPrimary">
                  Select Location
                </Typography> : null}
            {selectedDataset ?
              <Link color="inherit" href="#" onClick={clearAndLoadDatasets}>
                {selectedDataset}
              </Link> :
              selectedLocation ?
                <Typography color="textPrimary">
                  Select Dataset
                </Typography> : null}
            {selectedDicomStore ?
              <Link color="inherit" href="#" onClick={clearAndLoadDicomStores}>
                {selectedDicomStore}
              </Link> :
              selectedDataset ?
                <Typography color="textPrimary">
                  Select Dicom Store
                </Typography> : null}
            {selectedStudy ?
              <Link color="inherit" href="#" onClick={clearAndLoadStudies}>
                {selectedStudy.displayValue}
              </Link> :
              selectedDicomStore ?
                <Typography color="textPrimary">
                  Select Study
                </Typography> : null}
            {selectedSeries ?
              <Link color="inherit" href="#" onClick={clearAndLoadSeries}>
                {selectedSeries.displayValue}
              </Link> :
              selectedStudy ?
                <Typography color="textPrimary">
                  Select Series
                </Typography> : null}
          </Breadcrumbs>
        </Box>
      </Box>

      {!selectedProject ?
        <SearchList
          items={projects}
          onClickItem={selectProject}
          isLoading={projectsLoading} /> : null}
      {(selectedProject && !selectedLocation) ?
        <SearchList
          items={locations}
          onClickItem={selectLocation}
          isLoading={locationsLoading} /> : null}
      {(selectedLocation && !selectedDataset) ?
        <SearchList
          items={datasets}
          onClickItem={selectDataset}
          isLoading={datasetsLoading} /> : null}
      {(selectedDataset && !selectedDicomStore) ?
        <SearchList
          items={dicomStores}
          onClickItem={selectDicomStore}
          isLoading={dicomStoresLoading} /> : null}
      {(selectedDicomStore && !selectedStudy) ?
        <SearchList
          items={studies}
          onClickItem={selectStudy}
          isLoading={studiesLoading} /> : null}
      {(selectedStudy && !selectedSeries) ?
        <SearchList
          items={series}
          onClickItem={selectSeries}
          isLoading={seriesLoading} /> : null}
    </div >
  );
}
