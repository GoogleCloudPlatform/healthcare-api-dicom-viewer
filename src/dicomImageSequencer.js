import * as cornerstone from 'cornerstone-core';
import * as dicomImageLoader from './dicomImageLoader/dicomImageLoader.js';

/**
 * @callback onImageReady
 * @param {Object} image
 */

/**
 * Class for fetching dicom images in an ordered sequence
 */
export default class DicomImageSequencer {
  /**
   * Instantiates a new DicomImageSequencer
   * @param {string} project Google project id
   * @param {string} location Location for project
   * @param {string} dataset Dataset to use
   * @param {string} dicomStore Dicom Store to use
   * @param {Object} study Study to use
   * @param {Object} series Series to use
   */
  constructor(project, location, dataset, dicomStore, study, series) {
    this.project = project;
    this.location = location;
    this.dataset = dataset;
    this.dicomStore = dicomStore;
    this.study = study;
    this.series = series;

    // Set defaults
    this.instances = [];
    this.instanceQueue = [];
    this.loadedImages = {};
    this.fetchQueue = [];
    this.maxSimultaneousRequests = 20;
    this.currentSimultaneousRequests = 0;
  }

  /**
   * Sets the dicom instances that will be sequenced
   * @param {Object[]} instances Instances to be sequenced
   */
  setInstances(instances) {
    this.instances = instances;
    this.instances.sort((a, b) => {
      return a['00200013'].Value[0] - b['00200013'].Value[0];
    });
  }

  /**
   * Fetches and loads dicom images in sequential order
   * @param {onImageReady} onImageReady Runs when the next image in the
   * sequence has loaded
   */
  fetchInstances(onImageReady) {
    for (const instance of this.instances) {
      // Add fetches and instances to respective queues
      const imageURL = `dicomImageLoader://healthcare.googleapis.com/v1/projects/${this.project}/locations/${this.location}/datasets/${this.dataset}/dicomStores/${this.dicomStore}/dicomWeb/studies/${this.study['0020000D'].Value[0]}/series/${this.series['0020000E'].Value[0]}/instances/${instance['00080018'].Value[0]}`;
      this.instanceQueue.push(imageURL);
      this.fetchQueue.push(imageURL);
    }

    // Check fetch queue after image loader finishes
    // fetching each instance
    dicomImageLoader.onFetch(() => {
      this.currentSimultaneousRequests--;
      this.checkFetchQueue(onImageReady);
    });

    // Begin making fetch requests
    this.checkFetchQueue(onImageReady);
  }

  /**
   * Checks if the next instance in the queue has been loaded
   * @param {onImageReady} onImageReady Runs if the next instance in the
   * sequence is loaded
   */
  checkInstanceQueue(onImageReady) {
    while (this.instanceQueue.length > 0) {
      const nextImage = this.instanceQueue[0];
      if (this.loadedImages.hasOwnProperty(nextImage)) {
        onImageReady(this.loadedImages[nextImage]);
        this.instanceQueue.shift();
      } else {
        // If an instance in the queue is not ready, stop iterating
        return;
      }
    }
  }

  /**
   * Checks if a new fetch request is available to be sent out
   * @param {onImageReady} onImageReady Runs if the next instance in the
   * sequence is loaded
   */
  checkFetchQueue(onImageReady) {
    // Calculate how many requests can be sent out
    const availableRequests =
        this.maxSimultaneousRequests - this.currentSimultaneousRequests;
    const requestsRemaining = this.fetchQueue.length;

    // Send out as many requests as available
    if (availableRequests > 0 && requestsRemaining > 0) {
      for (let i = 0; i < Math.min(availableRequests, requestsRemaining); i++) {
        const imageURL = this.fetchQueue.shift();
        this.currentSimultaneousRequests++;

        // Load image with cornerstone
        cornerstone.loadImage(imageURL).then((image) => {
          // Store loaded image and check the instance queue
          this.loadedImages[image.imageId] = image;
          this.checkInstanceQueue(onImageReady);
        });
      }
    }
  }
}
