; (function(CONFIG, d3) {

    var width = 594, height = 806;

    var projection, svg, path, g;
    var boundaries, units;
    var centered;

    var constituencyResults = {};

    // ----

    function init(width, height) {

        // Set up projection
        projection = d3.geo.albers()
            .rotate([0, 0]);

        path = d3.geo.path()
            .projection(projection);

        // Create SVG element for the map
        svg = d3.select("#map").append("svg")
            .attr("width", width)
            .attr("height", height);

        // graphics go here
        g = svg.append("g");
    }

    // Draw map on the SVG element
    function draw(boundaries) {

        projection
            .scale(1)
            .translate([0,0]);

        // Compute correct bounds and scaling from the TopoJSON
        var b = path.bounds(topojson.feature(boundaries, boundaries.objects[units]));
        var s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height);
        var t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

        projection
            .scale(s)
            .translate(t);

        // Add an area for each feature in the TopoJSON
        g.selectAll(".area")
            .data(topojson.feature(boundaries, boundaries.objects[units]).features)
            .enter().append("path")
            .attr("class", function(d) {

                var area_party_class = '';
                if (constituencyResults[d.properties.PCON13NM]) {
                    area_party_class = ' party-' + constituencyResults[d.properties.PCON13NM].toLowerCase().replace(/ /g, '-');
                }
                var cssClass = 'area' + area_party_class;

                return cssClass;
            })
            .attr("id", function(d){ return d.id; })
            .attr("d", path)
            .on("click", function(d){ return toggleSelectedArea(d); });

        // Add a boundary between areas
        g.append("path")
            .datum(topojson.mesh(boundaries, boundaries.objects[units], function(a, b){ return a !== b }))
            .attr('d', path)
            .attr('class', 'boundary');
    }

    // Redraw the map
    // Removes map completely and starts from scratch
    function redraw() {
        d3.select("svg").remove();

        init(width, height);
        draw(boundaries);
    }

    // ----

    // Select a map area
    function toggleSelectedArea(d) {

        // Handle map zooming
        var changedArea = false;
        var x, y, k;

        if (d && centered !== d) {
            var centroid = path.centroid(d);
            x = centroid[0];
            y = centroid[1];
            k = 8;
            centered = d;
            changedArea = true;
        } else {
            x = width / 2;
            y = height / 2;
            k = 1;
            centered = null;
        }

        // Highlight area
        g.selectAll("path")
            .classed({ selected: (centered && function(d) { return d === centered; }) });

        // Remove currently highlighted table row
        d3.select('#data_table .selected')
            .classed({ selected: false });

        if (centered && changedArea) {
            // Highlight corresponding table row
            var rowClass = '.constituency_name-' + normalizeName(d.properties.PCON13NM);
            d3.select(rowClass)
                .classed({ selected: true })
                .node()
                .scrollIntoView();
        }

        // Zoom in or out of area
        g.transition()
            .duration(750)
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
            .style("stroke-width", 1 / k + "px");
    }

    function normalizeName(name) {
        return name.toLowerCase().replace(/[^a-z]/g, '');
    }

    // ----

    function loadData() {

        d3.json(CONFIG.apiBaseUrl + '/constituencies/results/parties.json?filters=leading', function(error, results) {
            if (error) {
                return console.error(error);
            }

            // Display results in table
            tabulate(results, [
                { field: 'constituency_name', heading: 'Constituency' },
                { field: 'party_name', heading: 'Leading Party' }
            ]);

            // Create constituency results object for highlighting map areas
            results.forEach(function(constituency) {
                constituencyResults[constituency.constituency_name] = constituency.party_name;
            });

            loadMapData('/json/gb/topo_wpc.json', 'wpc');
        });
    }

    // Loads data and redraws the map
    function loadMapData(filename, u) {
        units = u;

        d3.json(filename, function(error, b) {
            if (error) {
                return console.error(error);
            }
            boundaries = b;
            redraw();
        });
    }

    function tabulate(data, columns) {
        var table = d3.select("#data_table").append("table");
            thead = table.append("thead"),
            tbody = table.append("tbody");

        // append the header row
        thead.append("tr")
            .selectAll("th")
            .data(columns)
            .enter()
            .append("th")
                .text(function(column) { return column.heading; });

        // create a row for each object in the data
        var rows = tbody.selectAll("tr")
            .data(data)
            .enter()
            .append("tr")
                .attr('class', function(row) {
                    return columns.map(function(column) {
                        return column.field + '-' + normalizeName(row[column.field]);
                    }).join(' ');
                });

        // create a cell in each row for each column
        var cells = rows.selectAll("td")
            .data(function(row) {
                return columns.map(function(column) {
                    return { column: column.field, value: row[column.field] };
                });
            })
            .enter()
            .append("td")
                .html(function(d) { return d.value; });

        return table;
    }

    // ----

    loadData();

})(VFP_DATA_CONFIG, d3);
