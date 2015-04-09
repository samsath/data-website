;
(function(CONFIG, $, router) {

    var countriesPromise = $.getJSON(CONFIG.apiBaseUrl + '/countries.json');

    countriesPromise.then(function (countries) {
        var tabs = new CountryTabs(countries, '#country-tab-list-template', '#country-tab-list');
        router.get('countries/:slug', tabs.handleRequest.bind(tabs));
    });

})(VFP_DATA_CONFIG, jQuery.noConflict(), new Grapnel());