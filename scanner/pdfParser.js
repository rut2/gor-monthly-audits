const fs = require('fs');
const pdf = require('pdf-parse');
const {createDirectoryIfNotExists, getFileNameFromPath} = require("../helpers/fileSystem");
const { PDF_PARSE_TEMP_DIR_PATH } = require("../constants");

module.exports = {
    parse: (filePath) => {

        let dataBuffer = fs.readFileSync(filePath);

        pdf(dataBuffer).then(function(data) {

            // create temp folder to store parsed output into a file
            createDirectoryIfNotExists(PDF_PARSE_TEMP_DIR_PATH);

            // write pdf text to text file.
            const tempFileName = PDF_PARSE_TEMP_DIR_PATH + getFileNameFromPath(filePath).join('.') + '.temp';

            fs.writeFile(tempFileName, data.text.trim(), (err) => {
                if (err) {
                    console.error('Error writing to file:', err);
                } else {
                    console.log(`Text successfully written to ${filePath}`);
                }
            });
        });
    }

}
