// DocPad Configuration File
// http://docpad.org/docs/config

// Define the DocPad Configuration
var docpadConfig = {
    plugins: {
        cleanurls: {
            enabled: true
        },
        assets: {
            enabled: true,
            retainName: 'yes'
        }
    },
    environments: {
        production: {
            outPath: 'build'
        }
    }
};

// Export the DocPad Configuration
module.exports = docpadConfig
