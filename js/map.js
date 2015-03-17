var width = 594;
var height = 806;

// var margin = 50;
// var width = parseInt(d3.select("#map").style("width"));
// var height = window.innerHeight - 2 * margin;

// variables for map drawing
var projection, svg, path, g;
var boundaries, units;

// initialise the map
init(width, height);

// ----

function init(width, height) {

    // pretty boring projection
    projection = d3.geo.albers()
        .rotate([0, 0]);

    path = d3.geo.path()
        .projection(projection);

    // create the svg element for drawing onto
    svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height);

    // graphics go here
    g = svg.append("g");

    /*
    // add a white rectangle as background to enable us to deselect a map selection
    g.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .style("fill", "#fff")
        .on('click', deselect);
    */
}

// draw our map on the SVG element
function draw(boundaries) {

    projection
        .scale(1)
        .translate([0,0]);

    // compute the correct bounds and scaling from the topoJSON
    var b = path.bounds(topojson.feature(boundaries, boundaries.objects[units]));
    var s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height);
    var t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];
    
    projection
        .scale(s)
        .translate(t);

    // add an area for each feature in the topoJSON
    g.selectAll(".area")
        .data(topojson.feature(boundaries, boundaries.objects[units]).features)
        .enter().append("path")
        .attr("class", function(d) {

            // TODO - Verify any constituencies that don't have a match
            if (!constituencyResults[d.properties.PCON13NM]) {
                console.error('Not found constituency results for: ' + d.properties.PCON13NM);
            }

            var area_party_class = '';
            if (constituencyResults[d.properties.PCON13NM]) {
                area_party_class = ' party-' + constituencyResults[d.properties.PCON13NM].toLowerCase().replace(/ /g, '-');
            }
            var cssClass = 'area' + area_party_class;

            return cssClass;
        })
        .attr("id", function(d) {return d.id})
        .attr("d", path)
        .on("click", function(d){ return select(d)});

    // add a boundary between areas
    g.append("path")
        .datum(topojson.mesh(boundaries, boundaries.objects[units], function(a, b){ return a !== b }))
        .attr('d', path)
        .attr('class', 'boundary');
}

// called to redraw the map - removes map completely and starts from scratch
function redraw() {
    d3.select("svg").remove();

    init(width, height);
    draw(boundaries);
}

// ----

// loads data from the given file and redraws the map
function load_data(filename, u) {
    // clear any selection
    deselect();

    units = u;
    var f = filename;

    d3.json(f, function(error, b) {
        if (error) return console.error(error);
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
                    var cssClass = column.field + '-' + row[column.field].toLowerCase().replace(/[^a-z]/g, '');
                    return cssClass;
                }).join(' ');
            });

    // create a cell in each row for each column
    var cells = rows.selectAll("td")
        .data(function(row) {
            return columns.map(function(column) {
                return {column: column.field, value: row[column.field]};
            });
        })
        .enter()
        .append("td")
            .html(function(d) { return d.value; });

    return table;
}

// ----

function load_map() {
    var url = 'json/gb/topo_wpc.json';
    load_data(url, 'wpc');
}

var constituencyResults = {};

function load_results() {
    d3.json('http://api.voteforpolicies.dev/constituencies/results/parties.json?filters=leading', function(error, results) {
        if (error) {
            return console.error(error);
        }

        tabulate(results, [
            {
                field: 'constituency_name',
                heading: 'Constituency'
            },
            {
                field: 'party_name',
                heading: 'Leading Party'
            }
        ]);

        results.forEach(function(constituency) {
            constituencyResults[constituency.constituency_name] = constituency.party_name;
        });

        // console.log(constituencyResults);
    });
}

// ----

var centered;

// select a map area
function select(d) {

    // Handle map zooming
    var x, y, k;

    if (d && centered !== d) {
        var centroid = path.centroid(d);
        x = centroid[0];
        y = centroid[1];
        k = 8;
        centered = d;
    } else {
        x = width / 2;
        y = height / 2;
        k = 1;
        centered = null;
    }

    g.selectAll("path")
        .classed({ selected: (centered && function(d) { return d === centered; }) });

    g.transition()
        .duration(750)
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
        .style("stroke-width", 1 / k + "px");

    // ----

    // get the id of the selected map area
    var id = "#" + d.id;
    // remove the selected class from any other selected areas
    d3.selectAll(".selected")
        .attr({ selected: false });

    // and add it to this area
    // d3.select(id)
    //    .attr({ selected: true })

    // Hightlight corresponding table row

    var rowClass = '.constituency_name-' + d.properties.PCON13NM.toLowerCase().replace(/[^a-z]/g, '');

    d3.select(rowClass)
        .classed({ 'selected': true })
        .node()
        .scrollIntoView();
}

// remove any data when we lose selection of a map unit
function deselect() {
    d3.selectAll(".selected")
        .classed({ selected: false }); 
    d3.select("#data_table")
        .html("");
}

// ----

load_results();
load_map();
