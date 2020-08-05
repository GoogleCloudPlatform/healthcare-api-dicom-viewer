import * as api from '../../api.js';
import createImageObjectFromDicom from '../createImageObject.js';

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

const createImage = (imageId, pixelData, metaData) => {
  const image = createImageObjectFromDicom(imageId, pixelData, metaData);
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

  if (event.data.task) {
    switch (event.data.task) {
      case 'fetchDicom':
        fetchDicom(event.data.url);
        break;
      case 'createImage':
        createImage(
            event.data.imageId,
            event.data.pixelData,
            event.data.metaData,
        );
        break;
      default:
        console.error('Invalid dicomworker event ' + event.data.action);
    }
  }
});
