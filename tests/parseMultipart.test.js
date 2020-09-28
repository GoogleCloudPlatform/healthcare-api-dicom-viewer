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

import parseMultipart from '../src/parseMultipart.js';
import fs from 'fs';

/**
 * Helper function to generate a multipart byte array
 * @param {string} boundary The boundary string to use
 * @param {num} headerLength The number of lines to include in the header
 * @param {string} content The content surrounded by multipart boundaries
 * @return {ArrayBuffer} Array buffer containing the content as a byte array
 *    formatted as a multipart response
 */
const generateMultipartArrayBuffer = (boundary, headerLength, content) => {
  // Generate header
  let header = `--${boundary}\r\n`;
  for (let i = 1; i <= headerLength; i++) {
    header += `HEADER_LINE_${i}\r\n`;
  }
  header += '\r\n';

  // Generate footer
  const footer = `\r\n--${boundary}--\r\n`;

  // Create multipart string using header, content, and footer
  const multipartString = header + content + footer;

  // Generate an array buffer containing the bytes for the string
  const arrayBuffer = new ArrayBuffer(multipartString.length);
  const byteArray = new Uint8Array(arrayBuffer);
  for (let i = 0; i < multipartString.length; i++) {
    byteArray[i] = multipartString.charCodeAt(i);
  }

  return arrayBuffer;
};

/**
 * Converts an array buffer to a string using ascii codes
 * @param {ArrayBuffer} arrayBuffer The array buffer to convert
 * @return {string} A string representing the array buffer contents
 */
const arrayBufferToString = (arrayBuffer) => {
  const byteArray = new Uint8Array(arrayBuffer);
  let resultString = '';
  for (let i = 0; i < byteArray.length; i++) {
    resultString += String.fromCharCode(byteArray[i]);
  }
  return resultString;
};

test('parseMultipart correctly strips multipart headers and boundaries', () => {
  // Test multiple different lengths and values
  // for the header, boundary string, and content

  // Test normal functionality
  let boundary = 'abcd';
  let content = 'Hello world!';
  let arrayBuffer = generateMultipartArrayBuffer(boundary, 1, content);
  let parsedArrayBuffer = parseMultipart(arrayBuffer, boundary);

  expect(arrayBufferToString(parsedArrayBuffer)).toEqual(content);

  // Test with 3 header lines and content that starts with \r\n\r\n
  boundary = '1234567910abcdefghijklmnopqrstuvwxyz';
  content = '\r\n\r\nThis Content starts with carriage returns and newlines';
  arrayBuffer = generateMultipartArrayBuffer(boundary, 3, content);
  parsedArrayBuffer = parseMultipart(arrayBuffer, boundary);

  expect(arrayBufferToString(parsedArrayBuffer)).toEqual(content);

  // Test with no boundary, 10 header lines, and content ending in \r\n\r\n
  boundary = '';
  content = 'This Content ends with carriage returns and newlines\r\n\r\n';
  arrayBuffer = generateMultipartArrayBuffer(boundary, 10, content);
  parsedArrayBuffer = parseMultipart(arrayBuffer, boundary);

  expect(arrayBufferToString(parsedArrayBuffer)).toEqual(content);

  // Real world example
  // (should be similar to an actual multipart dicom response)
  boundary = '9aa9819d32ea43a1ece1e209278fab1c00fc982960149d6276d5f2ea1b10';
  content = fs.readFileSync(__dirname + '/pixelData.txt', 'utf8');
  arrayBuffer = generateMultipartArrayBuffer(boundary, 1, content);
  parsedArrayBuffer = parseMultipart(arrayBuffer, boundary);

  expect(arrayBufferToString(parsedArrayBuffer)).toEqual(content);

  // Invalid multipart response example (expect to throw)
  // Create an array buffer without multipart boundary or header
  content = 'Hello world!';
  arrayBuffer = new ArrayBuffer(content.length);
  const byteArray = new Uint8Array(arrayBuffer);
  for (let i = 0; i < content.length; i++) {
    byteArray[i] = content.charCodeAt(i);
  }
  expect(() => parseMultipart(arrayBuffer)).toThrow();
});
