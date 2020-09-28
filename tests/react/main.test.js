/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import {render, fireEvent, screen, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import * as api from '../../src/api.js';
import Auth from '../../src/auth.js';
import Main from '../../src/components/main.js';

/**
 * Helper function -
 * Returns an array of items labeled as so: item1, item2...
 * @param {number} numItems Number of items to generate
 * @param {string} name The name of the items
 * @return {string[]} List of numbered items
 */
const generateItems = (numItems, name) => {
  const items = [];
  for (let i = 1; i <= numItems; i++) {
    items.push(name + i);
  }
  return items;
};

// Set up mock functions for api calls
jest.mock('../../src/api.js');
jest.mock('../../src/auth.js');

// Ensure the makeCancelable function is NOT mocked as it is needed
// for the viewer component to function properly
const {makeCancelable} = jest.requireActual('../../src/api.js');
api.makeCancelable = makeCancelable;

// Mock auth functions to prevent any use of the gapi client
Auth.initClient.mockReturnValue(Promise.resolve());
Auth.isSignedIn.mockReturnValue(true);
Auth.getAccessToken.mockReturnValue('FAKE_ACCESS_TOKEN');

// fetchProjects will resolve 5 mock projects
api.fetchProjects.mockResolvedValue(
    generateItems(5, 'project'),
);

// fetchLocations will resolve 5 fake locations
api.fetchLocations.mockResolvedValue(
    generateItems(5, 'location'),
);

// fetchDatasets will resolve 5 fake datasets
api.fetchDatasets.mockResolvedValue(
    generateItems(5, 'dataset'),
);

// fetchDicomStores will resolve 5 fake dicomStores
api.fetchDicomStores.mockResolvedValue(
    generateItems(5, 'dicomStore'),
);

// fetchStudies will resolve 1 fake study
api.fetchStudies.mockResolvedValue([{
  '00100020': {
    Value: ['study1'],
  },
  '0020000D': {
    Value: ['study1-UID'],
  },
}]);

// fetchSeries will resolve 1 fake series
api.fetchSeries.mockResolvedValue([{
  '00080060': {
    Value: ['series1'],
  },
  '0020000E': {
    Value: ['series1-UID'],
  },
}]);

// fetchMetadata will resolve 1 fake instance
api.fetchMetadata.mockResolvedValue([{
  '00080016': {
    vr: 'UI',
    Value: ['instance1-UID'],
  },
  '00200013': {
    vr: 'IS',
    Value: [1],
  },
}]);

// eslint-disable-next-line max-len
test('User can navigate between project, location, dataset, dicomStore, study, and series', async () => {
  render(
      <Main/>,
  );

  // Navigate through: project2 -> location5 -> dataset3 ->
  // dicomStore4 -> study1 -> series1

  // Ensure project1 through project5 are displayed
  await waitFor(() =>
    expect(screen.getAllByText(/^project\d+$/)).toHaveLength(5));
  fireEvent.click(screen.getByText('project2'));

  // Ensure location1 through location5 are displayed
  await waitFor(() =>
    expect(screen.getAllByText(/^location\d+$/)).toHaveLength(5));
  fireEvent.click(screen.getByText('location5'));

  // Ensure dataset1 through dataset5 are displayed
  await waitFor(() =>
    expect(screen.getAllByText(/^dataset\d+$/)).toHaveLength(5));
  fireEvent.click(screen.getByText('dataset3'));

  // Ensure dicomStore1 through dicomStore5 are displayed
  await waitFor(() =>
    expect(screen.getAllByText(/^dicomStore\d+$/)).toHaveLength(5));
  fireEvent.click(screen.getByText('dicomStore4'));

  // Ensure study1 is displayed
  await waitFor(() =>
    expect(screen.getAllByText(/^study\d+$/)).toHaveLength(1));
  fireEvent.click(screen.getByText('study1'));

  // Ensure series1 is displayed
  await waitFor(() =>
    expect(screen.getAllByText(/^series\d+$/)).toHaveLength(1));
  fireEvent.click(screen.getByText('series1'));

  // Confirm that breadcrumbs are all displaying correctly
  expect(screen.queryByText('project2')).not.toBeNull();
  expect(screen.queryByText('location5')).not.toBeNull();
  expect(screen.queryByText('dataset3')).not.toBeNull();
  expect(screen.queryByText('dicomStore4')).not.toBeNull();
  expect(screen.queryByText('study1')).not.toBeNull();
  expect(screen.queryByText('series1')).not.toBeNull();

  // Confirm that clicking a breadcrumb resets state back to
  // search list
  fireEvent.click(screen.getByText('project2'));
  await waitFor(() =>
    expect(screen.queryByText('Select Project')).not.toBeNull());
  await waitFor(() =>
    expect(screen.getAllByText(/^project\d+$/)).toHaveLength(5));
}, 10000);
