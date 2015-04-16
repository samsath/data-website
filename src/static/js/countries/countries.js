'use strict';

var CountryTabs = require('./country-tabs');
var Grapnel = require('grapnel');
var $ = require('jQuery');

var VFP_DATA_CONFIG = require('../config');

function Countries() {

    var router = new Grapnel();

    $.getJSON(VFP_DATA_CONFIG.apiBaseUrl + '/countries.json').then(function (countries) {
        var tabs = new CountryTabs(countries, '#country-tab-list-template', '#country-tab-list');
        router.get('countries/:slug', tabs.handleRequest.bind(tabs));
    });

}

module.exports = Countries;