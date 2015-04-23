'use strict';
var Grapnel = require('grapnel');

var navCollapsedClass = 'navigation--collapsed';
var nav = document.getElementById('navigation');
var navToggle = document.getElementById('navigation-toggle');

var Countries = require('./countries/countries');
var ConsituencyLeadingParties = require('./constituencies/leading-parties');
var ConstituencyResults = require('./constituencies/results');


var router = new Grapnel({
    pushState: true,
    root: '/'
});

// Hide navgation by default
nav.classList.add(navCollapsedClass);

// Handle toggling of navigation
navToggle.onclick = function(e) {
    if (nav.classList.contains(navCollapsedClass)) {
        nav.classList.remove(navCollapsedClass);
    } else {
        nav.classList.add(navCollapsedClass);
    }
};

/**
 * Country routes
 */
router.get(/countries\/results/, function () {
    new Countries();
});

/**
 * Constituency routes
 */
router.get(/constituencies\/leading-parties/, function () {
    new ConsituencyLeadingParties();
});

router.get(/constituencies\/results/, function () {
    new ConstituencyResults();
});
