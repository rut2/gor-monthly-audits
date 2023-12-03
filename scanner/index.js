const {PROJECT_ROOT_DIR} = require ("../constants");

const fileCabinet = require('../helpers/fileSystem');
const validator = require('./validators');
const pdfParser = require('./pdfParser')



module.exports = {
    scan: () => {
        // validate all input files placed in /data/pdf
        const files = validateFiles();

        // parse pdf files
        parseFiles(files);


    },
}

function validateFiles() {
    const {dirname} = require('path');
    const appDir = dirname(require.main.filename);

    const files = fileCabinet.getFiles(`${PROJECT_ROOT_DIR}/data/pdf`);

    console.log("file", files)

    try {
        // naming convention check
        files.forEach((file) => {
            validator.validateName(file)
        });

        console.info("all validation passed.")

    } catch (e) {
        console.log("validation failed: ", e);
    }

    return files;


}

function parseFiles(files) {

    files.forEach((file) => {
        pdfParser.parse(file)
    })

}
