var CountryResults = require('./country-results');
var $ = require('jQuery');
var Handlebars = require('Handlebars');
var _ = require('lodash');

var VFP_DATA_CONFIG = require('../config');

var cached = {};

/**
 * The tabs
 *
 * @param countries
 * @param templateSelector
 * @param templateTargetSelector
 * @constructor
 */
function CountryTabs(countries, templateSelector, templateTargetSelector) {
    this.countries = _.reject(countries, 'slug', 'northern-ireland');

    this.templateSelector = templateSelector;
    this.templateTargetSelector = templateTargetSelector;

    this.render();
}

/**
 * Handle a request to a specific country tab
 * @param req
 */
CountryTabs.prototype.handleRequest = function handleRequest(req) {

    var country = _.find(this.countries, {slug: req.params.slug});

    this.countries.forEach(function (_country) {
        _country.selected = false;
    });

    country.selected = true;

    this.render();
    this.renderTab(country);
};

/**
 * Create the new country CountryResults
 * @param country
 */
CountryTabs.prototype.renderTab = function renderTab(country) {

    var countryUrl = VFP_DATA_CONFIG.apiBaseUrl + '/countries/' + country.slug + '/results.json';

    if (cached[countryUrl]) {
        return new CountryResults(country, cached[countryUrl]);
    }

    $.getJSON(countryUrl).then(function (results) {
        new CountryResults(country, results);
        cached[countryUrl] = results;
    });
};

/**
 * Render the tabs
 */
CountryTabs.prototype.render = function render() {

    var template = document.querySelector(this.templateTargetSelector);

    template.innerHTML = Handlebars.compile(document.querySelector(this.templateSelector).innerHTML).call(this, {
        countries: this.countries
    });

};

module.exports = CountryTabs;
