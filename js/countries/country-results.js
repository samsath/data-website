;
var CountryResults = (function(CONFIG, $, Handlebars) {

    /**
     * Handles a particular countries results (issue results and total party pie chart)
     *
     * @param country
     * @param results
     * @constructor
     */
    function CountryResults (country, results) {
        this.country = country;
        country.total = parseInt(results.surveys_count, 10);
        this.render();
        this.pieChart = new PieChart(results.parties);
        this.issueResults = new IssueResults(results.issues);
    }

    /**
     * Render the country results template
     */
    CountryResults.prototype.render = function render () {
        var template = document.querySelector('#country-results');
        template.innerHTML = Handlebars.compile(document.querySelector('#country-results-template').innerHTML)(this.country);
    };

    return CountryResults;

})(VFP_DATA_CONFIG, jQuery.noConflict(), Handlebars);