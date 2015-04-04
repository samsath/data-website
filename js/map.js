;
(function (CONFIG, d3, Handlebars) {

    function slugify(text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    }

    function Map(mapSelector, tableSelector) {

        var parentElement = document.querySelector(mapSelector);

        var e = document.createElement('object');
        e.data = "/img/blank-simplified-map.svg";
        e.type = "image/svg+xml";
        e.width = 594;
        e.height = 806;
        e.addEventListener('load', _.bind(this.onSvgLoaded, this));

        this.element = e;
        this.centered = null;
        this.tableSelector = tableSelector;

        this.topoJson = d3.promise.json('/json/gb/topo_wpc.json');
        this.apiJson = d3.promise.json(CONFIG.apiBaseUrl + '/constituencies/results/parties.json?filters=leading');

        this.apiJson.then(_.bind(this.tabulate, this));

        parentElement.appendChild(e);
    }

    Map.prototype.onSvgLoaded = function onSvgLoaded(e) {

        var svgDocument = e.target.getSVGDocument().documentElement;

        svgDocument.addEventListener('click', _.bind(function (e) {
            if (e.target.nodeName === 'svg') {
                this.toggleSelectedArea();
            }
        }, this));

        // Select the map SVG element
        var svg = d3.select(svgDocument);

        this.g = svg.select('g');

        // Set up projection
        this.projection = d3.geo.albers()
            .rotate([0, 0]);

        this.path = d3.geo.path()
            .projection(this.projection);

        this.projection
            .scale(1)
            .translate([0, 0]);

        this.topoJson.then(_.bind(this.addClickListeners, this));

        this.addMapClasses();
    };

    Map.prototype.addClickListeners = function addClickListeners(boundaries) {
        // Compute correct bounds and scaling from the TopoJSON
        var b = this.path.bounds(topojson.feature(boundaries, boundaries.objects['wpc']));
        var s = .95 / Math.max((b[1][0] - b[0][0]) / this.element.width, (b[1][1] - b[0][1]) / this.element.height);
        var t = [(this.element.width - s * (b[1][0] + b[0][0])) / 2, (this.element.height - s * (b[1][1] + b[0][1])) / 2];

        this.projection
            .scale(s)
            .translate(t);

        this.g.selectAll('.area')
            .data(topojson.feature(boundaries, boundaries.objects['wpc']).features)
            .on('click', _.bind(this.toggleSelectedArea, this));
    };

    // Select a map area
    Map.prototype.toggleSelectedArea = function toggleSelectedArea(d) {

        // Handle map zooming
        var x, y, k;
        var changedArea = false;

        if (d && this.centered !== d) {
            var centroid = this.path.centroid(d);
            x = centroid[0];
            y = centroid[1];
            k = 8;
            this.centered = d;
            changedArea = true;

        } else {
            x = this.element.width / 2;
            y = this.element.height / 2;
            k = 1;
            this.centered = null;
        }

        // Highlight area
        this.g.selectAll("path")
            .classed({
                selected: (this.centered && _.bind(function (d) {
                    return d === this.centered;
                }, this))
            });

        // Remove currently highlighted table row
        d3.select(this.tableSelector + ' .selected')
            .classed({selected: false});

        if (this.centered && changedArea) {
            // Highlight corresponding table row

            var slugified = slugify(d.properties.PCON13NM);
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
        this.g.transition()
            .duration(750)
            .attr("transform", "translate(" + this.element.width / 2 + "," + this.element.height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
            .style("stroke-width", 1 / k + "px");
    };

    Map.prototype.tabulate = function tabulate(data) {

        var table = document.querySelector(this.tableSelector);

        table.innerHTML = Handlebars.compile(document.querySelector('#constituency-list').innerHTML)({
            constituencies: data
        });

        table.addEventListener('click', _.bind(function (e) {
            var mapElement = this.g.select('.' + e.target.parentNode.classList.item(0));
            this.toggleSelectedArea(mapElement.data()[0]);
        }, this));

    };

    Map.prototype.addMapClasses = function loadData() {
        var svgDoc = this.element.contentDocument || this.element.getSVGDocument();
        this.apiJson.then(function (constituencies) {
            _.forEach(constituencies, function (constituency) {
                var constituencyNode = svgDoc.querySelector('.' + slugify(constituency.constituency_name));
                constituencyNode.classList.add('party-' + constituency.party_name.toLowerCase().replace(/ /g, '-'));
            });
        });
    };


    Handlebars.registerHelper('slugify', slugify);
    new Map('#map', '#constituency-rows');


})(VFP_DATA_CONFIG, d3, Handlebars);
