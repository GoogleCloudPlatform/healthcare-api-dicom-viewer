import React from 'react';
import PropTypes from 'prop-types';
import {Paper, Box, LinearProgress, Typography,
  TextField, Button} from '@material-ui/core';
import * as cornerstone from 'cornerstone-core';
import * as api from '../api.js';
import {DICOM_TAGS} from '../dicomValues.js';
import DicomImageSequencer from '../dicomImageSequencer.js';

/**
 * React Component for viewing medical images
 */
export default class Viewer extends React.Component {
  /**
   * Creates a new instance of Viewer component
   * @param {Object} props React props for this component
   * @param {string} props.project Project
   * @param {string} props.location Location
   * @param {string} props.dataset Dataset
   * @param {string} props.dicomStore Dicom Store
   * @param {Object} props.study Study
   * @param {Object} props.series Series
   */
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

    this.dicomSequencer = new DicomImageSequencer(this.props.project,
        this.props.location,
        this.props.dataset,
        this.props.dicomStore,
        this.props.study,
        this.props.series,
    );
    this.readyImages = [];
    this.newSequence = false;
    this.canvasElement;
    this.renderedImagesCount = 0;
  }

  /**
   * Set up cornerstone listeners and retrieve instance list on mount
   */
  componentDidMount() {
    cornerstone.enable(this.canvasElement);
    this.canvasElement.addEventListener('cornerstoneimagerendered',
        this.onImageRendered.bind(this));
    this.getInstances();
  }

  /**
   * Cancel ongoing fetches to avoid state change after unmount
   */
  componentWillUnmount() {
    this.getInstancesPromise.cancel();
  }

  /**
   * Runs when a new image is ready from the DicomImageSequencer
   * @param {Object} image Cornerstone image
   */
  onImageReady(image) {
    this.readyImages.push(image);
    if (this.newSequence) {
      // If this is the first image in the sequence, render immediately
      this.displayNextImage();
      this.newSequence = false;
    }

    // Update progress bar
    this.setState((prevState) => ({
      readyImagesProgress: this.readyImages.length /
                          this.state.instances.length * 100,
      numReadyImages: prevState.numReadyImages + 1,
    }));
  }

  /**
   * Runs when an image has been rendered to the cornerstone canvas
   */
  onImageRendered() {
    this.renderedImagesCount++;
    this.setState({
      renderedImagesProgress: this.renderedImagesCount /
                              this.state.instances.length * 100,
      renderTimer: Date.now() - this.state.renderStartTime,
      numRenderedImages: this.renderedImagesCount,
    });

    this.displayNextImage();
  }

  /**
   * Checks the queue of ready images and displays the next one if available
   */
  displayNextImage() {
    if (this.readyImages.length > 0) {
      const image = this.readyImages.shift();
      cornerstone.displayImage(this.canvasElement, image);
    } else {
      this.newSequence = true;
    }
  }

  /**
   * Resets variables and begins fetching dicom images in sequence
   */
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

    this.dicomSequencer.maxSimultaneousRequests =
        this.state.maxSimultaneousRequests;
    this.dicomSequencer.setInstances(this.state.instances);
    this.dicomSequencer.fetchInstances(this.onImageReady.bind(this));
  }

  /**
   * Retrieves a list of dicom instances in this series
   */
  async getInstances() {
    this.getInstancesPromise = api.makeCancelable(
        api.fetchMetadata(
            this.props.project, this.props.location,
            this.props.dataset, this.props.dicomStore,
            this.props.study[DICOM_TAGS.STUDY_UID].Value[0],
            this.props.series[DICOM_TAGS.SERIES_UID].Value[0],
        ));

    this.getInstancesPromise.promise
        .then((instances) => {
          this.setState({
            instances,
          });
        })
        .catch((reason) => {
          if (!reason.isCanceled) {
            console.error(reason);
          }
        });
  }

  /**
   * Renders the component
   * @return {ReactComponent} <Viewer/>
   */
  render() {
    return (
      <Paper>
        <Box p={2}>
          <div id="cornerstone-div"
            ref={(input) => {
              this.canvasElement = input;
            }}
            style={{width: 500, height: 500}}>
            <canvas className="cornerstone-canvas"></canvas>
          </div>
          <LinearProgress variant="buffer"
            value={this.state.renderedImagesProgress}
            valueBuffer={this.state.readyImagesProgress} />
          <TextField label="Max Simultaneous Requests"
            defaultValue={this.state.maxSimultaneousRequests}
            onChange={(e) => {
              this.setState({maxSimultaneousRequests: Number(e.target.value)});
            }} />
          <Button
            variant="contained"
            color="primary"
            disabled={this.state.instances.length == 0}
            onClick={this.startDisplayingInstances.bind(this)}>
              Start
          </Button>
          <Typography variant="h5">
            Frames Loaded: {this.state.numReadyImages}
          </Typography>
          <Typography variant="h5">
            Frames Displayed: {this.state.numRenderedImages}
          </Typography>
          <Typography variant="h5">
            Time: {this.state.renderTimer / 1000}s
          </Typography>
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
