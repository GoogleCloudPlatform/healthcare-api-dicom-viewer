import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {Paper, makeStyles, Box} from '@material-ui/core';
import * as cornerstone from 'cornerstone-core';
import * as auth from '../auth.js';

const useStyles = makeStyles((theme) => ({
  canvas: {
    width: 500,
    height: 500,
  },
}));


/**
 * React Component for viewing medical images
 * @return {ReactComponent} <Viewer/>
 */
export default function Viewer(
    {project, location, dataset, dicomStore, study, series}) {
  const classes = useStyles();

  const [instances, setInstances] = useState([]);

  const canvasRef = React.createRef();

  useEffect(() => {
    cornerstone.enable(canvasRef.current);

    getInstances();
  }, []);

  useEffect(() => {
    if (instances.length > 0) {
      loadFirstInstance();
    }
  }, [instances]);

  const getInstances = () => {
    const accessToken = auth.getAccessToken();
    if (accessToken) {
      fetch(`https://healthcare.googleapis.com/v1/projects/${project}/locations/${location}/datasets/${dataset}/dicomStores/${dicomStore}/dicomWeb/studies/${study['0020000D'].Value[0]}/series/${series['0020000E'].Value[0]}/instances` +
        `?access_token=${accessToken}&includefield=all`)
          .then((response) => response.json())
          .then((data) => {
            setInstances(data);
            console.log(data);
          })
          .catch((error) => {
            console.error(error);
          });
    }
  };

  const loadFirstInstance = () => {
    const accessToken = auth.getAccessToken();
    if (accessToken) {
      fetch(`https://healthcare.googleapis.com/v1/projects/${project}/locations/${location}/datasets/${dataset}/dicomStores/${dicomStore}/dicomWeb/studies/${study['0020000D'].Value[0]}/series/${series['0020000E'].Value[0]}/instances/${instances[0]['00080018'].Value[0]}` +
            `?access_token=${accessToken}`)
          .then((response) => response.text())
          .then((data) => {
            console.log(data);
          })
          .catch((error) => {
            console.error(error);
          });
    }
  };

  return (
    <Paper>
      <Box p={2}>
        <canvas ref={canvasRef} className={classes.canvas}></canvas>
      </Box>
    </Paper>
  );
}
Viewer.propTypes = {
  project: PropTypes.string.isRequired,
  location: PropTypes.string.isRequired,
  dataset: PropTypes.string.isRequired,
  dicomStore: PropTypes.string.isRequired,
  study: PropTypes.object.isRequired,
  series: PropTypes.object.isRequired,
};
