;
var PieChart = (function (CONFIG, $, Handlebars) {
    
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
     * @param {Array} parties
     * @constructor
     */
    function PieChart(parties) {
        this.data = setupData(parties);
        this.chartElement = document.querySelector('#party-results #pie-chart');
        this.keyElement = document.querySelector('#party-results #pie-chart-key');
        this.render();
    }


    /**
     * Render it
     */
    PieChart.prototype.render = function render() {

        var keyTarget = document.querySelector('#pie-chart-key-template');

        this.keyElement.innerHTML = Handlebars.compile(keyTarget.innerHTML).call(this, {
            parties: this.data.keyData
        });

        new Chartist.Pie(this.chartElement, this.data.chartData, options, responsiveOptions);
    };

    return PieChart;


})(VFP_DATA_CONFIG, jQuery.noConflict(), Handlebars);