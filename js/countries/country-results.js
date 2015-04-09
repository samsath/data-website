;
var CountryResults = (function(CONFIG, $, Handlebars) {


    function CountryResults (country, results) {

        this.country = country;
        this.render();

        this.issueResults = new IssueResults(results.issues);

    }

    CountryResults.prototype.render = function render () {
        var template = document.querySelector('#country-results');
        template.innerHTML = Handlebars.compile(document.querySelector('#country-results-template').innerHTML)(this.country);
    };


    return CountryResults;

})(VFP_DATA_CONFIG, jQuery.noConflict(), Handlebars);