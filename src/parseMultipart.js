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

/** @module parseMultipart */

const HEADER_TOKEN = '\r\n\r\n';

/**
 * Finds the location of a given string in a byte array
 * @param {Uint8Array} byteArray Byte array to search
 * @param {string} str String to search for
 * @param {number=} offset Optional offset index to begin search
 * @return {number} Index where string was found (-1 if not found)
 */
const findStringInByteArray = (byteArray, str, offset) => {
  const startIndex = offset ? offset : 0;
  for (let i = startIndex; i < byteArray.length - str.length + 1; i++) {
    // Search for str at each index, and return index once found
    let foundStr = true;
    for (let j = 0; j < str.length; j++) {
      if (byteArray[i + j] != str.charCodeAt(j)) {
        foundStr = false;
        break;
      }
    }
    if (foundStr) {
      return i;
    }
  }
  return -1;
};

/**
 * Finds and strips multipart header and boundary from a multipart response
 * @param {ArrayBuffer} arrayBuffer Array Buffer to parse
 * @param {string} boundary The boundary string for the response
 * @return {ArrayBuffer} Array Buffer with multipart boundaries removed
 */
const parseMultipart = (arrayBuffer, boundary) => {
  // Convert arrayBuffer to byte array
  const byteArray = new Uint8Array(arrayBuffer);

  // Search for the header location by looking for \r\n\r\n
  const headerIndex = findStringInByteArray(byteArray, HEADER_TOKEN);
  if (headerIndex == -1) {
    throw new Error('Not a valid multipart response');
  }

  // Add 8 bytes to boundary length to account for surrounding '--'
  // strings and both '\r\n' line terminators
  const boundaryLength = boundary.length + 8;

  const startIndex = headerIndex + 4; // Skip past '\r\n\r\n' token
  const endIndex = arrayBuffer.byteLength - boundaryLength;
  return arrayBuffer.slice(startIndex, endIndex);
};

export default parseMultipart;
