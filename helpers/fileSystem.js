const fs = require('fs');
const {last} = require("lodash");

module.exports = {
    // Recursive function to get files
    getFiles: (dir) => {
        let files = [];
        // Get an array of all files and directories in the passed directory using fs.readdirSync
        const fileList = fs.readdirSync(dir)
        // Create the full path of the file/directory by concatenating the passed directory and file/directory name
        for (const file of fileList) {
            const name = `${dir}/${file}`
            // Check if the current file/directory is a directory using fs.statSync
            if (fs.statSync(name).isDirectory()) {
                // If it is a directory, recursively call the getFiles function with the directory path and the files array
                // todo: fix this to scan directory recursively
                // getFiles(name, files)
            } else {
                // If it is a file, push the full path to the files array
                files.push(name)
            }
        }
        return files
    },

    // Function to create a directory if it doesn't exist
    createDirectoryIfNotExists: (directoryPath) => {
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath);
            console.log(`Directory created: ${directoryPath}`);
        } else {
            console.log(`Directory already exists: ${directoryPath}`);
        }
    },

    getFileNameFromPath: (path) => {
        return  last(path.split('/')).split('.');
    }
}
