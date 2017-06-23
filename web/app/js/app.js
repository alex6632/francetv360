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
    $('.jsPlayRotateGlobe').click(function() {
        setInterval(bgscroll, scrollSpeed);
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
            infoTooltip.html("<img src='images/apercu/"+d.image+"' alt='' class='infoTooltip__img'><div class='infoTooltip__title'>"+d.name+"</div>")
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
            proj.scale(190);
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
            .attr("href","../images/marker-live.svg");
    } else {
        nodes.append("svg:image")
            .attr('transform', 'translate(-7, -7)')
            .attr('width', 7)
            .attr('height', 7)
            .attr('class','marker')
            .attr("href","../images/marker.svg");
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
                .attr("href","../images/marker-live.svg");
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
                .attr("href","../images/marker.svg");
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
                } else {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImludGVyYWN0aW9ucy5qcyIsInNjcm9sbGJhci5qcyIsInRpbWVsaW5lLmpzIiwidHlwZWQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaldBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIC0tLS0gU2V0dGluZ3MgLS0tLS1cbiAqL1xuXG4vL0luaXRcbnZhciB3aWR0aCA9IDEwMDAsXG4gICAgaGVpZ2h0ID0gNjAwLFxuICAgIHNlbnMgPSAwLjI1LFxuICAgIHNjYWxlID0gMSxcbiAgICBtYXJnaW4gPSB7dG9wOiAwLCByaWdodDogMCwgYm90dG9tOiAwLCBsZWZ0OiAwfTtcblxuLy9TZXR0aW5nIHByb2plY3Rpb25cbnZhciBwcm9qID0gZDMuZ2VvLm9ydGhvZ3JhcGhpYygpXG4gICAgLnNjYWxlKDE5MClcbiAgICAucm90YXRlKFswLCAwXSlcbiAgICAudHJhbnNsYXRlKFt3aWR0aCAvIDIsIGhlaWdodCAvIDJdKVxuICAgIC5jbGlwQW5nbGUoOTApO1xuXG52YXIgbWFya2VyUHJvaiA9IGQzLmdlby5vcnRob2dyYXBoaWMoKVxuICAgIC5zY2FsZSgxOTApXG4gICAgLnJvdGF0ZShbMCwgMF0pXG4gICAgLnRyYW5zbGF0ZShbd2lkdGggLyAyLCBoZWlnaHQgLyAyXSlcbiAgICAuY2xpcEFuZ2xlKDkwKTtcblxudmFyIHBhdGggPSBkMy5nZW8ucGF0aCgpLnByb2plY3Rpb24ocHJvaikucG9pbnRSYWRpdXMoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiA2XG59KTtcblxuLy9ab29tXG52YXIgem9vbSA9IGQzLmJlaGF2aW9yLnpvb20oKVxuICAgIC5zY2FsZUV4dGVudChbMSwgMl0pXG4gICAgLm9uKFwiem9vbVwiLCB6b29tZWQpO1xuXG4vL1NWRyBjb250YWluZXJcbnZhciBzdmcgPSBkMy5zZWxlY3QoXCJib2R5IC5ob21lLW1hcFwiKS5hcHBlbmQoXCJzdmdcIilcbiAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoKVxuICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodClcbiAgICAuYXR0cihcImNsYXNzXCIsIFwibWFwXCIpO1xuXG52YXIgZyA9IHN2Zy5hcHBlbmQoXCJnXCIpLmNhbGwoem9vbSlcbiAgICAub24oXCJtb3VzZWRvd24uem9vbVwiLCBudWxsKVxuICAgIC5vbihcInRvdWNoc3RhcnQuem9vbVwiLCBudWxsKVxuICAgIC5vbihcInRvdWNobW92ZS56b29tXCIsIG51bGwpXG4gICAgLm9uKFwidG91Y2hlbmQuem9vbVwiLCBudWxsKTtcblxuLy9BZGQgZ3JhZGllbnQgb24gd2F0ZXJcbnZhciBkZWZzID0gc3ZnLmFwcGVuZChcImRlZnNcIik7XG52YXIgZ3JhZGllbnQgPSBkZWZzLmFwcGVuZChcImxpbmVhckdyYWRpZW50XCIpXG4gICAgLmF0dHIoXCJpZFwiLCBcImdyYWRpZW50XCIpXG4gICAgLmF0dHIoXCJ4MVwiLFwiMFwiKVxuICAgIC5hdHRyKFwieDJcIixcIjFcIilcbiAgICAuYXR0cihcInkxXCIsXCIwXCIpXG4gICAgLmF0dHIoXCJ5MlwiLFwiMVwiKTtcbmdyYWRpZW50LmFwcGVuZChcInN0b3BcIilcbiAgICAuYXR0cihcIm9mZnNldFwiLCBcIjAlXCIpXG4gICAgLmF0dHIoXCJzdG9wLWNvbG9yXCIsIFwiIzAwMFwiKVxuICAgIC5hdHRyKFwic3RvcC1vcGFjaXR5XCIsIFwiMC4xNlwiKTtcbmdyYWRpZW50LmFwcGVuZChcInN0b3BcIilcbiAgICAuYXR0cihcIm9mZnNldFwiLCBcIjEwMCVcIilcbiAgICAuYXR0cihcInN0b3AtY29sb3JcIiwgXCIjRkZGXCIpXG4gICAgLmF0dHIoXCJzdG9wLW9wYWNpdHlcIiwgXCIwLjE2XCIpO1xuXG52YXIgaW5mb1Rvb2x0aXAgPSBkMy5zZWxlY3QoXCJib2R5XCIpLmFwcGVuZChcImRpdlwiKS5hdHRyKFwiY2xhc3NcIiwgXCJpbmZvVG9vbHRpcFwiKTtcbnZhciBtb2RhbEluZm8gPSBkMy5zZWxlY3QoXCJkaXYubW9kYWxJbmZvXCIpO1xuXG52YXIgc2Nyb2xsU3BlZWQgPSA1MDtcbnZhciBjdXJyZW50ID0gMDtcbnZhciDOuyA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgLmRvbWFpbihbMCwgd2lkdGhdKVxuICAgIC5yYW5nZShbLTE4MCwgMTgwXSk7XG5cbnF1ZXVlKClcbiAgICAuZGVmZXIoZDMuanNvbiwgXCIuLi9kYXRhL3dvcmxkLTExMG0uanNvblwiKVxuICAgIC5kZWZlcihkMy5qc29uLCBcIi4uL2RhdGEvbWFya2VyLmpzb25cIilcbiAgICAuZGVmZXIoZDMudHN2LCBcIi4uL2RhdGEvZmlsdGVyLW5hbWVzLnRzdlwiKVxuICAgIC5hd2FpdChyZWFkeSk7XG5cblxuLypcbiAqIC0tLS0gRnVuY3Rpb25zIC0tLS0tXG4gKi9cblxuLy9ab29tIGZ1bmN0aW9uXG5mdW5jdGlvbiB6b29tZWQoKSB7XG4gICAgZy5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgZDMuZXZlbnQudHJhbnNsYXRlICsgXCIpc2NhbGUoXCIgKyBkMy5ldmVudC5zY2FsZSArIFwiKVwiKTtcbn1cblxuLy9NYWluIGZ1bmN0aW9uXG5mdW5jdGlvbiByZWFkeShlcnJvciwgd29ybGQsIGxvY2F0aW9ucywgZmlsdGVycykge1xuXG4gICAgJCgnLm1vZGFsSW5mbycpLm9uKCdjbGljaycsICcuanNDbG9zZU1vZGFsSW5mbycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkKHRoaXMpLnBhcmVudCgnLm1vZGFsSW5mbycpLmZhZGVPdXQoKTtcbiAgICAgICAgJCgnLmhvbWUtbWFwJykuY3NzKHtcbiAgICAgICAgICAgIGxlZnQ6IFwiNTAlXCIsXG4gICAgICAgICAgICB0cmFuc2l0aW9uOiBcImFsbCA4MDBtcyA4MDBtcyBlYXNlXCIsXG4gICAgICAgICAgICB6SW5kZXg6IDlcbiAgICAgICAgfSk7XG4gICAgICAgICQoJy50aW1lbGluZScpLmNzcyh7XG4gICAgICAgICAgICB0cmFuc2Zvcm06IFwidHJhbnNsYXRlKC01MCUsIDAlKVwiLFxuICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgIHRyYW5zaXRpb246IFwiYWxsIDgwMG1zIDgwMG1zIGVhc2VcIlxuICAgICAgICB9KTtcbiAgICAgICAgJCgnLmZpbHRlcicpLmNzcyh7XG4gICAgICAgICAgICB0cmFuc2Zvcm06IFwidHJhbnNsYXRlKDAsIC01MCUpXCIsXG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNpdGlvbjogXCJhbGwgODAwbXMgODAwbXMgZWFzZVwiXG4gICAgICAgIH0pO1xuICAgICAgICAkKCcuZGF0YS1yaWdodCcpLmNzcyh7XG4gICAgICAgICAgICB0cmFuc2Zvcm06IFwidHJhbnNsYXRlKDAsIC01MCUpXCIsXG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNpdGlvbjogXCJhbGwgODAwbXMgODAwbXMgZWFzZVwiXG4gICAgICAgIH0pO1xuICAgICAgICAkKCcudG9vbGJhci1oZWFkZXInKS5jc3Moe1xuICAgICAgICAgICAgZGlzcGxheTogXCJibG9ja1wiXG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgICQoJy5qc1BsYXlSb3RhdGVHbG9iZScpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICBzZXRJbnRlcnZhbChiZ3Njcm9sbCwgc2Nyb2xsU3BlZWQpO1xuICAgIH0pO1xuICAgIC8vICQoJ3N2Zy5tYXAgPiBnJykuaG92ZXIoZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgIGNsZWFySW50ZXJ2YWwodkF1dG9Sb3RhdGUpO1xuICAgIC8vIH0sIGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICBzZXRJbnRlcnZhbChiZ3Njcm9sbCwgNTApO1xuICAgIC8vIH0pO1xuXG4gICAgLy9BZGRpbmcgd2F0ZXJcbiAgICB2YXIgd2F0ZXIgPSBnLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5kYXR1bSh7dHlwZTogJ1NwaGVyZSd9KVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnd2F0ZXInKVxuICAgICAgICAuYXR0cignZCcsIHBhdGgpXG4gICAgICAgIC5jYWxsKGQzLmJlaGF2aW9yLmRyYWcoKVxuICAgICAgICAgICAgLm9yaWdpbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgciA9IHByb2oucm90YXRlKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHt4OiByWzBdIC8gc2VucywgeTogLXJbMV0gLyBzZW5zfTsgfSlcbiAgICAgICAgICAgIC5vbignZHJhZycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHZBdXRvUm90YXRlKTtcbiAgICAgICAgICAgICAgICB2YXIgcm90YXRlID0gcHJvai5yb3RhdGUoKTtcbiAgICAgICAgICAgICAgICBwcm9qLnJvdGF0ZShbZDMuZXZlbnQueCAqIHNlbnMsIC1kMy5ldmVudC55ICogc2Vucywgcm90YXRlWzJdXSk7XG4gICAgICAgICAgICAgICAgZy5zZWxlY3RBbGwoJy5sYW5kJykuYXR0cignZCcsIHBhdGgpO1xuXG4gICAgICAgICAgICAgICAgLy8gZm9yIGVhY2ggbm9kZVxuICAgICAgICAgICAgICAgIG5vZGVzLmVhY2goZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IGQzLnNlbGVjdCh0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvbl9sYXQgPSBbZC5sb24sIGQubGF0XSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2pfcG9zID0gcHJvaihsb25fbGF0KTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgaGFzUGF0aCA9IHBhdGgoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiUG9pbnRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb29yZGluYXRlczogbG9uX2xhdFxuICAgICAgICAgICAgICAgICAgICAgICAgfSkgIT0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChoYXNQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnN0eWxlKFwiZGlzcGxheVwiLFwiaW5saW5lXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5hdHRyKFwidHJhbnNmb3JtXCIsICd0cmFuc2xhdGUoJyArIHByb2pfcG9zWzBdICsgJywnICsgcHJval9wb3NbMV0gKyAnKScpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnN0eWxlKFwiZGlzcGxheVwiLFwibm9uZVwiKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICApO1xuXG4gICAgdmFyIGNvdW50cmllcyA9IHRvcG9qc29uLmZlYXR1cmUod29ybGQsIHdvcmxkLm9iamVjdHMuY291bnRyaWVzKS5mZWF0dXJlcztcbiAgICBnLnNlbGVjdEFsbCgnZy5sYW5kJylcbiAgICAgICAgLmRhdGEoY291bnRyaWVzKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnbGFuZCcpXG4gICAgICAgIC5hdHRyKCdkJywgcGF0aClcbiAgICAgICAgLmNhbGwoZDMuYmVoYXZpb3IuZHJhZygpXG4gICAgICAgICAgICAub3JpZ2luKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciByID0gcHJvai5yb3RhdGUoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge3g6IHJbMF0gLyBzZW5zLCB5OiAtclsxXSAvIHNlbnN9OyB9KVxuICAgICAgICAgICAgLm9uKCdkcmFnJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodkF1dG9Sb3RhdGUpO1xuICAgICAgICAgICAgICAgIHZhciByb3RhdGUgPSBwcm9qLnJvdGF0ZSgpO1xuICAgICAgICAgICAgICAgIHByb2oucm90YXRlKFtkMy5ldmVudC54ICogc2VucywgLWQzLmV2ZW50LnkgKiBzZW5zLCByb3RhdGVbMl1dKTtcbiAgICAgICAgICAgICAgICBnLnNlbGVjdEFsbCgnLmxhbmQnKS5hdHRyKCdkJywgcGF0aCk7XG5cbiAgICAgICAgICAgICAgICAvLyBmb3IgZWFjaCBub2RlXG4gICAgICAgICAgICAgICAgbm9kZXMuZWFjaChmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxmID0gZDMuc2VsZWN0KHRoaXMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgbG9uX2xhdCA9IFtkLmxvbiwgZC5sYXRdLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJval9wb3MgPSBwcm9qKGxvbl9sYXQpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIHRvIHNlZSBpZiBpdCdzIHN0aWxsIHZpc2libGVcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhhc1BhdGggPSBwYXRoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlBvaW50XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29vcmRpbmF0ZXM6IGxvbl9sYXRcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pICE9IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgICAgICAvLyBpZiBpdCBpcyBzaG93IGl0IGFuZCB1cGRhdGUgcG9zaXRpb25cbiAgICAgICAgICAgICAgICAgICAgaWYgKGhhc1BhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc3R5bGUoXCJkaXNwbGF5XCIsXCJpbmxpbmVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgJ3RyYW5zbGF0ZSgnICsgcHJval9wb3NbMF0gKyAnLCcgKyBwcm9qX3Bvc1sxXSArICcpJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBvdGhlcndpc2UgaGlkZSBpdFxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc3R5bGUoXCJkaXNwbGF5XCIsXCJub25lXCIpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICk7XG5cbiAgICB2YXIgbm9kZXMgPSBnLnNlbGVjdEFsbCgnZy5ub2RlJylcbiAgICAgICAgLmRhdGEobG9jYXRpb25zKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoJ2cnKS5hdHRyKCdjbGFzcycsICdub2RlJylcbiAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIHZhciBwcm9qX3BvcyA9IHByb2ooW2QubG9uLCBkLmxhdF0pO1xuICAgICAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoJyArIHByb2pfcG9zWzBdICsgJywnICsgcHJval9wb3NbMV0gKyAnKSc7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKCdzdHlsZScsICdjdXJzb3I6IHBvaW50ZXInKVxuICAgICAgICAuYXR0cihcImRcIiwgcGF0aClcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgdmFyIGNhdGVnb3J5ID0gZC5jYXRlZ29yeSxcbiAgICAgICAgICAgICAgICBpbnB1dENhdGVnb3J5LFxuICAgICAgICAgICAgICAgIG15Q2xhc3M7XG4gICAgICAgICAgICBkMy5zZWxlY3RBbGwoXCIuZmlsdGVyX19pdGVtIGlucHV0XCIpLmVhY2goZnVuY3Rpb24oZCl7XG4gICAgICAgICAgICAgICAgY2IgPSBkMy5zZWxlY3QodGhpcyk7XG4gICAgICAgICAgICAgICAgaWYoY2IucHJvcGVydHkoXCJjaGVja2VkXCIpKXtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXRDYXRlZ29yeSA9IGNiLnByb3BlcnR5KFwiaWRcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmKGNhdGVnb3J5ID09IGlucHV0Q2F0ZWdvcnkpIHtcbiAgICAgICAgICAgICAgICBteUNsYXNzID0gJ25vZGUgc2hvdyc7XG4gICAgICAgICAgICAgICAgaWYoY2F0ZWdvcnkgPT0gNikge1xuICAgICAgICAgICAgICAgICAgICBteUNsYXNzICs9ICcgbGl2ZSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBteUNsYXNzO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ25vZGUgaGlkZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignbW91c2VvdmVyJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgaW5mb1Rvb2x0aXAuaHRtbChcIjxpbWcgc3JjPSdpbWFnZXMvYXBlcmN1L1wiK2QuaW1hZ2UrXCInIGFsdD0nJyBjbGFzcz0naW5mb1Rvb2x0aXBfX2ltZyc+PGRpdiBjbGFzcz0naW5mb1Rvb2x0aXBfX3RpdGxlJz5cIitkLm5hbWUrXCI8L2Rpdj5cIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJsZWZ0XCIsIChkMy5ldmVudC5wYWdlWCArIDIwKSArIFwicHhcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJ0b3BcIiwgKGQzLmV2ZW50LnBhZ2VZIC0gNTApICsgXCJweFwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcImRpc3BsYXlcIiwgXCJibG9ja1wiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcIm9wYWNpdHlcIiwgMSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIGluZm9Ub29sdGlwLnN0eWxlKFwib3BhY2l0eVwiLCAwKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuICAgICAgICB9KVxuICAgICAgICAub24oXCJtb3VzZW1vdmVcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgaW5mb1Rvb2x0aXAuc3R5bGUoXCJsZWZ0XCIsIChkMy5ldmVudC5wYWdlWCArIDIwKSArIFwicHhcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJ0b3BcIiwgKGQzLmV2ZW50LnBhZ2VZIC0gNTApICsgXCJweFwiKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgdmFyIG1haW5QYWdlID0gZDMuc2VsZWN0KFwiLm1haW4tcGFnZVwiKTtcbiAgICAgICAgICAgIHZhciBtb2RhbEluZm9fX3RpdGxlID0gZDMuc2VsZWN0KFwiZGl2Lm1vZGFsSW5mb19faW5uZXJfX3RpdGxlXCIpO1xuICAgICAgICAgICAgdmFyIG1vZGFsSW5mb19fdmlkZW8gPSBkMy5zZWxlY3QoXCJkaXYubW9kYWxJbmZvX19pbm5lcl9fdmlkZW9cIik7XG4gICAgICAgICAgICBtb2RhbEluZm9fX3RpdGxlLmh0bWwoZC5uYW1lKTtcbiAgICAgICAgICAgIG1vZGFsSW5mb19fdmlkZW8uaHRtbChcIjxpZnJhbWUgd2lkdGg9JzU2MCcgaGVpZ2h0PSczMTUnIHNyYz0naHR0cHM6Ly93d3cueW91dHViZS5jb20vZW1iZWQvXCIrZC50b2tlbitcIicgZnJhbWVib3JkZXI9JzAnIGFsbG93ZnVsbHNjcmVlbj48L2lmcmFtZT5cIik7XG4gICAgICAgICAgICBwcm9qLnNjYWxlKDE5MCk7XG4gICAgICAgICAgICBkMy5zZWxlY3QoXCIudGltZWxpbmVcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJvcGFjaXR5XCIsIFwiMFwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgtNTAlLCA0MDAlKVwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcInRyYW5zaXRpb25cIiwgXCJhbGwgODAwbXMgZWFzZVwiKTtcbiAgICAgICAgICAgIGQzLnNlbGVjdChcIi5maWx0ZXJcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJvcGFjaXR5XCIsIFwiMFwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgtMTAwJSwgLTUwJSlcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJ0cmFuc2l0aW9uXCIsIFwiYWxsIDgwMG1zIGVhc2VcIik7XG4gICAgICAgICAgICBkMy5zZWxlY3QoXCIuZGF0YS1yaWdodFwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcIm9wYWNpdHlcIiwgXCIwXCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDEwMCUsIC01MCUpXCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwidHJhbnNpdGlvblwiLCBcImFsbCA4MDBtcyBlYXNlXCIpO1xuICAgICAgICAgICAgZDMuc2VsZWN0KFwiLnRvb2xiYXItaGVhZGVyXCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gICAgICAgICAgICBkMy5zZWxlY3QoXCIuaG9tZS1tYXBcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJsZWZ0XCIsIFwiMFwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcInRyYW5zaXRpb25cIiwgXCJhbGwgODAwbXMgZWFzZVwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcInotaW5kZXhcIiwgXCI5OTlcIik7XG4gICAgICAgICAgICAkKCcubW9kYWxJbmZvJykuZGVsYXkoMTAwMCkuZmFkZUluKCk7XG4gICAgICAgIH0pO1xuXG4gICAgaWYoJCgnLm5vZGUnKS5oYXNDbGFzcygnbGl2ZScpKSB7XG4gICAgICAgIG5vZGVzLmFwcGVuZChcInN2ZzppbWFnZVwiKVxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoLTcsIC03KScpXG4gICAgICAgICAgICAuYXR0cignd2lkdGgnLCA3KVxuICAgICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIDcpXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCdtYXJrZXInKVxuICAgICAgICAgICAgLmF0dHIoXCJocmVmXCIsXCIuLi9pbWFnZXMvbWFya2VyLWxpdmUuc3ZnXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG5vZGVzLmFwcGVuZChcInN2ZzppbWFnZVwiKVxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoLTcsIC03KScpXG4gICAgICAgICAgICAuYXR0cignd2lkdGgnLCA3KVxuICAgICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIDcpXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCdtYXJrZXInKVxuICAgICAgICAgICAgLmF0dHIoXCJocmVmXCIsXCIuLi9pbWFnZXMvbWFya2VyLnN2Z1wiKTtcbiAgICB9XG5cbiAgICBkMy5zZWxlY3RBbGwoXCIuZmlsdGVyX19pdGVtIGlucHV0XCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uKGQpe1xuICAgICAgICB2YXIgc2VsZWN0ZWQgPSB0aGlzLmlkLFxuICAgICAgICAgICAgb3BhY2l0eSA9IHRoaXMuY2hlY2tlZCA/IDEgOiAwO1xuXG4gICAgICAgIGlmKHNlbGVjdGVkID09IDYpIHtcbiAgICAgICAgICAgIG5vZGVzXG4gICAgICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxlY3RlZCA9PSBkLmNhdGVnb3J5O1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnN0eWxlKCdvcGFjaXR5Jywgb3BhY2l0eSlcbiAgICAgICAgICAgICAgICAuYXBwZW5kKFwic3ZnOmltYWdlXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoLTcsIC03KScpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgNylcbiAgICAgICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgNylcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCdtYXJrZXInKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiaHJlZlwiLFwiLi4vaW1hZ2VzL21hcmtlci1saXZlLnN2Z1wiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5vZGVzXG4gICAgICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxlY3RlZCA9PSBkLmNhdGVnb3J5O1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnN0eWxlKCdvcGFjaXR5Jywgb3BhY2l0eSlcbiAgICAgICAgICAgICAgICAuYXBwZW5kKFwic3ZnOmltYWdlXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoLTcsIC03KScpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgNylcbiAgICAgICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgNylcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCdtYXJrZXInKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiaHJlZlwiLFwiLi4vaW1hZ2VzL21hcmtlci5zdmdcIik7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIGJnc2Nyb2xsKCkge1xuICAgICAgICBjdXJyZW50ICs9IDE7XG4gICAgICAgIHByb2oucm90YXRlKFvOuyhjdXJyZW50KSwgMF0pO1xuICAgICAgICBtYXJrZXJQcm9qLnJvdGF0ZShbzrsoY3VycmVudCksIDBdKTtcbiAgICAgICAgZy5zZWxlY3RBbGwoJy5sYW5kJykuYXR0cignZCcsIHBhdGgpO1xuICAgICAgICBub2Rlc1xuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICB2YXIgcHJval9wb3MgPSBwcm9qKFtkLmxvbiwgZC5sYXRdKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgcHJval9wb3NbMF0gKyAnLCcgKyBwcm9qX3Bvc1sxXSArICcpJztcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuYXR0cihcImRpc3BsYXlcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgIHZhciBsb25fbGF0ID0gW2QubG9uLCBkLmxhdF0sXG4gICAgICAgICAgICAgICAgICAgIHByb2pfcG9zID0gcHJvaihsb25fbGF0KTtcblxuICAgICAgICAgICAgICAgIHZhciBoYXNQYXRoID0gcGF0aCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlBvaW50XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb29yZGluYXRlczogbG9uX2xhdFxuICAgICAgICAgICAgICAgICAgICB9KSAhPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgICAgICBpZiAoaGFzUGF0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJpbmxpbmVcIjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICB9XG4gICAgdmFyIHZBdXRvUm90YXRlID0gc2V0SW50ZXJ2YWwoYmdzY3JvbGwsIHNjcm9sbFNwZWVkKTtcbn1cbiIsIiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xuICAgICQoJy5qc09wZW5TZWFyY2gnKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnLnNlYXJjaCcpLmZhZGVJbigpO1xuICAgIH0pO1xuICAgICQoJy5qc0Nsb3NlU2VhcmNoJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICQoJy5zZWFyY2gnKS5mYWRlT3V0KCk7XG4gICAgfSk7XG4gICAgJCgnLm1lZ2Etc2VhcmNoX19pbnB1dCcpLmZvY3VzKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKCcubWVnYS1zZWFyY2gnKS5hZGRDbGFzcygnZm9jdXMnKTtcbiAgICB9KS5ibHVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJCgnLm1lZ2Etc2VhcmNoJykucmVtb3ZlQ2xhc3MoJ2ZvY3VzJyk7XG4gICAgfSk7XG5cblxuICAgIC8vIERhdGEgcmlnaHQuLi5cbiAgICB2YXIgbmJQcm9nID0ge1xuICAgICAgICBcImZpbG1zXCIgOiAzMTA0LFxuICAgICAgICBcInNwb3J0XCIgOiAyODU2LFxuICAgICAgICBcImFjdHVzXCI6IDM2NDcsXG4gICAgICAgIFwiZG9jdVwiOiAxNzk2LFxuICAgICAgICBcInNlcmllXCI6IDEzMjUsXG4gICAgICAgIFwibGl2ZVwiOiA3NjUsXG4gICAgICAgIFwidmllX3F1b1wiOiAxNTQ3LFxuICAgICAgICBcImVuZmFudHNcIjogNDc2NVxuICAgIH07XG4gICAgdmFyIG5iRXhwbG8gPSB7XG4gICAgICAgIFwiZmlsbXNcIiA6IDI2NTE0LFxuICAgICAgICBcInNwb3J0XCIgOiAyNjUxNCxcbiAgICAgICAgXCJhY3R1c1wiOiAyNjUxNCxcbiAgICAgICAgXCJkb2N1XCI6IDI2NTE0LFxuICAgICAgICBcInNlcmllXCI6IDI2NTE0LFxuICAgICAgICBcImxpdmVcIjogMjY1MTQsXG4gICAgICAgIFwidmllX3F1b1wiOiAyNjUxNCxcbiAgICAgICAgXCJlbmZhbnRzXCI6IDI2NTE0XG4gICAgfTtcblxuXG4gICAgLy92YXIgeCA9IG5iUHJvZ1snZmlsbXMnXTtcbn0pOyIsIiQod2luZG93KS5vbihcImxvYWRcIixmdW5jdGlvbigpe1xuICAgICQoXCIuZmlsdGVyXCIpLm1DdXN0b21TY3JvbGxiYXIoe1xuICAgICAgICBheGlzOlwieVwiLFxuICAgICAgICB0aGVtZTpcImxpZ2h0LTJcIlxuICAgIH0pO1xufSk7IiwiLy8gSW5pdGlhbGlzYXRpb24gZGVzIHZhcmlhYmxlcy4uLlxudmFyIGRhdGUgPSBuZXcgRGF0ZSxcbiAgICBqID0gZGF0ZS5nZXREYXRlKCksXG4gICAgajcgPSBqLTcsXG4gICAgdGFiX2pvdXJzID0gbmV3IEFycmF5KFwiRFwiLCBcIkxcIiwgXCJNXCIsIFwiTVwiLCBcIkpcIiwgXCJWXCIsIFwiU1wiKSxcbiAgICBpbmRleF9qb3VycyA9IFtdLFxuICAgIHRhYl9qID0gW10sXG4gICAgdGFiX2RhdGUgPSBbXTtcblxuZm9yKHZhciBhPTA7IGE8NzsgYSsrKSB7XG4gICAgaWYoZGF0ZS5nZXREYXkoKS1hID49IDApIHtcbiAgICAgICAgaW5kZXhfam91cnMucHVzaChkYXRlLmdldERheSgpLWEpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGluZGV4X2pvdXJzLnB1c2goZGF0ZS5nZXREYXkoKSs3LWEpO1xuICAgIH1cbn1cblxuZm9yICh2YXIgaT1qOyBpPj1qNzsgaS0tKSB7XG4gICAgdGFiX2oucHVzaChpKTtcbn1cblxuZm9yKHZhciBiPTA7IGI8NzsgYisrKSB7XG4gICAgdmFyIGRhdGVfY29tcGxldGUgPSB0YWJfam91cnNbaW5kZXhfam91cnNbYl1dK1wiIFwiK3RhYl9qW2JdO1xuICAgIHRhYl9kYXRlLnB1c2goZGF0ZV9jb21wbGV0ZSk7XG59XG5cbiQoXCIjdGltZWxpbmUtY3VzdG9tXCIpLmlvblJhbmdlU2xpZGVyKHtcbiAgICB0eXBlOiBcInNpbmdsZVwiLFxuICAgIHZhbHVlczogW3RhYl9kYXRlWzZdLCB0YWJfZGF0ZVs1XSwgdGFiX2RhdGVbNF0sIHRhYl9kYXRlWzNdLCB0YWJfZGF0ZVsyXSwgdGFiX2RhdGVbMV0sIHRhYl9kYXRlWzBdXSxcbiAgICBncmlkOiB0cnVlLFxuICAgIGZyb206IDYsXG4gICAgaGlkZV9taW5fbWF4OiB0cnVlXG59KTsiLCIkKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcbiAgICAkKGZ1bmN0aW9uKCl7XG4gICAgICAgICQoXCIuZWxlbWVudFwiKS50eXBlZCh7XG4gICAgICAgICAgICBzdHJpbmdzOiBbXCJGaXJzdCBeMTAwMCBzZW50ZW5jZS5cIiwgXCJTZWNvbmQgc2VudGVuY2UuXCJdLFxuICAgICAgICAgICAgLy8gT3B0aW9uYWxseSB1c2UgYW4gSFRNTCBlbGVtZW50IHRvIGdyYWIgc3RyaW5ncyBmcm9tIChtdXN0IHdyYXAgZWFjaCBzdHJpbmcgaW4gYSA8cD4pXG4gICAgICAgICAgICBzdHJpbmdzRWxlbWVudDogbnVsbCxcbiAgICAgICAgICAgIC8vIHR5cGluZyBzcGVlZFxuICAgICAgICAgICAgdHlwZVNwZWVkOiAwLFxuICAgICAgICAgICAgLy8gdGltZSBiZWZvcmUgdHlwaW5nIHN0YXJ0c1xuICAgICAgICAgICAgc3RhcnREZWxheTogMCxcbiAgICAgICAgICAgIC8vIGJhY2tzcGFjaW5nIHNwZWVkXG4gICAgICAgICAgICBiYWNrU3BlZWQ6IDAsXG4gICAgICAgICAgICAvLyBzaHVmZmxlIHRoZSBzdHJpbmdzXG4gICAgICAgICAgICBzaHVmZmxlOiBmYWxzZSxcbiAgICAgICAgICAgIC8vIHRpbWUgYmVmb3JlIGJhY2tzcGFjaW5nXG4gICAgICAgICAgICBiYWNrRGVsYXk6IDUwMCxcbiAgICAgICAgICAgIC8vIEZhZGUgb3V0IGluc3RlYWQgb2YgYmFja3NwYWNlIChtdXN0IHVzZSBDU1MgY2xhc3MpXG4gICAgICAgICAgICBmYWRlT3V0OiBmYWxzZSxcbiAgICAgICAgICAgIGZhZGVPdXRDbGFzczogJ3R5cGVkLWZhZGUtb3V0JyxcbiAgICAgICAgICAgIGZhZGVPdXREZWxheTogNTAwLCAvLyBtaWxsaXNlY29uZHNcbiAgICAgICAgICAgIC8vIGxvb3BcbiAgICAgICAgICAgIGxvb3A6IGZhbHNlLFxuICAgICAgICAgICAgLy8gbnVsbCA9IGluZmluaXRlXG4gICAgICAgICAgICBsb29wQ291bnQ6IG51bGwsXG4gICAgICAgICAgICAvLyBzaG93IGN1cnNvclxuICAgICAgICAgICAgc2hvd0N1cnNvcjogdHJ1ZSxcbiAgICAgICAgICAgIC8vIGNoYXJhY3RlciBmb3IgY3Vyc29yXG4gICAgICAgICAgICBjdXJzb3JDaGFyOiBcInxcIixcbiAgICAgICAgICAgIC8vIGF0dHJpYnV0ZSB0byB0eXBlIChudWxsID09IHRleHQpXG4gICAgICAgICAgICBhdHRyOiBudWxsLFxuICAgICAgICAgICAgLy8gZWl0aGVyIGh0bWwgb3IgdGV4dFxuICAgICAgICAgICAgY29udGVudFR5cGU6ICdodG1sJyxcbiAgICAgICAgICAgIC8vIGNhbGwgd2hlbiBkb25lIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICAgICAgICBjYWxsYmFjazogZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgICAgIC8vIHN0YXJ0aW5nIGNhbGxiYWNrIGZ1bmN0aW9uIGJlZm9yZSBlYWNoIHN0cmluZ1xuICAgICAgICAgICAgcHJlU3RyaW5nVHlwZWQ6IGZ1bmN0aW9uKCkge30sXG4gICAgICAgICAgICAvL2NhbGxiYWNrIGZvciBldmVyeSB0eXBlZCBzdHJpbmdcbiAgICAgICAgICAgIG9uU3RyaW5nVHlwZWQ6IGZ1bmN0aW9uKCkge30sXG4gICAgICAgICAgICAvLyBjYWxsYmFjayBmb3IgcmVzZXRcbiAgICAgICAgICAgIHJlc2V0Q2FsbGJhY2s6IGZ1bmN0aW9uKCkge31cbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTsiXX0=
