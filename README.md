# Healthcare DICOM viewer

This repository contains a tool to view DICOM data served by Google Cloud Healthcare API.

The goal of this viewer is to be used as reference for the [best practices](https://cloud.google.com/healthcare/docs/how-tos/dicom-best-practices) on integrating the Google Healthcare API into a medical image viewer with optimal performance. For more information on integrating the Google Healthcare API with your viewer, [see here.](https://cloud.google.com/healthcare/docs/how-tos/dicom-viewers)

The performance investigations made while developing this viewer are described in the [Wiki.](https://github.com/GoogleCloudPlatform/healthcare-api-dicom-viewer/wiki/Performant-Medical-Image-Viewer-Findings)

## Setup Instructions
To use the viewer locally, you will need to set up OAuth2.0 client credentials. To do this:
1. Open [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth Client ID and selected "Web application"
3. When setting up the OAuth consent screen, add the following scopes:
    * https://www.googleapis.com/auth/cloud-healthcare
    * https://www.googleapis.com/auth/cloudplatformprojects.readonly
4. Add http://localhost:1234 or your host url to the Authorized JavaScript Origins & Authorized redirect URIs
5. Copy the Client ID into [src/config.js](src/config.js)

Use the below commands to run or build the application
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
When you open the viewer for the first time, you will be asked to sign into Google. Then, the application will load a list of the Google Cloud projects you have access to. You can navigate through your projects, project locations, datasets, dicom stores, DICOM studies, and DICOM series through a series of lists. Each list has the ability to search and filter through its items.

There are also breadcrumbs at the top of the application you can use to go back to a given point. For instance, to switch to another project after having already selected one, you would click the project name in the breadcrumbs which will take you back to that point and allow you to select a new one.

### DICOM Viewer
Once your project, location, dataset, dicom store, study, and series have been selected, you will be navigated to the viewer screen. Here, you will see a black canvas, a list of metrics, an input dialog to change the number of concurrent requests, and a start button.

Changing the "Max Simultaneous Requests" input box will alter how many http requests will be active at any given moment when fetching a sequence of DICOM images. The default is set to 20, but this value can be changed to see the performance benefits of increased simultaneous requests.

Press "Start" to begin loading the sequence of DICOM images in this series. You should see the images start to load as fast as they can, along with metrics updating to measure performance. After the sequence ends, you can change any values you want and press "Start" again to clear the cache and run the sequence again. One thing to note, is that CornerstoneJS renders the images using [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame), which means that the images will never render faster than your screen's current refresh rate. So if you have a 60Hz monitor, the highest FPS you will see is around ~60FPS. 
