var Handlebars = require('Handlebars');

var IssueResults = require('../results/issue-results');
var PieChart = require('../results/pie-chart');

/**
 * Handles a particular countries results (issue results and total party pie chart)
 *
 * @param country
 * @param results
 * @constructor
 */
function CountryResults (country, results) {
    this.country = country;
    this.render();
    new PieChart(results);
    new IssueResults(results.issues);
}

/**
 * Render the country results template
 */
CountryResults.prototype.render = function render () {
    var template = document.querySelector('#country-results');
    template.innerHTML = Handlebars.compile(document.querySelector('#country-results-template').innerHTML)(this.country);
};

module.exports = CountryResults;
