import * as api from '../../api.js';
import createImageObjectFromDicom from '../createImageObject.js';

/** Stores metaData for each imageId
 * @type {Object.<string, object>} */
let metaDataDict = {};

const fetchDicom = (url) => {
  api.fetchDicomFile(url)
      .then((pixelData) => {
        self.postMessage({
          task: 'fetchDicom',
          pixelData,
          url,
        });
      })
      .catch((error) => {
        self.postMessage({
          task: 'fetchDicom',
          error,
          url,
        });
      });
};

const setMetaData = (metaData) => {
  metaDataDict = metaData;
};

const createImage = (imageId, pixelData) => {
  const image =
      createImageObjectFromDicom(imageId, pixelData, metaDataDict[imageId]);
  // Functions cannot be transferred, so delete getPixelData and add it back on
  // the main thread
  delete image.getPixelData;
  self.postMessage({
    task: 'createImage',
    imageId,
    image,
    pixelData,
  });
};

self.addEventListener('message', (event) => {
  if (event.data.accessToken) {
    self.accessToken = event.data.accessToken;
  }

  // Call the function corresponding to the given task
  if (event.data.task) {
    switch (event.data.task) {
      case 'fetchDicom':
        fetchDicom(event.data.url);
        break;
      case 'createImage':
        createImage(
            event.data.imageId,
            event.data.pixelData,
        );
        break;
      case 'setMetaData':
        setMetaData(event.data.metaData);
        break;
      default:
        console.error('Invalid dicomworker event ' + event.data.action);
    }
  }
});
