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
  const canvasRef = React.createRef();

  // State variables
  const [instances, setInstances] = useState([]);

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
        `?access_token=${accessToken}`)
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
      const imageURL = `dicomImageLoader://healthcare.googleapis.com/v1/projects/${project}/locations/${location}/datasets/${dataset}/dicomStores/${dicomStore}/dicomWeb/studies/${study['0020000D'].Value[0]}/series/${series['0020000E'].Value[0]}/instances/${instances[0]['00080018'].Value[0]}`;

      cornerstone.loadImage(imageURL).then(function(image) {
        console.log(image);
        cornerstone.displayImage(canvasRef.current, image);
      });
    }
  };

  return (
    <Paper>
      <Box p={2}>
        <div ref={canvasRef} className={classes.canvas}></div>
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
