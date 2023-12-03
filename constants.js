const {dirname} = require("path");

module.exports = {
    PROJECT_ROOT_DIR: `${dirname(require.main.filename)}/..`
}
