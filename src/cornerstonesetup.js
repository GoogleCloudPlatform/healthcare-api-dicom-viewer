import * as cornerstone from 'cornerstone-core';
import * as dicomImageLoader from './dicomImageLoader.js';

cornerstone.registerImageLoader('dicomImageLoader', dicomImageLoader.loadImage);
