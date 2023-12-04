const {dirname} = require("path");

const projectRoot = `${dirname(require.main.filename)}/..`;

module.exports = {
    PROJECT_ROOT_DIR: projectRoot,
    PDF_FILES_DIR: `${projectRoot}/data/pdf`,
    PDF_PARSE_TEMP_DIR_PATH: `${projectRoot}/data/pdf/temp/`
}
