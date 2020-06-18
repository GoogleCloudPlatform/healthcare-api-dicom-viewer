import * as api from '../api.js';

const dicomFetch = (url) => {

};

self.addEventListener('message', (event) => {
  if (event.data.action) {
    switch (event.data.action) {
      case 'dicomFetch':
        dicomFetch(event.data.url);
        break;
      default:
        console.error('Invalid dicomworker event ' + event.data.action);
    }
  }
  self.postMessage('world!');
});
