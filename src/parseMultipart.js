/** @module parseMultipart */

const HEADER_TOKEN = '\r\n\r\n';
const CONTENT_TYPE_TOKEN = 'Content-Type:';

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
 * Turns a byte array into a string, with optional start and end points
 * @param {Uint8Array} byteArray  Byte array to convert
 * @param {number=} startIndex Start index of the string
 * @param {number=} endIndex End index of the string
 * @return {string} Generated string
 */
const byteArrayToString = (byteArray, startIndex, endIndex) => {
  // Set defaults for start and end index, ensuring they do not pass
  // the bounds of the byte array
  startIndex = startIndex ? startIndex : 0;
  startIndex = Math.max(startIndex, 0);
  endIndex = endIndex ? endIndex : byteArray.length - 1;
  endIndex = Math.min(endIndex, byteArray.length - 1);

  let str = '';
  for (let i = startIndex; i <= endIndex; i++) {
    str += String.fromCharCode(byteArray[i]);
  }
  return str;
};

/**
 * Finds and strips multipart header and boundary from a multipart response
 * @param {ArrayBuffer} arrayBuffer Array Buffer to parse
 * @param {string} boundary The boundary string for the response
 * @return {{arrayBuffer: ArrayBuffer, transferSyntax: string}}
 *    Array Buffer with multipart boundaries removed
 */
const parseMultipart = (arrayBuffer, boundary) => {
  // Convert arrayBuffer to byte array
  const byteArray = new Uint8Array(arrayBuffer);

  // Find and parse the content-type header to get the transfer syntax
  const contentTypeStartIndex = findStringInByteArray(
      byteArray,
      CONTENT_TYPE_TOKEN,
  );
  if (contentTypeStartIndex == -1) {
    throw new Error('Not a valid multipart response');
  }
  const contentTypeEndIndex = findStringInByteArray(
      byteArray,
      '\r\n',
      contentTypeStartIndex,
  );
  if (contentTypeEndIndex == -1) {
    throw new Error('Not a valid multipart response');
  }
  const contentType = byteArrayToString(
      byteArray,
      contentTypeStartIndex,
      contentTypeEndIndex,
  );
  const transferSyntax = contentType.trim().split(';')[1].substring(17);

  // Search for the header location by looking for \r\n\r\n
  const headerIndex = findStringInByteArray(
      byteArray,
      HEADER_TOKEN,
      contentTypeEndIndex,
  );
  if (headerIndex == -1) {
    throw new Error('Not a valid multipart response');
  }

  // Add 8 bytes to boundary length to account for surrounding '--'
  // strings and both '\r\n' line terminators
  const boundaryLength = boundary.length + 8;

  const startIndex = headerIndex + 4; // Skip past '\r\n\r\n' token
  const endIndex = arrayBuffer.byteLength - boundaryLength;
  return {
    arrayBuffer: arrayBuffer.slice(startIndex, endIndex),
    transferSyntax,
  };
};

export default parseMultipart;
