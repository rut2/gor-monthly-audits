const {PDF_PARSE_TEMP_DIR_PATH, PDF_FILES_DIR} = require("../constants");

const fileCabinet = require('../helpers/fileSystem');
const validator = require('./validators');
const pdfParser = require('./pdfParser')
const {getFiles, getFileNameFromPath, createFileReadStream} = require("../helpers/fileSystem");

const ICICIProcessor = require("./bankParsers/icici")


module.exports = {
    scan: async (args) => {
        // process arguments
        // console.log(args);

        // validate all input files placed in /data/pdf
        // const files = validateFiles();

        // parse pdf files
        // parseFiles(files);

        await processTempFiles();

        // process.exit(0);
    },
}

function validateFiles() {
    const {dirname} = require('path');
    const appDir = dirname(require.main.filename);

    const files = fileCabinet.getFiles(`${PDF_FILES_DIR}`);

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

async function processTempFiles() {

    const tempFiles = getFiles(PDF_PARSE_TEMP_DIR_PATH);

    const icici = new ICICIProcessor();

    tempFiles.forEach((file) => {

        icici.processTempFile(file)

        /*createFileReadStream(file, 'DateDescriptionAmountType', (err) => {
            if (err) {
                console.error('Error during file processing:', err);
            } else {
                console.log('File reading completed.');
            }
        });*/


    })


}
