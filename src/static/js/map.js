'use strict';

var Handlebars = require('Handlebars');
var _ = require('lodash');
var d3 = require('d3');
var topojson = require('topojson');

var CONFIG = require('./config');

/**
 * Gets a slugified version of a string
 *
 * @param {string} text
 * @returns {string}
 */
function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

/**
 * Map Class
 *
 * Intantiate a new map and data-table instance by passing in a css selector for where to place the map, and a css selector for where to put table results
 *
 * @param {string} mapSelector          Css selector
 * @param {string} tableSelector        Css selector
 * @constructor
 */
function Map(mapSelector, tableSelector) {

    var parentElement = document.querySelector(mapSelector);
    var e = document.createElement('object');

    e.data = "/img/blank-simplified-map.svg";
    e.type = "image/svg+xml";
    e.width = 594;
    e.height = 806;

    e.addEventListener('load', _.bind(this.onSvgLoaded, this));

    this.element = e;
    this.tableSelector = tableSelector;
    this.centered = null;
    this.unit = 'wpc';

    this.projection = d3.geo.albers().rotate([0, 0]);
    this.path = d3.geo.path().projection(this.projection);

    parentElement.appendChild(e);
}

/**
 * When the SVG is finished loading hook up D3 to the element and load the tpo_wpc.json so we can add click listeners
 * Requests the data from the API and initiates the data-table and maps the results to the SVG
 *
 * @param {Object} e     The 'load' event
 */
Map.prototype.onSvgLoaded = function onSvgLoaded(e) {

    var svgDocument = e.target.getSVGDocument().documentElement;
    //Hook up D3 to the SVG element
    var svg = d3.select(svgDocument);
    var graphics = svg.select('g');

    svgDocument.addEventListener('click', _.bind(function (e) {
        if (e.target.nodeName === 'svg') {
            //Zoom back out of the map because click was not on a particular constituency path
            this.getToggleSelectedAreaFn(graphics)();
        }
    }, this));

    d3.json(CONFIG.apiBaseUrl + '/constituencies/results/parties.json?filters=leading', _.bind(function (error, constituencies) {
        this.tabulate(graphics, constituencies);
        this.mapConstituencyResults(constituencies);
    }, this));

    d3.json('/json/gb/topo_wpc.json', _.bind(function (error, boundaries) {
        this.addClickListeners(graphics, boundaries);
    }, this));
};

/**
 * From a given TopoJSON json file (https://github.com/mbostock/topojson) that matches the SVG that is saved
 * Create click event listeners on constituency paths to scale/translate the map
 *
 * @param {*} graphics      <g> SVG element
 * @param {Object} boundaries
 */
Map.prototype.addClickListeners = function addClickListeners(graphics, boundaries) {

    var b, s, t;
    var toggleFunction = this.getToggleSelectedAreaFn(graphics);

    graphics.selectAll('.area')
        .data(topojson.feature(boundaries, boundaries.objects[this.unit]).features)
        .on('click', toggleFunction);

    this.projection
        .scale(1)
        .translate([0, 0]);

    // Compute correct bounds and scaling from the TopoJSON
    b = this.path.bounds(topojson.feature(boundaries, boundaries.objects[this.unit]));
    s = .95 / Math.max((b[1][0] - b[0][0]) / this.element.width, (b[1][1] - b[0][1]) / this.element.height);
    t = [(this.element.width - s * (b[1][0] + b[0][0])) / 2, (this.element.height - s * (b[1][1] + b[0][1])) / 2];

    this.projection
        .scale(s)
        .translate(t);

};

/**
 * Get a function that can be used to a zoom/scale to a particular path
 *
 * @param {*} graphics      <g> SVG element
 */
Map.prototype.getToggleSelectedAreaFn = function toggleSelectedArea(graphics) {

    /**
     * Scale and translate the map to a particular constituency, or zoom back out if already selected or nothing is passed in
     *
     * @param {Object} [constituencyPath]
     * @private
     */
    function toggleSelectedArea (constituencyPath) {
        // Handle map zooming
        var x, y, k;
        var changedArea = false;
        var slugified;

        if (constituencyPath && this.centered !== constituencyPath) {
            var centroid = this.path.centroid(constituencyPath);
            x = centroid[0];
            y = centroid[1];
            k = 8;
            this.centered = constituencyPath;
            changedArea = true;

        } else {
            x = this.element.width / 2;
            y = this.element.height / 2;
            k = 1;
            this.centered = null;
        }

        // Highlight area
        graphics.selectAll("path")
            .classed({
                selected: (this.centered && _.bind(function (d) {
                    return d === this.centered;
                }, this))
            });

        // Remove currently highlighted table row
        d3.select('#data_table .selected')
            .classed({selected: false});

        if (this.centered && changedArea) {
            // Highlight corresponding table row

            slugified = slugify(constituencyPath.properties.PCON13NM);
            //Slightly irritating exception due to accent.
            if (slugified === 'ynys-mon') {
                slugified = 'ynys-mn';
            }

            d3.select('.' + slugified)
                .classed({selected: true})
                .node()
                .scrollIntoView();
        }

        // Zoom in or out of area
        graphics.transition()
            .duration(750)
            .attr("transform", "translate(" + this.element.width / 2 + "," + this.element.height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
            .style("stroke-width", 1 / k + "px");
    }

    return _.bind(toggleSelectedArea, this);

};

/**
 * Using handlebars create DOM for the data-table from a given set of constituencies
 * Add event listener on to the table that zooms to a particular constituency
 *
 * @param {*} graphics      <g> SVG element
 * @param {Object[]} constituencies   An array of constituency data from the API
 */
Map.prototype.tabulate = function tabulate(graphics, constituencies) {

    var table = document.querySelector(this.tableSelector);

    table.innerHTML = Handlebars.compile(document.querySelector('#constituency-list').innerHTML)({
        constituencies: constituencies
    });

    table.addEventListener('click', _.bind(function (e) {
        var mapElement = graphics.select('.' + e.target.parentNode.classList.item(0));
        this.getToggleSelectedAreaFn(graphics)(mapElement.data()[0]);
    }, this));
};

/**
 * Add classes on to the constituency paths in the SVG from a given set of constituency results
 *
 * @param {Object[]} constituencies   An array of constituency data from the API
 */
Map.prototype.mapConstituencyResults = function mapConstituencyResults(constituencies) {
    var svgDoc = this.element.contentDocument || this.element.getSVGDocument();
    _.forEach(constituencies, function (constituency) {
        var constituencyNode = svgDoc.querySelector('.' + slugify(constituency.constituency_name));
        constituencyNode.classList.add('party-' + constituency.party_name.toLowerCase().replace(/ /g, '-'));
    });
};

Handlebars.registerHelper('slugify', slugify);

module.exports = Map;
