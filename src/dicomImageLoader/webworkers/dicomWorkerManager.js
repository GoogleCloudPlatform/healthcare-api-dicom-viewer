import DicomWorker from './dicom.worker.js';
import Auth from '../../auth.js';

/**
 * @typedef {Object} Worker
 * @property {DicomWorker} worker
 * @property {number} activeTasks
 */

/**
 * Class for managing webworkers to perform tasks related to dicom
 * fetching and parsing
 */
class DicomWorkerManager {
  /**
   * Creates a new DicomWorkerManager
   * @param {number=} numWorkers Number of webworkers to use.
   *    Defaults to number of logical processors in computer
   */
  constructor(numWorkers) {
    /** @type {Worker[]} */
    this.workers = [];
    this.fetchDicomTasks = {};
    this.createImageTasks = {};

    if (!numWorkers) {
      numWorkers = navigator.hardwareConcurrency;
    }

    // Initialize workers
    for (let i = 0; i < numWorkers; i++) {
      const newWorker = {
        worker: new DicomWorker(),
        activeTasks: 0,
      };
      newWorker.worker.onmessage = (event) => {
        this.onWorkerMessage(event);
        newWorker.activeTasks--;
      };
      this.workers.push(newWorker);
    }
  }

  /**
   * Event that is called when a worker sends a message
   * @param {MessageEvent} event onMessage event
   */
  onWorkerMessage(event) {
    switch (event.data.task) {
      case 'fetchDicom':
        this.handleFetchDicom(event.data);
        break;
      case 'createImage':
        this.handleCreateImage(event.data);
        break;
    }
  }

  /**
   * Returns the worker with the least amount of active tasks
   * @return {Worker} worker object
   */
  getNextWorker() {
    let nextWorker = this.workers[0];
    if (nextWorker.activeTasks == 0) return nextWorker;
    for (let i = 1; i < this.workers.length; i++) {
      if (this.workers[i].activeTasks < nextWorker.activeTasks) {
        nextWorker = this.workers[i];
        if (nextWorker.activeTasks == 0) return nextWorker;
      }
    }

    return nextWorker;
  }

  /**
   * Sends a metadata dict to all webworkers for them
   *    to use when creating image objects
   * @param {Object.<string, object>} metaData
   */
  sendMetaDataToAllWebworkers(metaData) {
    for (let i = 0; i < this.workers.length; i++) {
      this.workers[i].worker.postMessage({
        task: 'setMetaData',
        metaData,
      });
    }
  }

  /**
   * Uses a worker to fetch a dicom file
   * @param {string} url Url to fetch
   * @return {Promise<Uint8Array>} Promise that returns byte array of dicom file
   */
  fetchDicom(url) {
    return new Promise((resolve, reject) => {
      const worker = this.getNextWorker();

      // Store resolve/reject functions to use once task is finished
      this.fetchDicomTasks[url] = {
        resolve,
        reject,
      };

      // Instruct worker to complete fetchDicom task
      worker.worker.postMessage({
        task: 'fetchDicom',
        url,
        accessToken: Auth.getAccessToken(),
      });
      worker.activeTasks++;
    });
  }

  /**
   * Uses a worker to parse a dicom file and create an image
   * object
   * @param {string} imageId ImageID for this dicom image
   * @param {Int16Array} pixelData Pixel data of dicom file
   * @return {Promise<Object>} Cornerstone image object
   */
  createImage(imageId, pixelData) {
    return new Promise((resolve, reject) => {
      const worker = this.getNextWorker();

      // Store resolve/reject functions to use once task is finished
      this.createImageTasks[imageId] = {
        resolve,
        reject,
      };

      // Instruct worker to complete createImage task
      worker.worker.postMessage({
        task: 'createImage',
        pixelData,
        imageId,
      });
      worker.activeTasks++;
    });
  }

  /**
   * Handle the completion of a fetchDicom task from a webworker
   * @param {Object} data Completed task data
   */
  handleFetchDicom(data) {
    const fetchDicomTask = this.fetchDicomTasks[data.url];
    delete this.fetchDicomTasks[data.url];

    if (data.error) {
      fetchDicomTask.reject(data.error);
      return;
    }

    fetchDicomTask.resolve(data.pixelData);
  }

  /**
   * Handle the completion of a createImage task from a webworker
   * @param {Object} data Completed task data
   */
  handleCreateImage(data) {
    const createImageTask = this.createImageTasks[data.imageId];
    delete this.createImageTasks[data.imageId];

    const image = data.image;
    const getPixelData = () => data.pixelData;
    image.getPixelData = getPixelData;

    createImageTask.resolve(image);
  }
}

export default DicomWorkerManager;
