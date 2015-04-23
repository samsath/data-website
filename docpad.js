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
            retainName: 'yes',
            environments: {
                development: {
                    enabled: false
                }
            }
        }
    },
    environments: {
        production: {
            outPath: 'build'
        },
        development: {
            templateData: {
                // Stub the asset plugin for development
                asset: function(assetPath) {
                    return assetPath;
                }
            }
        }
    }
};

// Export the DocPad Configuration
module.exports = docpadConfig
