var d3 = require('d3');
var _ = require('lodash');
var nimble = require('nimble');
var Handlebars = require('Handlebars');
var Chartist = require('chartist');
var CONFIG = require('../config');
var Autocomplete = require('../autocomplete');

var cache = {};

function init() {
    nimble.parallel([
        // Load list of constituencies
        function (callback) {
            d3.json(CONFIG.apiBaseUrl + '/constituencies.json', handleConstituenciesList(callback));
        },
        // Load constituency results HTML template
        function (callback) {
            d3.text('/partials/constituency-results.html', templateLoaded(callback));
        }
    ], checkLocationHash);
}

function loadConstituencyResults(constituency) {

    d3.json(CONFIG.apiBaseUrl + '/constituencies/' + constituency.slug + '/results.json', function (err, constituencyResults) {
        if (err) {
            d3.select('#constituency-results')
                .html('<div class="l-constrain l-constrain--pad-up">Oops, we couldn\'t load results for that constituency - there may not be any yet.</div>');
        }

        displayPartyResults(constituencyResults, constituency);
    });
}

function handleConstituenciesList(callback) {

    return function (err, constituencies) {
        if (err) {
            return console.error(err);
        }

        cache.constituencies = constituencies;

        var container = document.querySelector('#constituencies-list');

        container.innerHTML = Handlebars.compile(document.querySelector('#constituency-list-template').innerHTML)({
            constituencies: constituencies
        });

        var autocomplete = new Autocomplete('constituency-search', {valueNames: ['constituency']});

        autocomplete.list.addEventListener('click', function (ev) {

            var element = ev.target;

            if (element.tagName !== 'A') {
                return;
            }

            loadConstituencyResults({
                slug: element.getAttribute('data-constituency-slug'),
                name: element.getAttribute('data-constituency-name')
            });

            // Set the name in search when clicked
            document.querySelector('.search').value = element.getAttribute('data-constituency-name');

            autocomplete.hideCompletions();

        });

        callback();
    };
}

function templateLoaded(callback) {

    return function (err, htmlTemplate) {
        if (err) {
            return console.error(err);
        }

        // Store template for future use
        cache.htmlTemplate = htmlTemplate;

        callback();
    };
}

function checkLocationHash() {

    // Check if a constituency has been specified in the URL
    if (location.hash) {
        var locationHash = location.hash.substr(1);
        if (Array.prototype.indexOf !== 'undefined') {
            // Is constituency valid?
            var constituencyFound = _.find(cache.constituencies, 'constituency_slug', locationHash);
            if (constituencyFound && constituencyFound.constituency_slug === locationHash) {
                // Load constituency results
                loadConstituencyResults({
                    slug: constituencyFound.constituency_slug,
                    name: constituencyFound.constituency_name
                });
            }
        }
    }
}

function displayPartyResults(constituencyResults, constituency) {

    var data = setupData(constituencyResults.parties);
    var constituencyResultsTab = d3.select('#constituency-results');

    // Set constituency results HTML template
    constituencyResultsTab.html(cache.htmlTemplate);

    // Set constituency name
    d3.select('.survey-results__section-title .constituency-name').text(constituency.name);

    // Set surveys count
    d3.select('.survey-results__total .completed-count').text(constituencyResults.surveys_count);

    // Display results
    displayChartKey(data.keyData);
    displayPieChart(data.chartData);
}

function displayChartKey(keyData) {

    var html = '';

    // TODO - Template properly
    _.forEach(keyData, function (keyItem) {

        html += '\
                <div class="party-block party-block--' + keyItem.slug + '">\
                    <dl class="hgroup party-block__policy-party">\
                        <dd class="h-group__main">\
                            <span class="party-block__party"> ' + keyItem.name + ' </span>\
                            <img src="/img/parties/' + keyItem.slug + '.png" alt=""\
                                 class="party-block__party-logo"/>\
                        </dd>\
                        <dt class="h-group__lead">' + keyItem.percentage + '</dt>\
                    </dl>\
                </div>';
    });

    d3.select('.survey-results__percentages').html(html);
}

function displayPieChart(chartData) {
    if (typeof Chartist === 'undefined') {
        return;
    }

    var chartContainer = d3.select('.pie-chart').node();

    var options = {
        labelInterpolationFnc: function (value) {
            return value[0];
        }
    };

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

    new Chartist.Pie(chartContainer, chartData, options, responsiveOptions);
}

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

module.exports = init;
