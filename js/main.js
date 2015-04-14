var Grapnel = require('grapnel');

var navCollapsedClass = 'navigation--collapsed';
var nav = document.getElementById('navigation');
var navToggle = document.getElementById('navigation-toggle');

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
router.get(/countries\/results/, require('./countries/countries'));

/**
 * Constituency routes
 */
router.get(/constituencies\/leading-parties/, require('./constituencies/leading-parties'));
router.get(/constituencies\/results/, require('./constituencies/results'));