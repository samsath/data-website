'use strict';

var _ = require('lodash');


/**
 * A bit of a wrapper for the List class
 */

'use strict';
/**
 * Constructor
 * @param {string} form    dom ID of form element
 * @param {object} options List construtor options
 */
function Autocomplete(form, options) {

    if (!window.document.getElementById(form)) {
        throw new Error('No dom element found for' + form);
    }

    if (!window.List) {
        throw new Error('Could not find List global. Maybe list.js is not included?');
    }

    this.form = new window.List(form, options);

    this.list = this.form.list;

    this.init();
}

/**
 * Kick off pre-defined behaviours
 */
Autocomplete.prototype.init = function () {
    // hide by default
    this.hideCompletions();
    this.setHandlers();
};

/**
 * Hides the completion options
 */
Autocomplete.prototype.hideCompletions = function () {
    this.list.style.display = 'none';
};

/**
 * Shows the completion options
 */
Autocomplete.prototype.showCompletions = function () {
    this.list.style.display = 'block';
};

/**
 * Set default event handlers
 */
Autocomplete.prototype.setHandlers = function () {

    // Show the list when search starts
    this.form.on('searchStart', _.bind(function () {
        this.showCompletions();
    }, this));

    // Hide list when its empty
    this.form.on('searchComplete', _.bind(function () {
        if (!this.form.searched) {
            this.hideCompletions();
        }
    }, this));

};

// Be nice to have modules :)
module.exports = Autocomplete;
