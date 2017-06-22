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

$(document).ready(function() {
    $('.jsOpenSearch').on('click', function() {
        $('.search').fadeIn();
    });
    $('.jsCloseSearch').on('click', function() {
        $('.search').fadeOut();
    });
    $('.mega-search__input').focus(function() {
        $('.mega-search').addClass('focus');
    }).blur(function () {
        $('.mega-search').removeClass('focus');
    });


    // Data right...
    var nbProg = {
        "films" : 3104,
        "sport" : 2856,
        "actus": 3647,
        "docu": 1796,
        "serie": 1325,
        "live": 765,
        "vie_quo": 1547,
        "enfants": 4765
    };
    var nbExplo = {
        "films" : 26514,
        "sport" : 26514,
        "actus": 26514,
        "docu": 26514,
        "serie": 26514,
        "live": 26514,
        "vie_quo": 26514,
        "enfants": 26514
    };


    //var x = nbProg['films'];
});
$(window).on("load",function(){
    $(".filter").mCustomScrollbar({
        axis:"y",
        theme:"light-2"
    });
});
// Initialisation des variables...
var date = new Date,
    j = date.getDate(),
    j7 = j-7,
    tab_jours = new Array("D", "L", "M", "M", "J", "V", "S"),
    index_jours = [],
    tab_j = [],
    tab_date = [];

for(var a=0; a<7; a++) {
    if(date.getDay()-a >= 0) {
        index_jours.push(date.getDay()-a);
    } else {
        index_jours.push(date.getDay()+7-a);
    }
}

for (var i=j; i>=j7; i--) {
    tab_j.push(i);
}

for(var b=0; b<7; b++) {
    var date_complete = tab_jours[index_jours[b]]+" "+tab_j[b];
    tab_date.push(date_complete);
}

$("#timeline-custom").ionRangeSlider({
    type: "single",
    values: [tab_date[6], tab_date[5], tab_date[4], tab_date[3], tab_date[2], tab_date[1], tab_date[0]],
    grid: true,
    from: 6,
    hide_min_max: true
});
$(document).ready(function() {
    $(function(){
        $(".element").typed({
            strings: ["First ^1000 sentence.", "Second sentence."],
            // Optionally use an HTML element to grab strings from (must wrap each string in a <p>)
            stringsElement: null,
            // typing speed
            typeSpeed: 0,
            // time before typing starts
            startDelay: 0,
            // backspacing speed
            backSpeed: 0,
            // shuffle the strings
            shuffle: false,
            // time before backspacing
            backDelay: 500,
            // Fade out instead of backspace (must use CSS class)
            fadeOut: false,
            fadeOutClass: 'typed-fade-out',
            fadeOutDelay: 500, // milliseconds
            // loop
            loop: false,
            // null = infinite
            loopCount: null,
            // show cursor
            showCursor: true,
            // character for cursor
            cursorChar: "|",
            // attribute to type (null == text)
            attr: null,
            // either html or text
            contentType: 'html',
            // call when done callback function
            callback: function() {},
            // starting callback function before each string
            preStringTyped: function() {},
            //callback for every typed string
            onStringTyped: function() {},
            // callback for reset
            resetCallback: function() {}
        });
    });
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImludGVyYWN0aW9ucy5qcyIsInNjcm9sbGJhci5qcyIsInRpbWVsaW5lLmpzIiwidHlwZWQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogLS0tLSBTZXR0aW5ncyAtLS0tLVxuICovXG5cbi8vSW5pdFxudmFyIHdpZHRoID0gMTAwMCxcbiAgICBoZWlnaHQgPSA2MDAsXG4gICAgc2VucyA9IDAuMjUsXG4gICAgc2NhbGUgPSAxLFxuICAgIG1hcmdpbiA9IHt0b3A6IDAsIHJpZ2h0OiAwLCBib3R0b206IDAsIGxlZnQ6IDB9O1xuXG4vL1NldHRpbmcgcHJvamVjdGlvblxudmFyIHByb2ogPSBkMy5nZW8ub3J0aG9ncmFwaGljKClcbiAgICAuc2NhbGUoMTkwKVxuICAgIC5yb3RhdGUoWzAsIDBdKVxuICAgIC50cmFuc2xhdGUoW3dpZHRoIC8gMiwgaGVpZ2h0IC8gMl0pXG4gICAgLmNsaXBBbmdsZSg5MCk7XG5cbnZhciBtYXJrZXJQcm9qID0gZDMuZ2VvLm9ydGhvZ3JhcGhpYygpXG4gICAgLnNjYWxlKDE5MClcbiAgICAucm90YXRlKFswLCAwXSlcbiAgICAudHJhbnNsYXRlKFt3aWR0aCAvIDIsIGhlaWdodCAvIDJdKVxuICAgIC5jbGlwQW5nbGUoOTApO1xuXG52YXIgcGF0aCA9IGQzLmdlby5wYXRoKCkucHJvamVjdGlvbihwcm9qKS5wb2ludFJhZGl1cyhmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIDZcbn0pO1xuXG4vL1pvb21cbnZhciB6b29tID0gZDMuYmVoYXZpb3Iuem9vbSgpXG4gICAgLnNjYWxlRXh0ZW50KFsxLCAyXSlcbiAgICAub24oXCJ6b29tXCIsIHpvb21lZCk7XG5cbi8vU1ZHIGNvbnRhaW5lclxudmFyIHN2ZyA9IGQzLnNlbGVjdChcImJvZHkgLmhvbWUtbWFwXCIpLmFwcGVuZChcInN2Z1wiKVxuICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGgpXG4gICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KVxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJtYXBcIik7XG5cbnZhciBnID0gc3ZnLmFwcGVuZChcImdcIikuY2FsbCh6b29tKVxuICAgIC5vbihcIm1vdXNlZG93bi56b29tXCIsIG51bGwpXG4gICAgLm9uKFwidG91Y2hzdGFydC56b29tXCIsIG51bGwpXG4gICAgLm9uKFwidG91Y2htb3ZlLnpvb21cIiwgbnVsbClcbiAgICAub24oXCJ0b3VjaGVuZC56b29tXCIsIG51bGwpO1xuXG4vL0FkZCBncmFkaWVudCBvbiB3YXRlclxudmFyIGRlZnMgPSBzdmcuYXBwZW5kKFwiZGVmc1wiKTtcbnZhciBncmFkaWVudCA9IGRlZnMuYXBwZW5kKFwibGluZWFyR3JhZGllbnRcIilcbiAgICAuYXR0cihcImlkXCIsIFwiZ3JhZGllbnRcIilcbiAgICAuYXR0cihcIngxXCIsXCIwXCIpXG4gICAgLmF0dHIoXCJ4MlwiLFwiMVwiKVxuICAgIC5hdHRyKFwieTFcIixcIjBcIilcbiAgICAuYXR0cihcInkyXCIsXCIxXCIpO1xuZ3JhZGllbnQuYXBwZW5kKFwic3RvcFwiKVxuICAgIC5hdHRyKFwib2Zmc2V0XCIsIFwiMCVcIilcbiAgICAuYXR0cihcInN0b3AtY29sb3JcIiwgXCIjMDAwXCIpXG4gICAgLmF0dHIoXCJzdG9wLW9wYWNpdHlcIiwgXCIwLjE2XCIpO1xuZ3JhZGllbnQuYXBwZW5kKFwic3RvcFwiKVxuICAgIC5hdHRyKFwib2Zmc2V0XCIsIFwiMTAwJVwiKVxuICAgIC5hdHRyKFwic3RvcC1jb2xvclwiLCBcIiNGRkZcIilcbiAgICAuYXR0cihcInN0b3Atb3BhY2l0eVwiLCBcIjAuMTZcIik7XG5cbnZhciBpbmZvVG9vbHRpcCA9IGQzLnNlbGVjdChcImJvZHlcIikuYXBwZW5kKFwiZGl2XCIpLmF0dHIoXCJjbGFzc1wiLCBcImluZm9Ub29sdGlwXCIpO1xudmFyIG1vZGFsSW5mbyA9IGQzLnNlbGVjdChcImRpdi5tb2RhbEluZm9cIik7XG5cbnZhciBzY3JvbGxTcGVlZCA9IDUwO1xudmFyIGN1cnJlbnQgPSAwO1xudmFyIM67ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAuZG9tYWluKFswLCB3aWR0aF0pXG4gICAgLnJhbmdlKFstMTgwLCAxODBdKTtcblxucXVldWUoKVxuICAgIC5kZWZlcihkMy5qc29uLCBcIi4uL2RhdGEvd29ybGQtMTEwbS5qc29uXCIpXG4gICAgLmRlZmVyKGQzLmpzb24sIFwiLi4vZGF0YS9tYXJrZXIuanNvblwiKVxuICAgIC5kZWZlcihkMy50c3YsIFwiLi4vZGF0YS9maWx0ZXItbmFtZXMudHN2XCIpXG4gICAgLmF3YWl0KHJlYWR5KTtcblxuXG4vKlxuICogLS0tLSBGdW5jdGlvbnMgLS0tLS1cbiAqL1xuXG4vL1pvb20gZnVuY3Rpb25cbmZ1bmN0aW9uIHpvb21lZCgpIHtcbiAgICBnLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBkMy5ldmVudC50cmFuc2xhdGUgKyBcIilzY2FsZShcIiArIGQzLmV2ZW50LnNjYWxlICsgXCIpXCIpO1xufVxuXG4vL01haW4gZnVuY3Rpb25cbmZ1bmN0aW9uIHJlYWR5KGVycm9yLCB3b3JsZCwgbG9jYXRpb25zLCBmaWx0ZXJzKSB7XG5cbiAgICAkKCcubW9kYWxJbmZvJykub24oJ2NsaWNrJywgJy5qc0Nsb3NlTW9kYWxJbmZvJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICQodGhpcykucGFyZW50KCcubW9kYWxJbmZvJykuZmFkZU91dCgpO1xuICAgICAgICAkKCcuaG9tZS1tYXAnKS5jc3Moe1xuICAgICAgICAgICAgbGVmdDogXCI1MCVcIixcbiAgICAgICAgICAgIHRyYW5zaXRpb246IFwiYWxsIDgwMG1zIDgwMG1zIGVhc2VcIixcbiAgICAgICAgICAgIHpJbmRleDogOVxuICAgICAgICB9KTtcbiAgICAgICAgJCgnLnRpbWVsaW5lJykuY3NzKHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUoLTUwJSwgMCUpXCIsXG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNpdGlvbjogXCJhbGwgODAwbXMgODAwbXMgZWFzZVwiXG4gICAgICAgIH0pO1xuICAgICAgICAkKCcuZmlsdGVyJykuY3NzKHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUoMCwgLTUwJSlcIixcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICB0cmFuc2l0aW9uOiBcImFsbCA4MDBtcyA4MDBtcyBlYXNlXCJcbiAgICAgICAgfSk7XG4gICAgICAgICQoJy5kYXRhLXJpZ2h0JykuY3NzKHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUoMCwgLTUwJSlcIixcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICB0cmFuc2l0aW9uOiBcImFsbCA4MDBtcyA4MDBtcyBlYXNlXCJcbiAgICAgICAgfSk7XG4gICAgICAgICQoJy50b29sYmFyLWhlYWRlcicpLmNzcyh7XG4gICAgICAgICAgICBkaXNwbGF5OiBcImJsb2NrXCJcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgLy8gJCgnc3ZnLm1hcCA+IGcnKS5ob3ZlcihmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgY2xlYXJJbnRlcnZhbCh2QXV0b1JvdGF0ZSk7XG4gICAgLy8gfSwgZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgIHNldEludGVydmFsKGJnc2Nyb2xsLCA1MCk7XG4gICAgLy8gfSk7XG5cbiAgICAvL0FkZGluZyB3YXRlclxuICAgIHZhciB3YXRlciA9IGcuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmRhdHVtKHt0eXBlOiAnU3BoZXJlJ30pXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICd3YXRlcicpXG4gICAgICAgIC5hdHRyKCdkJywgcGF0aClcbiAgICAgICAgLmNhbGwoZDMuYmVoYXZpb3IuZHJhZygpXG4gICAgICAgICAgICAub3JpZ2luKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciByID0gcHJvai5yb3RhdGUoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge3g6IHJbMF0gLyBzZW5zLCB5OiAtclsxXSAvIHNlbnN9OyB9KVxuICAgICAgICAgICAgLm9uKCdkcmFnJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodkF1dG9Sb3RhdGUpO1xuICAgICAgICAgICAgICAgIHZhciByb3RhdGUgPSBwcm9qLnJvdGF0ZSgpO1xuICAgICAgICAgICAgICAgIHByb2oucm90YXRlKFtkMy5ldmVudC54ICogc2VucywgLWQzLmV2ZW50LnkgKiBzZW5zLCByb3RhdGVbMl1dKTtcbiAgICAgICAgICAgICAgICBnLnNlbGVjdEFsbCgnLmxhbmQnKS5hdHRyKCdkJywgcGF0aCk7XG5cbiAgICAgICAgICAgICAgICAvLyBmb3IgZWFjaCBub2RlXG4gICAgICAgICAgICAgICAgbm9kZXMuZWFjaChmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxmID0gZDMuc2VsZWN0KHRoaXMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgbG9uX2xhdCA9IFtkLmxvbiwgZC5sYXRdLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJval9wb3MgPSBwcm9qKGxvbl9sYXQpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBoYXNQYXRoID0gcGF0aCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJQb2ludFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvb3JkaW5hdGVzOiBsb25fbGF0XG4gICAgICAgICAgICAgICAgICAgICAgICB9KSAhPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGhhc1BhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc3R5bGUoXCJkaXNwbGF5XCIsXCJpbmxpbmVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgJ3RyYW5zbGF0ZSgnICsgcHJval9wb3NbMF0gKyAnLCcgKyBwcm9qX3Bvc1sxXSArICcpJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc3R5bGUoXCJkaXNwbGF5XCIsXCJub25lXCIpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICk7XG5cbiAgICB2YXIgY291bnRyaWVzID0gdG9wb2pzb24uZmVhdHVyZSh3b3JsZCwgd29ybGQub2JqZWN0cy5jb3VudHJpZXMpLmZlYXR1cmVzO1xuICAgIGcuc2VsZWN0QWxsKCdnLmxhbmQnKVxuICAgICAgICAuZGF0YShjb3VudHJpZXMpXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdsYW5kJylcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKVxuICAgICAgICAuY2FsbChkMy5iZWhhdmlvci5kcmFnKClcbiAgICAgICAgICAgIC5vcmlnaW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIHIgPSBwcm9qLnJvdGF0ZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7eDogclswXSAvIHNlbnMsIHk6IC1yWzFdIC8gc2Vuc307IH0pXG4gICAgICAgICAgICAub24oJ2RyYWcnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh2QXV0b1JvdGF0ZSk7XG4gICAgICAgICAgICAgICAgdmFyIHJvdGF0ZSA9IHByb2oucm90YXRlKCk7XG4gICAgICAgICAgICAgICAgcHJvai5yb3RhdGUoW2QzLmV2ZW50LnggKiBzZW5zLCAtZDMuZXZlbnQueSAqIHNlbnMsIHJvdGF0ZVsyXV0pO1xuICAgICAgICAgICAgICAgIGcuc2VsZWN0QWxsKCcubGFuZCcpLmF0dHIoJ2QnLCBwYXRoKTtcblxuICAgICAgICAgICAgICAgIC8vIGZvciBlYWNoIG5vZGVcbiAgICAgICAgICAgICAgICBub2Rlcy5lYWNoKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGYgPSBkMy5zZWxlY3QodGhpcyksXG4gICAgICAgICAgICAgICAgICAgICAgICBsb25fbGF0ID0gW2QubG9uLCBkLmxhdF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9qX3BvcyA9IHByb2oobG9uX2xhdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgdG8gc2VlIGlmIGl0J3Mgc3RpbGwgdmlzaWJsZVxuICAgICAgICAgICAgICAgICAgICB2YXIgaGFzUGF0aCA9IHBhdGgoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiUG9pbnRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb29yZGluYXRlczogbG9uX2xhdFxuICAgICAgICAgICAgICAgICAgICAgICAgfSkgIT0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIGl0IGlzIHNob3cgaXQgYW5kIHVwZGF0ZSBwb3NpdGlvblxuICAgICAgICAgICAgICAgICAgICBpZiAoaGFzUGF0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zdHlsZShcImRpc3BsYXlcIixcImlubGluZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuYXR0cihcInRyYW5zZm9ybVwiLCAndHJhbnNsYXRlKCcgKyBwcm9qX3Bvc1swXSArICcsJyArIHByb2pfcG9zWzFdICsgJyknKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIG90aGVyd2lzZSBoaWRlIGl0XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zdHlsZShcImRpc3BsYXlcIixcIm5vbmVcIilcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgIHZhciBub2RlcyA9IGcuc2VsZWN0QWxsKCdnLm5vZGUnKVxuICAgICAgICAuZGF0YShsb2NhdGlvbnMpXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgJ25vZGUnKVxuICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgdmFyIHByb2pfcG9zID0gcHJvaihbZC5sb24sIGQubGF0XSk7XG4gICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgcHJval9wb3NbMF0gKyAnLCcgKyBwcm9qX3Bvc1sxXSArICcpJztcbiAgICAgICAgfSlcbiAgICAgICAgLmF0dHIoJ3N0eWxlJywgJ2N1cnNvcjogcG9pbnRlcicpXG4gICAgICAgIC5hdHRyKFwiZFwiLCBwYXRoKVxuICAgICAgICAuYXR0cignY2xhc3MnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICB2YXIgY2F0ZWdvcnkgPSBkLmNhdGVnb3J5LFxuICAgICAgICAgICAgICAgIGlucHV0Q2F0ZWdvcnksXG4gICAgICAgICAgICAgICAgbXlDbGFzcztcbiAgICAgICAgICAgIGQzLnNlbGVjdEFsbChcIi5maWx0ZXJfX2l0ZW0gaW5wdXRcIikuZWFjaChmdW5jdGlvbihkKXtcbiAgICAgICAgICAgICAgICBjYiA9IGQzLnNlbGVjdCh0aGlzKTtcbiAgICAgICAgICAgICAgICBpZihjYi5wcm9wZXJ0eShcImNoZWNrZWRcIikpe1xuICAgICAgICAgICAgICAgICAgICBpbnB1dENhdGVnb3J5ID0gY2IucHJvcGVydHkoXCJpZFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYoY2F0ZWdvcnkgPT0gaW5wdXRDYXRlZ29yeSkge1xuICAgICAgICAgICAgICAgIG15Q2xhc3MgPSAnbm9kZSBzaG93JztcbiAgICAgICAgICAgICAgICBpZihjYXRlZ29yeSA9PSA2KSB7XG4gICAgICAgICAgICAgICAgICAgIG15Q2xhc3MgKz0gJyBsaXZlJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG15Q2xhc3M7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAnbm9kZSBoaWRlJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdtb3VzZW92ZXInLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBpbmZvVG9vbHRpcC5odG1sKFwiPGltZyBzcmM9J2ltYWdlcy9cIitkLmltYWdlK1wiJyBhbHQ9JycgY2xhc3M9J2luZm9Ub29sdGlwX19pbWcnPjxkaXYgY2xhc3M9J2luZm9Ub29sdGlwX190aXRsZSc+XCIrZC5uYW1lK1wiPC9kaXY+XCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwibGVmdFwiLCAoZDMuZXZlbnQucGFnZVggKyAyMCkgKyBcInB4XCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwidG9wXCIsIChkMy5ldmVudC5wYWdlWSAtIDUwKSArIFwicHhcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJvcGFjaXR5XCIsIDEpO1xuICAgICAgICB9KVxuICAgICAgICAub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBpbmZvVG9vbHRpcC5zdHlsZShcIm9wYWNpdHlcIiwgMClcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKFwibW91c2Vtb3ZlXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIGluZm9Ub29sdGlwLnN0eWxlKFwibGVmdFwiLCAoZDMuZXZlbnQucGFnZVggKyAyMCkgKyBcInB4XCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwidG9wXCIsIChkMy5ldmVudC5wYWdlWSAtIDUwKSArIFwicHhcIik7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIHZhciBtYWluUGFnZSA9IGQzLnNlbGVjdChcIi5tYWluLXBhZ2VcIik7XG4gICAgICAgICAgICB2YXIgbW9kYWxJbmZvX190aXRsZSA9IGQzLnNlbGVjdChcImRpdi5tb2RhbEluZm9fX2lubmVyX190aXRsZVwiKTtcbiAgICAgICAgICAgIHZhciBtb2RhbEluZm9fX3ZpZGVvID0gZDMuc2VsZWN0KFwiZGl2Lm1vZGFsSW5mb19faW5uZXJfX3ZpZGVvXCIpO1xuICAgICAgICAgICAgbW9kYWxJbmZvX190aXRsZS5odG1sKGQubmFtZSk7XG4gICAgICAgICAgICBtb2RhbEluZm9fX3ZpZGVvLmh0bWwoXCI8aWZyYW1lIHdpZHRoPSc1NjAnIGhlaWdodD0nMzE1JyBzcmM9J2h0dHBzOi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkL1wiK2QudG9rZW4rXCInIGZyYW1lYm9yZGVyPScwJyBhbGxvd2Z1bGxzY3JlZW4+PC9pZnJhbWU+XCIpO1xuICAgICAgICAgICAgZDMuc2VsZWN0KFwiLnRpbWVsaW5lXCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCBcIjBcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoLTUwJSwgNDAwJSlcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJ0cmFuc2l0aW9uXCIsIFwiYWxsIDgwMG1zIGVhc2VcIik7XG4gICAgICAgICAgICBkMy5zZWxlY3QoXCIuZmlsdGVyXCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCBcIjBcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoLTEwMCUsIC01MCUpXCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwidHJhbnNpdGlvblwiLCBcImFsbCA4MDBtcyBlYXNlXCIpO1xuICAgICAgICAgICAgZDMuc2VsZWN0KFwiLmRhdGEtcmlnaHRcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJvcGFjaXR5XCIsIFwiMFwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgxMDAlLCAtNTAlKVwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcInRyYW5zaXRpb25cIiwgXCJhbGwgODAwbXMgZWFzZVwiKTtcbiAgICAgICAgICAgIGQzLnNlbGVjdChcIi50b29sYmFyLWhlYWRlclwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuICAgICAgICAgICAgZDMuc2VsZWN0KFwiLmhvbWUtbWFwXCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwibGVmdFwiLCBcIjBcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJ0cmFuc2l0aW9uXCIsIFwiYWxsIDgwMG1zIGVhc2VcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJ6LWluZGV4XCIsIFwiOTk5XCIpO1xuICAgICAgICAgICAgJCgnLm1vZGFsSW5mbycpLmRlbGF5KDEwMDApLmZhZGVJbigpO1xuICAgICAgICB9KTtcblxuICAgIGlmKCQoJy5ub2RlJykuaGFzQ2xhc3MoJ2xpdmUnKSkge1xuICAgICAgICBub2Rlcy5hcHBlbmQoXCJzdmc6aW1hZ2VcIilcbiAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKC03LCAtNyknKVxuICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgNylcbiAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCA3KVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywnbWFya2VyJylcbiAgICAgICAgICAgIC5hdHRyKFwiaHJlZlwiLFwiLi4vaW1hZ2VzL21hcmtlci1saXZlLnBuZ1wiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBub2Rlcy5hcHBlbmQoXCJzdmc6aW1hZ2VcIilcbiAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKC03LCAtNyknKVxuICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgNylcbiAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCA3KVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywnbWFya2VyJylcbiAgICAgICAgICAgIC5hdHRyKFwiaHJlZlwiLFwiLi4vaW1hZ2VzL21hcmtlci5wbmdcIik7XG4gICAgfVxuXG4gICAgZDMuc2VsZWN0QWxsKFwiLmZpbHRlcl9faXRlbSBpbnB1dFwiKS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbihkKXtcbiAgICAgICAgdmFyIHNlbGVjdGVkID0gdGhpcy5pZCxcbiAgICAgICAgICAgIG9wYWNpdHkgPSB0aGlzLmNoZWNrZWQgPyAxIDogMDtcblxuICAgICAgICBpZihzZWxlY3RlZCA9PSA2KSB7XG4gICAgICAgICAgICBub2Rlc1xuICAgICAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZWN0ZWQgPT0gZC5jYXRlZ29yeTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5zdHlsZSgnb3BhY2l0eScsIG9wYWNpdHkpXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcInN2ZzppbWFnZVwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKC03LCAtNyknKVxuICAgICAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIDcpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIDcpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywnbWFya2VyJylcbiAgICAgICAgICAgICAgICAuYXR0cihcImhyZWZcIixcIi4uL2ltYWdlcy9tYXJrZXItbGl2ZS5wbmdcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBub2Rlc1xuICAgICAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZWN0ZWQgPT0gZC5jYXRlZ29yeTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5zdHlsZSgnb3BhY2l0eScsIG9wYWNpdHkpXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcInN2ZzppbWFnZVwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKC03LCAtNyknKVxuICAgICAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIDcpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIDcpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywnbWFya2VyJylcbiAgICAgICAgICAgICAgICAuYXR0cihcImhyZWZcIixcIi4uL2ltYWdlcy9tYXJrZXIucG5nXCIpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBiZ3Njcm9sbCgpIHtcbiAgICAgICAgY3VycmVudCArPSAxO1xuICAgICAgICBwcm9qLnJvdGF0ZShbzrsoY3VycmVudCksIDBdKTtcbiAgICAgICAgbWFya2VyUHJvai5yb3RhdGUoW867KGN1cnJlbnQpLCAwXSk7XG4gICAgICAgIGcuc2VsZWN0QWxsKCcubGFuZCcpLmF0dHIoJ2QnLCBwYXRoKTtcbiAgICAgICAgbm9kZXNcbiAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHByb2pfcG9zID0gcHJvaihbZC5sb24sIGQubGF0XSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoJyArIHByb2pfcG9zWzBdICsgJywnICsgcHJval9wb3NbMV0gKyAnKSc7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmF0dHIoXCJkaXNwbGF5XCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICB2YXIgbG9uX2xhdCA9IFtkLmxvbiwgZC5sYXRdLFxuICAgICAgICAgICAgICAgICAgICBwcm9qX3BvcyA9IHByb2oobG9uX2xhdCk7XG5cbiAgICAgICAgICAgICAgICB2YXIgaGFzUGF0aCA9IHBhdGgoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJQb2ludFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29vcmRpbmF0ZXM6IGxvbl9sYXRcbiAgICAgICAgICAgICAgICAgICAgfSkgIT0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgaWYgKGhhc1BhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiaW5saW5lXCI7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgIH1cbiAgICB2YXIgdkF1dG9Sb3RhdGUgPSBzZXRJbnRlcnZhbChiZ3Njcm9sbCwgc2Nyb2xsU3BlZWQpO1xufVxuIiwiJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgJCgnLmpzT3BlblNlYXJjaCcpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkKCcuc2VhcmNoJykuZmFkZUluKCk7XG4gICAgfSk7XG4gICAgJCgnLmpzQ2xvc2VTZWFyY2gnKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnLnNlYXJjaCcpLmZhZGVPdXQoKTtcbiAgICB9KTtcbiAgICAkKCcubWVnYS1zZWFyY2hfX2lucHV0JykuZm9jdXMoZnVuY3Rpb24oKSB7XG4gICAgICAgICQoJy5tZWdhLXNlYXJjaCcpLmFkZENsYXNzKCdmb2N1cycpO1xuICAgIH0pLmJsdXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAkKCcubWVnYS1zZWFyY2gnKS5yZW1vdmVDbGFzcygnZm9jdXMnKTtcbiAgICB9KTtcblxuXG4gICAgLy8gRGF0YSByaWdodC4uLlxuICAgIHZhciBuYlByb2cgPSB7XG4gICAgICAgIFwiZmlsbXNcIiA6IDMxMDQsXG4gICAgICAgIFwic3BvcnRcIiA6IDI4NTYsXG4gICAgICAgIFwiYWN0dXNcIjogMzY0NyxcbiAgICAgICAgXCJkb2N1XCI6IDE3OTYsXG4gICAgICAgIFwic2VyaWVcIjogMTMyNSxcbiAgICAgICAgXCJsaXZlXCI6IDc2NSxcbiAgICAgICAgXCJ2aWVfcXVvXCI6IDE1NDcsXG4gICAgICAgIFwiZW5mYW50c1wiOiA0NzY1XG4gICAgfTtcbiAgICB2YXIgbmJFeHBsbyA9IHtcbiAgICAgICAgXCJmaWxtc1wiIDogMjY1MTQsXG4gICAgICAgIFwic3BvcnRcIiA6IDI2NTE0LFxuICAgICAgICBcImFjdHVzXCI6IDI2NTE0LFxuICAgICAgICBcImRvY3VcIjogMjY1MTQsXG4gICAgICAgIFwic2VyaWVcIjogMjY1MTQsXG4gICAgICAgIFwibGl2ZVwiOiAyNjUxNCxcbiAgICAgICAgXCJ2aWVfcXVvXCI6IDI2NTE0LFxuICAgICAgICBcImVuZmFudHNcIjogMjY1MTRcbiAgICB9O1xuXG5cbiAgICAvL3ZhciB4ID0gbmJQcm9nWydmaWxtcyddO1xufSk7IiwiJCh3aW5kb3cpLm9uKFwibG9hZFwiLGZ1bmN0aW9uKCl7XG4gICAgJChcIi5maWx0ZXJcIikubUN1c3RvbVNjcm9sbGJhcih7XG4gICAgICAgIGF4aXM6XCJ5XCIsXG4gICAgICAgIHRoZW1lOlwibGlnaHQtMlwiXG4gICAgfSk7XG59KTsiLCIvLyBJbml0aWFsaXNhdGlvbiBkZXMgdmFyaWFibGVzLi4uXG52YXIgZGF0ZSA9IG5ldyBEYXRlLFxuICAgIGogPSBkYXRlLmdldERhdGUoKSxcbiAgICBqNyA9IGotNyxcbiAgICB0YWJfam91cnMgPSBuZXcgQXJyYXkoXCJEXCIsIFwiTFwiLCBcIk1cIiwgXCJNXCIsIFwiSlwiLCBcIlZcIiwgXCJTXCIpLFxuICAgIGluZGV4X2pvdXJzID0gW10sXG4gICAgdGFiX2ogPSBbXSxcbiAgICB0YWJfZGF0ZSA9IFtdO1xuXG5mb3IodmFyIGE9MDsgYTw3OyBhKyspIHtcbiAgICBpZihkYXRlLmdldERheSgpLWEgPj0gMCkge1xuICAgICAgICBpbmRleF9qb3Vycy5wdXNoKGRhdGUuZ2V0RGF5KCktYSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaW5kZXhfam91cnMucHVzaChkYXRlLmdldERheSgpKzctYSk7XG4gICAgfVxufVxuXG5mb3IgKHZhciBpPWo7IGk+PWo3OyBpLS0pIHtcbiAgICB0YWJfai5wdXNoKGkpO1xufVxuXG5mb3IodmFyIGI9MDsgYjw3OyBiKyspIHtcbiAgICB2YXIgZGF0ZV9jb21wbGV0ZSA9IHRhYl9qb3Vyc1tpbmRleF9qb3Vyc1tiXV0rXCIgXCIrdGFiX2pbYl07XG4gICAgdGFiX2RhdGUucHVzaChkYXRlX2NvbXBsZXRlKTtcbn1cblxuJChcIiN0aW1lbGluZS1jdXN0b21cIikuaW9uUmFuZ2VTbGlkZXIoe1xuICAgIHR5cGU6IFwic2luZ2xlXCIsXG4gICAgdmFsdWVzOiBbdGFiX2RhdGVbNl0sIHRhYl9kYXRlWzVdLCB0YWJfZGF0ZVs0XSwgdGFiX2RhdGVbM10sIHRhYl9kYXRlWzJdLCB0YWJfZGF0ZVsxXSwgdGFiX2RhdGVbMF1dLFxuICAgIGdyaWQ6IHRydWUsXG4gICAgZnJvbTogNixcbiAgICBoaWRlX21pbl9tYXg6IHRydWVcbn0pOyIsIiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xuICAgICQoZnVuY3Rpb24oKXtcbiAgICAgICAgJChcIi5lbGVtZW50XCIpLnR5cGVkKHtcbiAgICAgICAgICAgIHN0cmluZ3M6IFtcIkZpcnN0IF4xMDAwIHNlbnRlbmNlLlwiLCBcIlNlY29uZCBzZW50ZW5jZS5cIl0sXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5IHVzZSBhbiBIVE1MIGVsZW1lbnQgdG8gZ3JhYiBzdHJpbmdzIGZyb20gKG11c3Qgd3JhcCBlYWNoIHN0cmluZyBpbiBhIDxwPilcbiAgICAgICAgICAgIHN0cmluZ3NFbGVtZW50OiBudWxsLFxuICAgICAgICAgICAgLy8gdHlwaW5nIHNwZWVkXG4gICAgICAgICAgICB0eXBlU3BlZWQ6IDAsXG4gICAgICAgICAgICAvLyB0aW1lIGJlZm9yZSB0eXBpbmcgc3RhcnRzXG4gICAgICAgICAgICBzdGFydERlbGF5OiAwLFxuICAgICAgICAgICAgLy8gYmFja3NwYWNpbmcgc3BlZWRcbiAgICAgICAgICAgIGJhY2tTcGVlZDogMCxcbiAgICAgICAgICAgIC8vIHNodWZmbGUgdGhlIHN0cmluZ3NcbiAgICAgICAgICAgIHNodWZmbGU6IGZhbHNlLFxuICAgICAgICAgICAgLy8gdGltZSBiZWZvcmUgYmFja3NwYWNpbmdcbiAgICAgICAgICAgIGJhY2tEZWxheTogNTAwLFxuICAgICAgICAgICAgLy8gRmFkZSBvdXQgaW5zdGVhZCBvZiBiYWNrc3BhY2UgKG11c3QgdXNlIENTUyBjbGFzcylcbiAgICAgICAgICAgIGZhZGVPdXQ6IGZhbHNlLFxuICAgICAgICAgICAgZmFkZU91dENsYXNzOiAndHlwZWQtZmFkZS1vdXQnLFxuICAgICAgICAgICAgZmFkZU91dERlbGF5OiA1MDAsIC8vIG1pbGxpc2Vjb25kc1xuICAgICAgICAgICAgLy8gbG9vcFxuICAgICAgICAgICAgbG9vcDogZmFsc2UsXG4gICAgICAgICAgICAvLyBudWxsID0gaW5maW5pdGVcbiAgICAgICAgICAgIGxvb3BDb3VudDogbnVsbCxcbiAgICAgICAgICAgIC8vIHNob3cgY3Vyc29yXG4gICAgICAgICAgICBzaG93Q3Vyc29yOiB0cnVlLFxuICAgICAgICAgICAgLy8gY2hhcmFjdGVyIGZvciBjdXJzb3JcbiAgICAgICAgICAgIGN1cnNvckNoYXI6IFwifFwiLFxuICAgICAgICAgICAgLy8gYXR0cmlidXRlIHRvIHR5cGUgKG51bGwgPT0gdGV4dClcbiAgICAgICAgICAgIGF0dHI6IG51bGwsXG4gICAgICAgICAgICAvLyBlaXRoZXIgaHRtbCBvciB0ZXh0XG4gICAgICAgICAgICBjb250ZW50VHlwZTogJ2h0bWwnLFxuICAgICAgICAgICAgLy8gY2FsbCB3aGVuIGRvbmUgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgICAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbigpIHt9LFxuICAgICAgICAgICAgLy8gc3RhcnRpbmcgY2FsbGJhY2sgZnVuY3Rpb24gYmVmb3JlIGVhY2ggc3RyaW5nXG4gICAgICAgICAgICBwcmVTdHJpbmdUeXBlZDogZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgICAgIC8vY2FsbGJhY2sgZm9yIGV2ZXJ5IHR5cGVkIHN0cmluZ1xuICAgICAgICAgICAgb25TdHJpbmdUeXBlZDogZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgICAgIC8vIGNhbGxiYWNrIGZvciByZXNldFxuICAgICAgICAgICAgcmVzZXRDYWxsYmFjazogZnVuY3Rpb24oKSB7fVxuICAgICAgICB9KTtcbiAgICB9KTtcbn0pOyJdfQ==
