import * as api from '../../api.js';
import createImageObjectFromDicom from '../createImageObject.js';

/** Stores metaData for each imageId
 * @type {Object.<string, object>} */
let metaDataDict = {};

const fetchDicom = (url, transferSyntax) => {
  api.fetchDicomFile(url, transferSyntax)
      .then((dicomData) => {
        self.postMessage({
          task: 'fetchDicom',
          dicomData,
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

const createImage = (imageId, dicomData) => {
  const image =
      createImageObjectFromDicom(imageId, dicomData, metaDataDict[imageId]);
  // Functions cannot be transferred, so delete getPixelData and add it back on
  // the main thread
  const pixelData = image.getPixelData();
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
        fetchDicom(event.data.url, event.data.transferSyntax);
        break;
      case 'createImage':
        createImage(
            event.data.imageId,
            event.data.dicomData,
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
