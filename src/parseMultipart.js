/**
 * Finds the location of a given string in a byte array
 * @param {Uint8Array} byteArray Byte array to search
 * @param {string} str String to search for
 * @param {number=} offset Optional offset index to begin search
 * @return {number} Index where string was found
 */
const findStringInByteArray = (byteArray, str, offset) => {
  const startIndex = offset ? offset : 0;
  for (let i = startIndex; i < byteArray.length; i++) {
    // Search for str at each index, and return index once found
    const foundStr = true;
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
};

/**
 * Finds and strips multipart header and boundary from a response object
 * @param {ArrayBuffer} arrayBuffer Array Buffer to parse
 * @param {string} boundary The boundary string for the response
 * @return {ArrayBuffer} Array Buffer with multipart boundaries removed
 */
const parseMultipart = (arrayBuffer, boundary) => {
  // Convert arrayBuffer to byte array
  const byteArray = new Uint8Array(arrayBuffer);

  // Search for the header location by looking for \r\n\r\n
  const headerToken = '\r\n\r\n';
  const headerIndex = findStringInByteArray(byteArray, headerToken);

  // Add 8 bytes to boundary length to account for surrounding '--'
  // strings and both '\r\n' line terminators
  const boundaryLength = boundary.length + 8;

  const startIndex = headerIndex + 4; // Skip past '\r\n\r\n' token
  const endIndex = arrayBuffer.byteLength - boundaryLength;
  return arrayBuffer.slice(startIndex, endIndex);
};

export default parseMultipart;