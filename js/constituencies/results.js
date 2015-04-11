; var ConstituencyResults = (function(CONFIG, d3, _, nimble) {

    var config;
    var cache = {};

    function init() {
        setEventHandlers();

        nimble.parallel([
            // Load list of constituencies
            function(callback) {
                d3.json(CONFIG.apiBaseUrl + '/constituencies.json', handleConstituenciesList(callback));
            },
            // Load constituency results HTML template
            function(callback) {
                d3.text('/partials/constituency-results.html', templateLoaded(callback));
            }
        ], checkLocationHash);
    }

    function setEventHandlers() {

        d3.selectAll('.tabber__nav a').on('click', function() {
            d3.event.preventDefault();
            toggleTab(d3.select(d3.event.target));
        });
    }

    function toggleTab(activeAnchor) {

        // Clear selected tabber nav item
        d3.select('a.tabber__nav__link[aria-selected="true"]').attr('aria-selected', null);

        // Highlight active tabber nav item
        activeAnchor.attr('aria-selected', 'true');

        var tabElement = activeAnchor.attr('href');

        // Toggle active tab element
        d3.select('.tabber__tab.active').classed({ active: false }).node().scrollIntoView();
        d3.select(tabElement).classed({ active: true });
    }

    function loadConstituencyResults(loadConfig) {
        config = loadConfig;

        d3.json(CONFIG.apiBaseUrl + '/constituencies/' + config.slug + '/results.json', function(err, constituencyResults) {
            if (err) {
                d3.select('#constituency-results')
                    .html('<div class="l-constrain l-constrain--pad-up">Oops, we couldn\'t load results for that constituency - there may not be any yet.</div>');

                toggleTab(d3.select('.tabber__nav__link[href="#constituency-results"]'));

                return console.error(err);
            }

            displayPartyResults(constituencyResults);
            toggleTab(d3.select('.tabber__nav__link[href="#constituency-results"]'));
        });
    }

    function handleConstituenciesList(callback) {

        return function(err, constituencies) {
            if (err) {
                return console.error(err);
            }

            cache.constituencies = constituencies;d

            var ul = document.createElement('ul');
            var constituenciesList = d3.select(ul);

            var liSelection = constituenciesList.selectAll('li')
                .data(constituencies)
                .enter()
                .append('li');

            liSelection.append('a')
                .attr('href', function(d) { return '#' +  d.constituency_slug; })
                .text(function(d) { return d.constituency_name; })
                .on('click', function(d) {
                    loadConstituencyResults({ slug: d.constituency_slug, name: d.constituency_name });
                });

            d3.select('#constituencies-list').node().appendChild(constituenciesList.node());

            callback();
        };
    }

    function templateLoaded(callback) {

        return function(err, htmlTemplate) {
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
                    loadConstituencyResults({ slug: constituencyFound.constituency_slug, name: constituencyFound.constituency_name });
                }
            }
        }
    }

    function displayPartyResults(constituencyResults) {

        var data = setupData(constituencyResults.parties);
        var constituencyResultsTab = d3.select('#constituency-results');

        // Show 'Results' tabber nav item
        d3.select('a.tabber__nav__link.hidden').classed({ hidden: false });

        // Set constituency results HTML template
        constituencyResultsTab.html(cache.htmlTemplate);

        // Set constituency name
        d3.select('.survey-results__section-title .constituency-name').text(config.name);

        // Set surveys count
        d3.select('.survey-results__total .completed-count').text(constituencyResults.surveys_count);

        // Display results
        displayChartKey(data.keyData);
        displayPieChart(data.chartData);
    }

    function displayChartKey(keyData) {

        var html = '';

        // TODO - Template properly
        _.forEach(keyData, function(keyItem) {

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
            labelInterpolationFnc: function(value) {
                return value[0];
            }
        };

        var responsiveOptions = [
            ['screen and (min-width: 100px)', {
                chartPadding: 0,
                labelOffset: 30,
                labelDirection: 'explode',
                labelInterpolationFnc: function(value) {
                    return value;
                }
            }]
        ];

        new Chartist.Pie(chartContainer, chartData, options, responsiveOptions);
    }

    function setupData(data) {

        // Turn the data provided into one the chart can use
        var chartData = { labels: [], series: []};

        var keyData = [];

        var total = _.reduce(_.pluck(data, 'party_votes' ), function (sum, num) {
            return parseInt(sum,10) + parseInt(num, 10);
        });

        _.forEach(data, function (segment) {

            var percent = Math.round((( parseInt(segment.party_votes,10) / total) * 100) * 10) /10;

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
                data: parseInt(segment.party_votes,10), className: 'pie-chart--' + segment.party_slug
            });
        });

        return {
            chartData: chartData,
            keyData: keyData
        };
    }

    init();

})(VFP_DATA_CONFIG, d3, _.noConflict(), _);
