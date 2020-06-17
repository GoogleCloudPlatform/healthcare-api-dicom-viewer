import React, {useEffect, useState, useLayoutEffect} from 'react';
import PropTypes from 'prop-types';
import {Paper, makeStyles, Box, LinearProgress, Typography, TextField, Button} from '@material-ui/core';
import * as cornerstone from 'cornerstone-core';
import * as auth from '../auth.js';
import DicomImageSequencer from '../dicomImageSequencer.js';
import { render } from 'react-dom';

const useStyles = makeStyles((theme) => ({
  canvas: {
    width: 500,
    height: 500,
  },
}));

// const CornerstoneCanvas = React.memo(({setCanvas}) => {
//   useEffect(() => {
//     console.log('rerender');
//     setCanvas(document.getElementById('cornerstone-div'));
//   });

//   return (
    
//   );
// }, () => true);
// CornerstoneCanvas.displayName = 'CornerstoneCanvas';

/**
 * React Component for viewing medical images
 * @return {ReactComponent} <Viewer/>
 */
export default class Viewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      instances: [],
      numReadyImages: 0,
      readyImagesProgress: 0,
      numRenderedImages: 0,
      renderedImagesProgress: 0,
      renderStartTime: 0,
      renderTimer: 0,
      maxSimultaneousRequests: 20,
    };

    this.dicomSequencer = new DicomImageSequencer(this.props.project, this.props.location, this.props.dataset, this.props.dicomStore, this.props.study, this.props.series);
    this.readyImages = [];
    this.newSequence = false;
    this.canvasElement;
    this.renderedImagesCount = 0;
  }

  componentDidMount() {
    cornerstone.enable(this.canvasElement);
    this.canvasElement.addEventListener('cornerstoneimagerendered', this.onImageRendered.bind(this));
    this.getInstances();
  }

  componentDidUpdate(prevProps, prevState) {
    if(prevState.instances != this.state.instances) {
      
    }
  }

  onImageReady(image) {
    this.readyImages.push(image);
    if (this.newSequence) {
      // If this is the first image in the sequence, render immediately
      this.displayNextImage();
      this.newSequence = false;
    }

    // Update progress bar
    this.setState((prevState) => ({
      readyImagesProgress: this.readyImages.length / this.state.instances.length * 100,
      numReadyImages: prevState.numReadyImages + 1,
    }));
  }

  onImageRendered() {
    this.renderedImagesCount++;
    this.setState({
      renderedImagesProgress: this.renderedImagesCount / this.state.instances.length * 100,
      renderTimer: Date.now() - this.state.renderStartTime,
      numRenderedImages: this.renderedImagesCount,
    });

    this.displayNextImage();
  }

  displayNextImage() {
    if (this.readyImages.length > 0) {
      const image = this.readyImages.shift();
      cornerstone.displayImage(this.canvasElement, image);
    } else {
      this.newSequence = true;
    }
  }

  startDisplayingInstances() {
    this.newSequence = true;
    this.renderedImagesCount = 0;
    this.readyImages = [];
    this.setState({
      renderStartTime: Date.now(),
      renderTimer: 0,
      numReadyImages: 0,
      readyImagesProgress: 0,
      numRenderedImages: 0,
      renderedImagesProgress: 0,
    });

    this.dicomSequencer.maxSimultaneousRequests = this.state.maxSimultaneousRequests;
    this.dicomSequencer.setInstances(this.state.instances);
    this.dicomSequencer.fetchInstances(this.onImageReady.bind(this));
  }

  getInstances() {
    const accessToken = auth.getAccessToken();
    if (accessToken) {
      fetch(`https://healthcare.googleapis.com/v1/projects/${this.props.project}/locations/${this.props.location}/datasets/${this.props.dataset}/dicomStores/${this.props.dicomStore}/dicomWeb/studies/${this.props.study['0020000D'].Value[0]}/series/${this.props.series['0020000E'].Value[0]}/instances` +
        `?access_token=${accessToken}`)
          .then((response) => response.json())
          .then((data) => {
            this.setState({
              instances: data,
            })
          })
          .catch((error) => {
            console.error(error);
          });
    }
  }

  render() {
    return (
      <Paper>
        <Box p={2}>
          <div id="cornerstone-div"
          ref={input => {
            this.canvasElement = input;
          }}
          style={{width: 500, height: 500}}>
            <canvas className="cornerstone-canvas"></canvas>
          </div>
          <LinearProgress variant="buffer" value={this.state.renderedImagesProgress} valueBuffer={this.state.readyImagesProgress} />
          <TextField label="Max Simultaneous Requests"
            defaultValue={this.state.maxSimultaneousRequests}
            onChange={(e) => {this.setState({maxSimultaneousRequests: Number(e.target.value)});}} />
          <Button variant="contained" color="primary" onClick={this.startDisplayingInstances.bind(this)}>Start</Button>
          <Typography variant="h5">Frames Loaded: {this.state.numReadyImages}</Typography>
          <Typography variant="h5">Frames Displayed: {this.state.numRenderedImages}</Typography>
          <Typography variant="h5">Time: {this.state.renderTimer / 1000}s</Typography>
        </Box>
      </Paper>
    );
  }
}
Viewer.propTypes = {
  project: PropTypes.string.isRequired,
  location: PropTypes.string.isRequired,
  dataset: PropTypes.string.isRequired,
  dicomStore: PropTypes.string.isRequired,
  study: PropTypes.object.isRequired,
  series: PropTypes.object.isRequired,
};
