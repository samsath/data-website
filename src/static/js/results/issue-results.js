'use strict';

var $ = require('jQuery');
var _ = require('lodash');
var Handlebars = require('Handlebars');


var issueResultsTemplatePromise = $.ajax({
    url: '/partials/results/issue-results.html',
    dataType: 'text'
}).then(function (html) {
    return Handlebars.compile(html);
});

var issueResultTemplatePromise = $.ajax({
    url: '/partials/results/issue-result.html',
    dataType: 'text'
}).then(function (html) {
    return Handlebars.compile(html);
});

/**
 * Calculate the total votes for all parties for a particular issue
 * @param issue
 * @returns {int}
 */
function sumIssueVotes(issue) {
    return _.reduce(issue.results, function (total, results) {
        return total + parseInt(results.votes, 10);
    }, 0);
}

/**
 * Add the total votes and party percentage for each issue to the issue objects
 *
 * @param issues
 * @returns {*}
 */
function formatIssuesForView(issues) {
    return _(issues)
        .forEach(function (issue) {
            issue.total = sumIssueVotes(issue);
            issue.results.forEach(function (partyResult) {
                partyResult.percent = (parseInt(partyResult.votes, 10) / issue.total) * 100;
            });
        })
        .sortBy(function (issue) {
            return -issue.total;
        })
        .value()
        ;
}

/**
 * IssueResults is for displaying a collection of issue results
 *
 * @param issues
 * @param target
 * @constructor
 */
function IssueResults(issues, target) {
    this.target = target || '#issue-results';

    this.issues = formatIssuesForView(issues).map(function (issue, i) {
        issue.rank = i;
        return new IssueResult(issue);
    });

    this.render();
}

/**
 * IssueResult is for one particular issue
 *
 * @param issue
 * @constructor
 */
function IssueResult(issue) {
    this.selected = issue.results[0];
    _.assign(this, issue);
}

/**
 * Render a whole component
 */
IssueResult.prototype.render = function render() {

    var target = document.querySelector('.issue-' + this.issue_slug);

    issueResultTemplatePromise.then(function (compiledTemplateFn) {

        target.innerHTML = compiledTemplateFn(this);

        $(target).on('mouseover', 'li', this, function (e) {
            e.data.selectResult(e.data.results[$(this).index()]);
        });

        $(target).on('mouseout', 'li', this, function (e) {
            e.data.selectResult(e.data.results[0]);
        });

    }.bind(this));

};

/**
 * Toggle the selected result to the passed in result
 * @param result
 */
IssueResult.prototype.selectResult = function selectResult(result) {
    this.selected = result;
    this.renderSelected();
};

/**
 * Render just the leader selections
 * Bit minging but hey ho
 */
IssueResult.prototype.renderSelected = function renderSelected() {

    var target = document.querySelector('.issue-' + this.issue_slug);

    issueResultTemplatePromise.then(function (compiledTemplateFn) {

        var className = 'result-issue-total__leader';
        target.getElementsByClassName(className)[0].innerHTML = $(compiledTemplateFn(this)).find('.' + className).html();

    }.bind(this));

};

/**
 * Render this IssueResults
 */
IssueResults.prototype.render = function render() {
    var target = document.querySelector(this.target);
    issueResultsTemplatePromise.then(function (compiledTemplateFn) {

        target.innerHTML = compiledTemplateFn({
            issues: this.issues
        });

        this.issues.forEach(function (issue) {
            issue.render();
        });

    }.bind(this));
};

/**
 * Increment helper
 */
Handlebars.registerHelper('inc', function (value) {
    return parseInt(value) + 1;
});

/**
 * Round to 1 decimal place helper
 */
Handlebars.registerHelper('round', function (value) {
    return Math.round(value * 10) / 10;
});

/**
 * Round to integer helper
 */
Handlebars.registerHelper('roundToInt', function (value) {
    return Math.round(value);
});

/**
 * Format a number larger then 10,000 to "100.3k" format helper
 */
Handlebars.registerHelper('thousands', function (value) {
    if (value < 10000) {
        return value;
    }
    var rounded = Math.round((value / 1000) * 10) / 10;
    return rounded + 'k';
});

module.exports = IssueResults;
