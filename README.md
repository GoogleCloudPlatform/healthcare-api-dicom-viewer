# Healthcare DICOM viewer

This repository contains a tool to view DICOM data served by Google Cloud
Healthcare API.

The goal of this viewer is to be used as reference for the [best practices](https://github.com/GoogleCloudPlatform/healthcare-api-dicom-viewer/wiki/Performant-Medical-Image-Viewer-Findings) on integrating the Google Healthcare API into a medical image viewer with optimal performance.

## Setup Instructions
To use the viewer locally, you will need to create [OAuth2.0 client credentials](https://cloud.google.com/docs/authentication/end-user) in the Google Cloud Console, and copy your client-id into [src/config.js](src/config.js)
```shell
npm install # Install dependencies

npm start # Starts a local webserver on localhost:1234
or
npm build # Builds the application in /dist folder
```

## To Run Tests
```shell
npm run test
```

## Usage Instructions
To use the viewer, you will need to have access to a Google Cloud project that is being used to store DICOM images. If you don't have one, there is a [public tcia dataset](https://cloud.google.com/healthcare/docs/resources/public-datasets/tcia#cloud-healthcare-api) that you can request access to for testing purposes.

### Navigation
When you open the viewer for the first time, you will be asked to sign into Google. Then, the application will load a list of the Google Cloud projects you have access to. You can navigate through your projects, project locations, datasets, dicom stores, DICOM studies, and DICOM series through a series of lists. Each list as the ability to search and filter through its items.

There are also breadcrumbs at the top of the application you can use to go back to a given point. For instance, to switch to another project after having already selected one, you would click the project name in the breadcrumbs which will take you back to that point and allow you to select a new one.

### DICOM Viewer
Once your project, location, dataset, dicom store, study, and series have been selected, you will be navigated to the viewer screen. Here, you will see a black canvas, a list of metrics, an input dialog to change the number of concurrent requests, and a start button.

Changing the "Max Simultaneous Requests" input box will alter how many http requests will be active at any given moment when fetching a sequence of DICOM images. The default is set to 20, but this value can be changed to see the performance benefits of increased simultaneous requests.

Press "Start" to begin loading the sequence of DICOM images in this series. You should see the images start to load as fast as they can, along with metrics updating to measure performance. After the sequence ends, you can change any values you want and press "Start" again to clear the cache and run the sequence again. One thing to note, is that CornerstoneJS renders the images using [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame), which means that the images will never render faster than your screens current refresh rate. So if you have a 60Hz monitor, the highest FPS you will see is around ~60FPS. 
