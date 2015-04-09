;
var CountryTabs = (function(CONFIG, $, Handlebars) {

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
        $.getJSON(CONFIG.apiBaseUrl + '/countries/' + country.slug + '/results.json').then(function (results) {
            new CountryResults(country, results);
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


    return CountryTabs;

})(VFP_DATA_CONFIG, jQuery.noConflict(), Handlebars);