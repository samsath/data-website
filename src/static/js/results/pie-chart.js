'use strict';

var $ = require('jQuery');
var _ = require('lodash');
var Handlebars = require('Handlebars');
var Chartist = require('chartist');

var pieChartResultsTemplatePromise = $.ajax({
    url: '/partials/results/pie-chart.html',
    dataType: 'text'
}).then(function (html) {
    return Handlebars.compile(html);
});

var responsiveOptions = [
    ['screen and (min-width: 100px)', {
        chartPadding: 0,
        labelOffset: 30,
        labelDirection: 'explode',
        labelInterpolationFnc: function (value) {
            return value;
        }
    }]
];

var options = {
    labelInterpolationFnc: function (value) {
        return value[0];
    }
};

/**
 * Format a constituency data for the pie-chart
 *
 * @param data
 * @returns {{chartData: {labels: Array, series: Array}, keyData: Array}}
 */
function setupData(data) {

    // Turn the data provided into one the chart can use
    var chartData = {labels: [], series: []};

    var keyData = [];

    var total = _.reduce(_.pluck(data, 'party_votes'), function (sum, num) {
        return parseInt(sum, 10) + parseInt(num, 10);
    });

    _.forEach(data, function (segment) {

        var percent = Math.round((( parseInt(segment.party_votes, 10) / total) * 100) * 10) / 10;

        keyData.push({
            name: segment.party_name,
            slug: segment.party_slug,
            percentage: percent + '%'
        });

        if (percent >= 5) {
            chartData.labels.push(percent + '%');
        } else {
            chartData.labels.push('');
        }

        chartData.series.push({
            data: parseInt(segment.party_votes, 10), className: 'pie-chart--' + segment.party_slug
        });
    });

    return {
        chartData: chartData,
        keyData: keyData
    };
}

/**
 * Renders a pie-chart and key for a given set of parties data
 *
 * @param {Array} results
 * @param {string} target       css selector
 * @constructor
 */
function PieChart(results, target) {

    this.total = parseInt(results.surveys_count, 10);
    this.parties = setupData(results.parties);

    this.target = document.querySelector(target || '#pie-chart-results');

    this.render();
}


/**
 * Render it
 */
PieChart.prototype.render = function render() {

    pieChartResultsTemplatePromise.then(function (compiledTemplateFn) {

        this.target.innerHTML = compiledTemplateFn({
            parties: this.parties.keyData,
            total: this.total
        });

        new Chartist.Pie(document.querySelector('#pie-chart'), this.parties.chartData, options, responsiveOptions);

    }.bind(this));

};

module.exports = PieChart;
