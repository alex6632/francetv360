/*
 * ---- Settings -----
 */

//Init
var width = 1000,
    height = 600,
    sens = 0.25,
    scale = 1,
    margin = {top: 0, right: 0, bottom: 0, left: 0};

//Setting projection
var proj = d3.geo.orthographic()
    .scale(190)
    .rotate([0, 0])
    .translate([width / 2, height / 2])
    .clipAngle(90);

var markerProj = d3.geo.orthographic()
    .scale(190)
    .rotate([0, 0])
    .translate([width / 2, height / 2])
    .clipAngle(90);

var path = d3.geo.path().projection(proj).pointRadius(function(d) {
    return 6
});

//Zoom
var zoom = d3.behavior.zoom()
    .scaleExtent([1, 2])
    .on("zoom", zoomed);

//SVG container
var svg = d3.select("body .home-map").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "map");

var g = svg.append("g").call(zoom)
    .on("mousedown.zoom", null)
    .on("touchstart.zoom", null)
    .on("touchmove.zoom", null)
    .on("touchend.zoom", null);

//Add gradient on water
var defs = svg.append("defs");
var gradient = defs.append("linearGradient")
    .attr("id", "gradient")
    .attr("x1","0")
    .attr("x2","1")
    .attr("y1","0")
    .attr("y2","1");
gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#000")
    .attr("stop-opacity", "0.16");
gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#FFF")
    .attr("stop-opacity", "0.16");

var infoTooltip = d3.select("body").append("div").attr("class", "infoTooltip");
var modalInfo = d3.select("div.modalInfo");

var scrollSpeed = 50;
var current = 0;
var λ = d3.scale.linear()
    .domain([0, width])
    .range([-180, 180]);

queue()
    .defer(d3.json, "../data/world-110m.json")
    .defer(d3.json, "../data/marker.json")
    .defer(d3.tsv, "../data/filter-names.tsv")
    .await(ready);


/*
 * ---- Functions -----
 */

//Zoom function
function zoomed() {
    g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

//Main function
function ready(error, world, locations, filters) {

    $('.modalInfo').on('click', '.jsCloseModalInfo', function() {
        $(this).parent('.modalInfo').fadeOut();
        $('.home-map').css({
            left: "50%",
            transition: "all 800ms 800ms ease",
            zIndex: 9
        });
        $('.timeline').css({
            transform: "translate(-50%, 0%)",
            opacity: 1,
            transition: "all 800ms 800ms ease"
        });
        $('.filter').css({
            transform: "translate(0, -50%)",
            opacity: 1,
            transition: "all 800ms 800ms ease"
        });
        $('.data-right').css({
            transform: "translate(0, -50%)",
            opacity: 1,
            transition: "all 800ms 800ms ease"
        });
        $('.toolbar-header').css({
            display: "block"
        });
    });
    // $('svg.map > g').hover(function() {
    //     clearInterval(vAutoRotate);
    // }, function() {
    //     setInterval(bgscroll, 50);
    // });

    //Adding water
    var water = g.append('path')
        .datum({type: 'Sphere'})
        .attr('class', 'water')
        .attr('d', path)
        .call(d3.behavior.drag()
            .origin(function() {
                var r = proj.rotate();
                return {x: r[0] / sens, y: -r[1] / sens}; })
            .on('drag', function(d) {
                clearInterval(vAutoRotate);
                var rotate = proj.rotate();
                proj.rotate([d3.event.x * sens, -d3.event.y * sens, rotate[2]]);
                g.selectAll('.land').attr('d', path);

                // for each node
                nodes.each(function(d, i) {
                    var self = d3.select(this),
                        lon_lat = [d.lon, d.lat],
                        proj_pos = proj(lon_lat);

                    var hasPath = path({
                            type: "Point",
                            coordinates: lon_lat
                        }) != undefined;

                    if (hasPath) {
                        self.style("display","inline");
                        self.attr("transform", 'translate(' + proj_pos[0] + ',' + proj_pos[1] + ')');
                    }

                    else {
                        self.style("display","none")
                    }
                });
            })
        );

    var countries = topojson.feature(world, world.objects.countries).features;
    g.selectAll('g.land')
        .data(countries)
        .enter().append('path')
        .attr('class', 'land')
        .attr('d', path)
        .call(d3.behavior.drag()
            .origin(function() {
                var r = proj.rotate();
                return {x: r[0] / sens, y: -r[1] / sens}; })
            .on('drag', function(d) {
                clearInterval(vAutoRotate);
                var rotate = proj.rotate();
                proj.rotate([d3.event.x * sens, -d3.event.y * sens, rotate[2]]);
                g.selectAll('.land').attr('d', path);

                // for each node
                nodes.each(function(d, i) {
                    var self = d3.select(this),
                        lon_lat = [d.lon, d.lat],
                        proj_pos = proj(lon_lat);

                    // check to see if it's still visible
                    var hasPath = path({
                            type: "Point",
                            coordinates: lon_lat
                        }) != undefined;

                    // if it is show it and update position
                    if (hasPath) {
                        self.style("display","inline");
                        self.attr("transform", 'translate(' + proj_pos[0] + ',' + proj_pos[1] + ')');
                    }

                    // otherwise hide it
                    else {
                        self.style("display","none")
                    }
                });
            })
        );

    var nodes = g.selectAll('g.node')
        .data(locations)
        .enter().append('g').attr('class', 'node')
        .attr('transform', function(d) {
            var proj_pos = proj([d.lon, d.lat]);
            return 'translate(' + proj_pos[0] + ',' + proj_pos[1] + ')';
        })
        .attr('style', 'cursor: pointer')
        .attr("d", path)
        .attr('class', function(d) {
            var category = d.category,
                inputCategory,
                myClass;
            d3.selectAll(".filter__item input").each(function(d){
                cb = d3.select(this);
                if(cb.property("checked")){
                    inputCategory = cb.property("id");
                }
            });

            if(category == inputCategory) {
                myClass = 'node show';
                if(category == 6) {
                    myClass += ' live';
                }
                return myClass;
            } else {
                return 'node hide';
            }
        })
        .on('mouseover', function(d) {
            infoTooltip.html("<img src='images/"+d.image+"' alt='' class='infoTooltip__img'><div class='infoTooltip__title'>"+d.name+"</div>")
                .style("left", (d3.event.pageX + 20) + "px")
                .style("top", (d3.event.pageY - 50) + "px")
                .style("display", "block")
                .style("opacity", 1);
        })
        .on("mouseout", function(d) {
            infoTooltip.style("opacity", 0)
                .style("display", "none");
        })
        .on("mousemove", function(d) {
            infoTooltip.style("left", (d3.event.pageX + 20) + "px")
                .style("top", (d3.event.pageY - 50) + "px");
        })
        .on("click", function(d) {
            var mainPage = d3.select(".main-page");
            var modalInfo__title = d3.select("div.modalInfo__inner__title");
            var modalInfo__video = d3.select("div.modalInfo__inner__video");
            modalInfo__title.html(d.name);
            modalInfo__video.html("<iframe width='560' height='315' src='https://www.youtube.com/embed/"+d.token+"' frameborder='0' allowfullscreen></iframe>");
            d3.select(".timeline")
                .style("opacity", "0")
                .style("transform", "translate(-50%, 400%)")
                .style("transition", "all 800ms ease");
            d3.select(".filter")
                .style("opacity", "0")
                .style("transform", "translate(-100%, -50%)")
                .style("transition", "all 800ms ease");
            d3.select(".data-right")
                .style("opacity", "0")
                .style("transform", "translate(100%, -50%)")
                .style("transition", "all 800ms ease");
            d3.select(".toolbar-header")
                .style("display", "none");
            d3.select(".home-map")
                .style("left", "0")
                .style("transition", "all 800ms ease")
                .style("z-index", "999");
            $('.modalInfo').delay(1000).fadeIn();
        });

    if($('.node').hasClass('live')) {
        nodes.append("svg:image")
            .attr('transform', 'translate(-7, -7)')
            .attr('width', 7)
            .attr('height', 7)
            .attr('class','marker')
            .attr("href","../images/marker-live.png");
    } else {
        nodes.append("svg:image")
            .attr('transform', 'translate(-7, -7)')
            .attr('width', 7)
            .attr('height', 7)
            .attr('class','marker')
            .attr("href","../images/marker.png");
    }

    d3.selectAll(".filter__item input").on("change", function(d){
        var selected = this.id,
            opacity = this.checked ? 1 : 0;

        if(selected == 6) {
            nodes
                .filter(function(d) {
                    return selected == d.category;
                })
                .style('opacity', opacity)
                .append("svg:image")
                .attr('transform', 'translate(-7, -7)')
                .attr('width', 7)
                .attr('height', 7)
                .attr('class','marker')
                .attr("href","../images/marker-live.png");
        } else {
            nodes
                .filter(function(d) {
                    return selected == d.category;
                })
                .style('opacity', opacity)
                .append("svg:image")
                .attr('transform', 'translate(-7, -7)')
                .attr('width', 7)
                .attr('height', 7)
                .attr('class','marker')
                .attr("href","../images/marker.png");
        }
    });

    function bgscroll() {
        current += 1;
        proj.rotate([λ(current), 0]);
        markerProj.rotate([λ(current), 0]);
        g.selectAll('.land').attr('d', path);
        nodes
            .attr('transform', function(d) {
                var proj_pos = proj([d.lon, d.lat]);
                return 'translate(' + proj_pos[0] + ',' + proj_pos[1] + ')';
            })
            .attr("display", function(d) {
                var lon_lat = [d.lon, d.lat],
                    proj_pos = proj(lon_lat);

                var hasPath = path({
                        type: "Point",
                        coordinates: lon_lat
                    }) != undefined;

                if (hasPath) {
                    return "inline";
                }

                else {
                    return "none";
                }
            })
    }
    var vAutoRotate = setInterval(bgscroll, scrollSpeed);
}
