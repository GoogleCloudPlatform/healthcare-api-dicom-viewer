const {exec} = require('child_process');

let accessToken;

function getAccessToken() {
  return new Promise((resolve, reject) => {
    if (!accessToken) {
      exec('gcloud auth application-default print-access-token', (error, stdout, stderr) => {
        if (error) {
          console.error(error.message);
        }
        if (stderr) {
          console.error(stderr);
        }
        accessToken = stdout;
        resolve(accessToken);
      });
    } else {
      resolve(accessToken);
    }
  });
}

module.exports = getAccessToken;
