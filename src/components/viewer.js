import React from 'react';
import PropTypes from 'prop-types';
import {Paper, Box, LinearProgress, Typography,
  TextField, Button} from '@material-ui/core';
import * as cornerstone from 'cornerstone-core';
import * as api from '../api.js';
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
      maxSimultaneousRequests: 20,
      totalRenderTime: 0,
    };

    this.dicomSequencer = new DicomImageSequencer(
        this.props.project,
        this.props.location,
        this.props.dataset,
        this.props.dicomStore,
        this.props.study,
        this.props.series,
    );

    this.renderStartTime = 0,
    this.readyImages = [];
    this.readyImagesCount = 0;
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
    this.readyImagesCount++;

    if (this.newSequence /* && (this.readyImagesCount > this.state.instances.length / 5) */ ) {
      // If this is the first image in the sequence, render immediately
      this.displayNextImage();
      this.newSequence = false;
    }
  }

  /**
   * Runs when an image has been rendered to the cornerstone canvas
   */
  onImageRendered() {
    this.renderedImagesCount++;

    // console.log(`Loaded images: ${this.readyImagesCount}\nDisplayed images: ${this.renderedImagesCount}\n`);
    if (this.renderedImagesCount == 1) {
      this.renderStartTime = Date.now();
    } else if (this.renderedImagesCount == this.state.instances.length) {
      this.setState({
        totalRenderTime: Date.now() - this.renderStartTime,
      });
    }

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
      console.log('Waiting on next image');
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
    this.readyImagesCount = 0;
    this.setState({
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
        api.fetchInstances(
            this.props.project, this.props.location,
            this.props.dataset, this.props.dicomStore,
            this.props.study['0020000D'].Value[0],
            this.props.series['0020000E'].Value[0],
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
          {this.state.totalRenderTime > 0 ?
          <Typography variant="h5">
            Time: {this.state.totalRenderTime / 1000}s
          </Typography> : null}
          {this.state.totalRenderTime > 0 ?
          <Typography variant="h5">
            Average FPS: {this.state.instances.length / (this.state.totalRenderTime / 1000)}
          </Typography> : null}
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
