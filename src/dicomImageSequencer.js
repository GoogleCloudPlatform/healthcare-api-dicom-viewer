/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** @module DicomImageSequencer */
import * as cornerstone from 'cornerstone-core';
import {IMAGE_LOADER_PREFIX} from './config.js';
import {setMetadata} from './dicomImageLoader.js';
import {DICOM_TAGS} from './dicomValues.js';

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

    // Sort instances to ensure correct order of rendering
    this.instances.sort((a, b) => {
      return a[DICOM_TAGS.INSTANCE_NUMBER].Value[0] -
          b[DICOM_TAGS.INSTANCE_NUMBER].Value[0];
    });
  }

  /**
   * Fetches and loads dicom images in sequential order
   * @param {onImageReady} onImageReady Runs when the next image in the
   *    sequence has loaded
   * @return {number} Total number of images to be displayed
   */
  fetchInstances(onImageReady) {
    for (const instance of this.instances) {
      // Generate urls for individual frames to support multi-frame instances
      const numFrames = instance[DICOM_TAGS.NUM_FRAMES] ?
          instance[DICOM_TAGS.NUM_FRAMES].Value[0] : 1;

      for (let frameNum = 1; frameNum <= numFrames; frameNum++) {
        // Add fetches and instances to respective queues
        const imageURL = `${IMAGE_LOADER_PREFIX}://healthcare.googleapis.com/v1/projects/${this.project}/locations/${this.location}/datasets/${this.dataset}/dicomStores/${this.dicomStore}/dicomWeb/studies/${this.study[DICOM_TAGS.STUDY_UID].Value[0]}/series/${this.series[DICOM_TAGS.SERIES_UID].Value[0]}/instances/${instance[DICOM_TAGS.INSTANCE_UID].Value[0]}/frames/${frameNum}`;
        this.instanceQueue.push(imageURL);
        this.fetchQueue.push(imageURL);

        // Store metaData in dicomImageLoader to
        // be used for creating image object
        setMetadata(imageURL, instance);
      }
    }

    const totalImages = this.instanceQueue.length;

    // Begin making fetch requests
    this.checkFetchQueue(onImageReady);

    return totalImages;
  }

  /**
   * Checks if the next instance in the queue has been loaded
   * @param {onImageReady} onImageReady Runs if the next instance in the
   *    sequence is loaded
   */
  checkInstanceQueue(onImageReady) {
    while (this.instanceQueue.length > 0) {
      const nextImageId = this.instanceQueue[0];
      if (this.loadedImages.hasOwnProperty(nextImageId)) {
        // Remove this imageId from the queue
        this.instanceQueue.shift();

        // Get the image object and delete this sequencer's
        // reference to it to avoid memory leaks
        const image = this.loadedImages[nextImageId];
        delete this.loadedImages[nextImageId];

        // Call onImageReady with the prepared image
        onImageReady(image);
      } else {
        // If an instance in the queue is not ready, stop iterating
        return;
      }
    }
  }

  /**
   * Checks if a new fetch request is available to be sent out
   * @param {onImageReady} onImageReady Runs if the next instance in the
   *    sequence is loaded
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

          // Make a new request available and check the fetch queue
          this.currentSimultaneousRequests--;
          this.checkFetchQueue(onImageReady);
        });
      }
    }
  }

  /**
   * Cancels any currently running operations by clearing queues
   *    and removing any cached images
   */
  cancel() {
    this.instanceQueue = [];
    this.loadedImages = {};
    this.fetchQueue = [];
  }
}
