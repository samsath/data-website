var navCollapsedClass = 'navigation--collapsed';

var nav = document.getElementById('navigation');
var navToggle = document.getElementById('navigation-toggle');

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
