'use strict';

var $ = require('jQuery');
var _ = require('lodash');
var Handlebars = require('Handlebars');
var VFP_CONFIG_DATA = require('../config');
var Autocomplete = require('../autocomplete');
var Grapnel = require('Grapnel');
var PieChart = require('../results/pie-chart');
var IssueResults = require('../results/issue-results');
var cache = {};

/**
 * Get the API url for a specific constituency
 *
 * @param {string} slug
 * @returns {string}
 */
function getConstituencyUrl(slug) {
    return VFP_CONFIG_DATA.apiBaseUrl + '/constituencies/' + slug + '/results.json';
}

/**
 * ConstituencyResults
 *
 * @constructor
 */
function ConstituencyResults() {

    this.router = new Grapnel();
    this.constituenciesPromise = $.getJSON(VFP_CONFIG_DATA.apiBaseUrl + '/constituencies.json');

    this.listTemplateFn = Handlebars.compile(document.querySelector('#constituency-list-template').innerHTML);
    this.titleTemplateFn = Handlebars.compile(document.querySelector('#constituency-title-template').innerHTML);

    this.titleElement = document.querySelector('#constituency-title');
    this.originalTitleHtml = this.titleElement.innerHTML;
    this.listContainerElement = document.querySelector('#constituencies-list');

    this.list = this.initializeSearch();
    this.initializeRouter();
}

/**
 * Start the router listening for a constituncy slug hash change
 */
ConstituencyResults.prototype.initializeRouter = function initializeRouter() {

    this.router.get('', function () {
        this.titleElement.innerHTML = this.originalTitleHtml;
        document.querySelector('#pie-chart-results').innerHTML = '';
        document.querySelector('#issue-results').innerHTML = '';
        this.list.then(function (list) {
            list.querySelector('.search').value = '';
        });
    }.bind(this));

    this.router.get(':constituencySlug', function (req) {
        this.loadConstituency(req.params.constituencySlug);
    }.bind(this));
};

/**
 * Boot up the search results after we've loaded the constituencies
 */
ConstituencyResults.prototype.initializeSearch = function initializeSearch() {

    return this.constituenciesPromise.then(function (constituencies) {

        var autocomplete;

        this.listContainerElement.innerHTML = this.listTemplateFn({
            constituencies: constituencies
        });

        autocomplete = new Autocomplete('constituency-search', {valueNames: ['constituency']});
        autocomplete.list.addEventListener('click', autocomplete.hideCompletions.bind(autocomplete));

        return this.listContainerElement;

    }.bind(this));
};

/**
 * Update the constituencyName element with the one specified and the value in the search input
 * @param {string} constituencyName
 */
ConstituencyResults.prototype.updateTitle = function updateTitle(constituencyName) {

    this.list.then(function (list) {
        list.querySelector('.search').value = constituencyName;
    });

    this.titleElement.innerHTML = this.titleTemplateFn({name: constituencyName});
};

/**
 * Load a constituency by a particular slug
 * We wait until all the constituencies have loaded first and then set the input search value
 * Then cache the result of the GET request
 * Then create a new PieChart and a new IssueResults
 *
 * @param {string} slug
 */
ConstituencyResults.prototype.loadConstituency = function loadConstituency(slug) {

    this.constituenciesPromise.then(function (constituencies) {

        var constituency = _.find(constituencies, {constituency_slug: slug});

        this.updateTitle(constituency.constituency_name);

        if (!cache[constituency.constituency_slug]) {
            cache[constituency.constituency_slug] = $.getJSON(getConstituencyUrl(constituency.constituency_slug));
        }

        return cache[constituency.constituency_slug];

    }.bind(this)).then(function (constituency) {

        new PieChart(constituency);
        new IssueResults(constituency.issues);

    });
};

module.exports = ConstituencyResults;
