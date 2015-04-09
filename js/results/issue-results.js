;
var IssueResults = (function(CONFIG, $, Handlebars) {

    function IssueResults(issues) {


        issues.forEach(function (issue) {

            issue.total = _.reduce(issue.results, function (total, results) {
                return total += parseInt(results.votes, 10);
            }, 0);


            issue.results.forEach(function (partyResult) {
                partyResult.percent = (parseInt(partyResult.votes, 10) / issue.total) * 100;
            });

        });

        this.issues = _.sortBy(issues, function (issue) {
            return -issue.total;
        });

        this.render();
    }

    IssueResults.prototype.render = function render() {
        var template = document.querySelector('#issue-results');
        template.innerHTML = Handlebars.compile(document.querySelector('#issue-results-template').innerHTML)({
            issues: this.issues
        });
    };

    Handlebars.registerHelper('inc', function(value) {
        return parseInt(value) + 1;
    });

    Handlebars.registerHelper('round', function (value) {
        return Math.round(value * 10) / 10;
    });

    Handlebars.registerHelper('roundToInt', function (value) {
        return Math.round(value);
    });

    Handlebars.registerHelper('thousands', function (value) {
        var rounded = Math.round((value / 1000) * 10) / 10;
        return rounded + 'k';
    });

    return IssueResults;

})(VFP_DATA_CONFIG, jQuery.noConflict(), Handlebars);