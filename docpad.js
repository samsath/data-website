// DocPad Configuration File
// http://docpad.org/docs/config

// Define the DocPad Configuration
var docpadConfig = {
    environments: {
        static: {
            plugins: {
                cleanurls: {
                    static: false	
                }
            }
        }
    }
};

// Export the DocPad Configuration
module.exports = docpadConfig
