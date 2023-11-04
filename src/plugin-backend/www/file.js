window.FileManager = {
  createFile: async function (fileName, fileContents) {
    return new Promise((resolve, reject) =>
      cordova.exec(resolve, reject, 'FileManager', 'createFile', [
        fileName,
        fileContents,
      ])
    );
  },
};
