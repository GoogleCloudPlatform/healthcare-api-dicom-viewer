import * as cornerstone from 'cornerstone-core';
import * as dicomImageLoader from './dicomImageLoader/dicomImageLoader.js';
import {IMAGE_LOADER_PREFIX} from './config.js';

cornerstone.registerImageLoader(
    IMAGE_LOADER_PREFIX,
    dicomImageLoader.loadImage,
);
