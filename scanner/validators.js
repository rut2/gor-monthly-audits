const {getFileNameFromPath} = require("../helpers/fileSystem");

module.exports = {

    validateName: (path) => {

        const allowedFileNames = ['icici', 'hdfc']
        const allowedExtensions = ['pdf']

        try {

            const fileName = getFileNameFromPath(path);

            if(!allowedFileNames.includes(fileName[0])) {
                throw new Error(`Problem with fileName: ${fileName.join('.')}. \n
                Allowed file names are ${JSON.stringify(allowedFileNames)}` )
            }

            if(!allowedExtensions.includes(fileName[1])) {
                throw new Error(`Problem with file extension for file: ${fileName.join('.')} \n
                Allowed file extensions are ${JSON.stringify(allowedExtensions)}` )
            }

        } catch (e) {
            throw e;
        }
    }

}
