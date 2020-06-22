import * as api from '../../api.js';
import createImageObjectFromDicom from '../createImageObject.js';

const fetchDicom = (url) => {
  api.fetchDicomFile(url)
      .then((byteArray) => {
        self.postMessage({
          task: 'fetchDicom',
          byteArray,
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

const createImage = (imageId, byteArray) => {
  const image = createImageObjectFromDicom(imageId, byteArray);
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

  if (event.data.task) {
    switch (event.data.task) {
      case 'fetchDicom':
        fetchDicom(event.data.url);
        break;
      case 'createImage':
        createImage(event.data.imageId, event.data.byteArray);
        break;
      default:
        console.error('Invalid dicomworker event ' + event.data.action);
    }
  }
});
