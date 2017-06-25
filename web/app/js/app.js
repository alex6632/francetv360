/*
 * ---- Settings -----
 */

//Init
var width = 1000,
    height = 600,
    sens = 0.25,
    scale = 130,
    margin = {top: 0, right: 0, bottom: 0, left: 0};

//Setting projection
var proj = d3.geo.orthographic()
    //.scale(190)
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

$(window).on('load', function() {
    $('.loader').fadeOut();
});

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
        "1" : 3104,
        "2" : 2856,
        "3": 3647,
        "4": 1796,
        "5": 1325,
        "6": 765,
        "7": 1547,
        "8": 4765,
        "9": 3647,
        "10": 1796,
        "11": 1325,
        "12": 765,
        "13": 1547
    };
    var nbExplo = {
        "1" : 26514,
        "2" : 19087,
        "3": 22357,
        "4": 12345,
        "5": 14356,
        "6": 18634,
        "7": 34097,
        "8": 38320,
        "9": 12345,
        "10": 14356,
        "11": 18634,
        "12": 34097,
        "13": 38320
    };

    var indice,
        totalProg = 0,
        totalExplo = 0,
        input = $(".filter__item input"),
        inputChecked = [],
        dataProg = $('.data-prog'),
        dataExplo = $('.data-explo');

    dataProg.html(nbProg[6]);
    dataExplo.html(nbExplo[6]);

    var id = $('.filter__item').find("input:checked").attr('id');
    inputChecked.push(id);
    //console.log(inputChecked);
    totalProg = nbProg[id];
    totalExplo = nbExplo[id];
    //console.log("totalProg : "+totalProg+" // totalExplo : "+totalExplo);

    input.on("change", function(){

        if($(this).is(':checked') == true) {
            inputChecked.push($(this).attr('id'));
            //console.log(inputChecked);

            totalProg += nbProg[$(this).attr('id')];
            totalExplo += nbExplo[$(this).attr('id')];

            dataProg.html(totalProg);
            dataExplo.html(totalExplo);

            //console.log("totalProg : "+totalProg+" // totalExplo : "+totalExplo);
        } else {
            indice = inputChecked.indexOf($(this).attr('id'));
            inputChecked.splice(indice, 1);
            //console.log(inputChecked);

            totalProg -= nbProg[$(this).attr('id')];
            totalExplo -= nbExplo[$(this).attr('id')];

            dataProg.html(totalProg);
            dataExplo.html(totalExplo);

            //console.log("totalProg : "+totalProg+" // totalExplo : "+totalExplo);
        }
    });

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
// $(document).ready(function() {
//     $(function(){
//         $(".element-typed").typed({
//             strings: [""],
//             stringsElement: null,
//             typeSpeed: 0,
//             startDelay: 0,
//             backSpeed: 0,
//             shuffle: false,
//             backDelay: 500,
//             fadeOut: false,
//             fadeOutClass: 'typed-fade-out',
//             fadeOutDelay: 500, // milliseconds
//             loop: false,
//             loopCount: null,
//             showCursor: true,
//             cursorChar: "|",
//             attr: null,
//             contentType: 'html'
//         });
//     });
// });
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImludGVyYWN0aW9ucy5qcyIsInNjcm9sbGJhci5qcyIsInRpbWVsaW5lLmpzIiwidHlwZWQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOVZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIC0tLS0gU2V0dGluZ3MgLS0tLS1cbiAqL1xuXG4vL0luaXRcbnZhciB3aWR0aCA9IDEwMDAsXG4gICAgaGVpZ2h0ID0gNjAwLFxuICAgIHNlbnMgPSAwLjI1LFxuICAgIHNjYWxlID0gMTMwLFxuICAgIG1hcmdpbiA9IHt0b3A6IDAsIHJpZ2h0OiAwLCBib3R0b206IDAsIGxlZnQ6IDB9O1xuXG4vL1NldHRpbmcgcHJvamVjdGlvblxudmFyIHByb2ogPSBkMy5nZW8ub3J0aG9ncmFwaGljKClcbiAgICAvLy5zY2FsZSgxOTApXG4gICAgLnNjYWxlKDE5MClcbiAgICAucm90YXRlKFswLCAwXSlcbiAgICAudHJhbnNsYXRlKFt3aWR0aCAvIDIsIGhlaWdodCAvIDJdKVxuICAgIC5jbGlwQW5nbGUoOTApO1xuXG52YXIgbWFya2VyUHJvaiA9IGQzLmdlby5vcnRob2dyYXBoaWMoKVxuICAgIC5zY2FsZSgxOTApXG4gICAgLnJvdGF0ZShbMCwgMF0pXG4gICAgLnRyYW5zbGF0ZShbd2lkdGggLyAyLCBoZWlnaHQgLyAyXSlcbiAgICAuY2xpcEFuZ2xlKDkwKTtcblxudmFyIHBhdGggPSBkMy5nZW8ucGF0aCgpLnByb2plY3Rpb24ocHJvaikucG9pbnRSYWRpdXMoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiA2XG59KTtcblxuLy9ab29tXG52YXIgem9vbSA9IGQzLmJlaGF2aW9yLnpvb20oKVxuICAgIC5zY2FsZUV4dGVudChbMSwgMl0pXG4gICAgLm9uKFwiem9vbVwiLCB6b29tZWQpO1xuXG4vL1NWRyBjb250YWluZXJcbnZhciBzdmcgPSBkMy5zZWxlY3QoXCJib2R5IC5ob21lLW1hcFwiKS5hcHBlbmQoXCJzdmdcIilcbiAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoKVxuICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodClcbiAgICAuYXR0cihcImNsYXNzXCIsIFwibWFwXCIpO1xuXG52YXIgZyA9IHN2Zy5hcHBlbmQoXCJnXCIpLmNhbGwoem9vbSlcbiAgICAub24oXCJtb3VzZWRvd24uem9vbVwiLCBudWxsKVxuICAgIC5vbihcInRvdWNoc3RhcnQuem9vbVwiLCBudWxsKVxuICAgIC5vbihcInRvdWNobW92ZS56b29tXCIsIG51bGwpXG4gICAgLm9uKFwidG91Y2hlbmQuem9vbVwiLCBudWxsKTtcblxuLy9BZGQgZ3JhZGllbnQgb24gd2F0ZXJcbnZhciBkZWZzID0gc3ZnLmFwcGVuZChcImRlZnNcIik7XG52YXIgZ3JhZGllbnQgPSBkZWZzLmFwcGVuZChcImxpbmVhckdyYWRpZW50XCIpXG4gICAgLmF0dHIoXCJpZFwiLCBcImdyYWRpZW50XCIpXG4gICAgLmF0dHIoXCJ4MVwiLFwiMFwiKVxuICAgIC5hdHRyKFwieDJcIixcIjFcIilcbiAgICAuYXR0cihcInkxXCIsXCIwXCIpXG4gICAgLmF0dHIoXCJ5MlwiLFwiMVwiKTtcbmdyYWRpZW50LmFwcGVuZChcInN0b3BcIilcbiAgICAuYXR0cihcIm9mZnNldFwiLCBcIjAlXCIpXG4gICAgLmF0dHIoXCJzdG9wLWNvbG9yXCIsIFwiIzAwMFwiKVxuICAgIC5hdHRyKFwic3RvcC1vcGFjaXR5XCIsIFwiMC4xNlwiKTtcbmdyYWRpZW50LmFwcGVuZChcInN0b3BcIilcbiAgICAuYXR0cihcIm9mZnNldFwiLCBcIjEwMCVcIilcbiAgICAuYXR0cihcInN0b3AtY29sb3JcIiwgXCIjRkZGXCIpXG4gICAgLmF0dHIoXCJzdG9wLW9wYWNpdHlcIiwgXCIwLjE2XCIpO1xuXG52YXIgaW5mb1Rvb2x0aXAgPSBkMy5zZWxlY3QoXCJib2R5XCIpLmFwcGVuZChcImRpdlwiKS5hdHRyKFwiY2xhc3NcIiwgXCJpbmZvVG9vbHRpcFwiKTtcbnZhciBtb2RhbEluZm8gPSBkMy5zZWxlY3QoXCJkaXYubW9kYWxJbmZvXCIpO1xuXG52YXIgc2Nyb2xsU3BlZWQgPSA1MDtcbnZhciBjdXJyZW50ID0gMDtcbnZhciDOuyA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgLmRvbWFpbihbMCwgd2lkdGhdKVxuICAgIC5yYW5nZShbLTE4MCwgMTgwXSk7XG5cbnF1ZXVlKClcbiAgICAuZGVmZXIoZDMuanNvbiwgXCIuLi9kYXRhL3dvcmxkLTExMG0uanNvblwiKVxuICAgIC5kZWZlcihkMy5qc29uLCBcIi4uL2RhdGEvbWFya2VyLmpzb25cIilcbiAgICAuZGVmZXIoZDMudHN2LCBcIi4uL2RhdGEvZmlsdGVyLW5hbWVzLnRzdlwiKVxuICAgIC5hd2FpdChyZWFkeSk7XG5cblxuLypcbiAqIC0tLS0gRnVuY3Rpb25zIC0tLS0tXG4gKi9cblxuLy9ab29tIGZ1bmN0aW9uXG5mdW5jdGlvbiB6b29tZWQoKSB7XG4gICAgZy5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgZDMuZXZlbnQudHJhbnNsYXRlICsgXCIpc2NhbGUoXCIgKyBkMy5ldmVudC5zY2FsZSArIFwiKVwiKTtcbn1cblxuLy9NYWluIGZ1bmN0aW9uXG5mdW5jdGlvbiByZWFkeShlcnJvciwgd29ybGQsIGxvY2F0aW9ucywgZmlsdGVycykge1xuXG5cbiAgICAkKCcubW9kYWxJbmZvJykub24oJ2NsaWNrJywgJy5qc0Nsb3NlTW9kYWxJbmZvJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICQodGhpcykucGFyZW50KCcubW9kYWxJbmZvJykuZmFkZU91dCgpO1xuICAgICAgICAkKCcuaG9tZS1tYXAnKS5jc3Moe1xuICAgICAgICAgICAgbGVmdDogXCI1MCVcIixcbiAgICAgICAgICAgIHRyYW5zaXRpb246IFwiYWxsIDgwMG1zIDgwMG1zIGVhc2VcIixcbiAgICAgICAgICAgIHpJbmRleDogOVxuICAgICAgICB9KTtcbiAgICAgICAgJCgnLnRpbWVsaW5lJykuY3NzKHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUoLTUwJSwgMCUpXCIsXG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNpdGlvbjogXCJhbGwgODAwbXMgODAwbXMgZWFzZVwiXG4gICAgICAgIH0pO1xuICAgICAgICAkKCcuZmlsdGVyJykuY3NzKHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUoMCwgLTUwJSlcIixcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICB0cmFuc2l0aW9uOiBcImFsbCA4MDBtcyA4MDBtcyBlYXNlXCJcbiAgICAgICAgfSk7XG4gICAgICAgICQoJy5kYXRhLXJpZ2h0JykuY3NzKHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUoMCwgLTUwJSlcIixcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICB0cmFuc2l0aW9uOiBcImFsbCA4MDBtcyA4MDBtcyBlYXNlXCJcbiAgICAgICAgfSk7XG4gICAgICAgICQoJy50b29sYmFyLWhlYWRlcicpLmNzcyh7XG4gICAgICAgICAgICBkaXNwbGF5OiBcImJsb2NrXCJcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgJCgnLmpzUGxheVJvdGF0ZUdsb2JlJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgIHNldEludGVydmFsKGJnc2Nyb2xsLCBzY3JvbGxTcGVlZCk7XG4gICAgfSk7XG5cbiAgICAvL0FkZGluZyB3YXRlclxuICAgIHZhciB3YXRlciA9IGcuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmRhdHVtKHt0eXBlOiAnU3BoZXJlJ30pXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICd3YXRlcicpXG4gICAgICAgIC5hdHRyKCdkJywgcGF0aClcbiAgICAgICAgLmNhbGwoZDMuYmVoYXZpb3IuZHJhZygpXG4gICAgICAgICAgICAub3JpZ2luKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciByID0gcHJvai5yb3RhdGUoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge3g6IHJbMF0gLyBzZW5zLCB5OiAtclsxXSAvIHNlbnN9OyB9KVxuICAgICAgICAgICAgLm9uKCdkcmFnJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodkF1dG9Sb3RhdGUpO1xuICAgICAgICAgICAgICAgIHZhciByb3RhdGUgPSBwcm9qLnJvdGF0ZSgpO1xuICAgICAgICAgICAgICAgIHByb2oucm90YXRlKFtkMy5ldmVudC54ICogc2VucywgLWQzLmV2ZW50LnkgKiBzZW5zLCByb3RhdGVbMl1dKTtcbiAgICAgICAgICAgICAgICBnLnNlbGVjdEFsbCgnLmxhbmQnKS5hdHRyKCdkJywgcGF0aCk7XG5cbiAgICAgICAgICAgICAgICAvLyBmb3IgZWFjaCBub2RlXG4gICAgICAgICAgICAgICAgbm9kZXMuZWFjaChmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxmID0gZDMuc2VsZWN0KHRoaXMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgbG9uX2xhdCA9IFtkLmxvbiwgZC5sYXRdLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJval9wb3MgPSBwcm9qKGxvbl9sYXQpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBoYXNQYXRoID0gcGF0aCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJQb2ludFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvb3JkaW5hdGVzOiBsb25fbGF0XG4gICAgICAgICAgICAgICAgICAgICAgICB9KSAhPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGhhc1BhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc3R5bGUoXCJkaXNwbGF5XCIsXCJpbmxpbmVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgJ3RyYW5zbGF0ZSgnICsgcHJval9wb3NbMF0gKyAnLCcgKyBwcm9qX3Bvc1sxXSArICcpJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc3R5bGUoXCJkaXNwbGF5XCIsXCJub25lXCIpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICk7XG5cbiAgICB2YXIgY291bnRyaWVzID0gdG9wb2pzb24uZmVhdHVyZSh3b3JsZCwgd29ybGQub2JqZWN0cy5jb3VudHJpZXMpLmZlYXR1cmVzO1xuICAgIGcuc2VsZWN0QWxsKCdnLmxhbmQnKVxuICAgICAgICAuZGF0YShjb3VudHJpZXMpXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdsYW5kJylcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKVxuICAgICAgICAuY2FsbChkMy5iZWhhdmlvci5kcmFnKClcbiAgICAgICAgICAgIC5vcmlnaW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIHIgPSBwcm9qLnJvdGF0ZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7eDogclswXSAvIHNlbnMsIHk6IC1yWzFdIC8gc2Vuc307IH0pXG4gICAgICAgICAgICAub24oJ2RyYWcnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh2QXV0b1JvdGF0ZSk7XG4gICAgICAgICAgICAgICAgdmFyIHJvdGF0ZSA9IHByb2oucm90YXRlKCk7XG4gICAgICAgICAgICAgICAgcHJvai5yb3RhdGUoW2QzLmV2ZW50LnggKiBzZW5zLCAtZDMuZXZlbnQueSAqIHNlbnMsIHJvdGF0ZVsyXV0pO1xuICAgICAgICAgICAgICAgIGcuc2VsZWN0QWxsKCcubGFuZCcpLmF0dHIoJ2QnLCBwYXRoKTtcblxuICAgICAgICAgICAgICAgIC8vIGZvciBlYWNoIG5vZGVcbiAgICAgICAgICAgICAgICBub2Rlcy5lYWNoKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGYgPSBkMy5zZWxlY3QodGhpcyksXG4gICAgICAgICAgICAgICAgICAgICAgICBsb25fbGF0ID0gW2QubG9uLCBkLmxhdF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9qX3BvcyA9IHByb2oobG9uX2xhdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgdG8gc2VlIGlmIGl0J3Mgc3RpbGwgdmlzaWJsZVxuICAgICAgICAgICAgICAgICAgICB2YXIgaGFzUGF0aCA9IHBhdGgoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiUG9pbnRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb29yZGluYXRlczogbG9uX2xhdFxuICAgICAgICAgICAgICAgICAgICAgICAgfSkgIT0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIGl0IGlzIHNob3cgaXQgYW5kIHVwZGF0ZSBwb3NpdGlvblxuICAgICAgICAgICAgICAgICAgICBpZiAoaGFzUGF0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zdHlsZShcImRpc3BsYXlcIixcImlubGluZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuYXR0cihcInRyYW5zZm9ybVwiLCAndHJhbnNsYXRlKCcgKyBwcm9qX3Bvc1swXSArICcsJyArIHByb2pfcG9zWzFdICsgJyknKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIG90aGVyd2lzZSBoaWRlIGl0XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zdHlsZShcImRpc3BsYXlcIixcIm5vbmVcIilcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgIHZhciBub2RlcyA9IGcuc2VsZWN0QWxsKCdnLm5vZGUnKVxuICAgICAgICAuZGF0YShsb2NhdGlvbnMpXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgJ25vZGUnKVxuICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgdmFyIHByb2pfcG9zID0gcHJvaihbZC5sb24sIGQubGF0XSk7XG4gICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgcHJval9wb3NbMF0gKyAnLCcgKyBwcm9qX3Bvc1sxXSArICcpJztcbiAgICAgICAgfSlcbiAgICAgICAgLmF0dHIoJ3N0eWxlJywgJ2N1cnNvcjogcG9pbnRlcicpXG4gICAgICAgIC5hdHRyKFwiZFwiLCBwYXRoKVxuICAgICAgICAuYXR0cignY2xhc3MnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICB2YXIgY2F0ZWdvcnkgPSBkLmNhdGVnb3J5LFxuICAgICAgICAgICAgICAgIGlucHV0Q2F0ZWdvcnksXG4gICAgICAgICAgICAgICAgbXlDbGFzcztcbiAgICAgICAgICAgIGQzLnNlbGVjdEFsbChcIi5maWx0ZXJfX2l0ZW0gaW5wdXRcIikuZWFjaChmdW5jdGlvbihkKXtcbiAgICAgICAgICAgICAgICBjYiA9IGQzLnNlbGVjdCh0aGlzKTtcbiAgICAgICAgICAgICAgICBpZihjYi5wcm9wZXJ0eShcImNoZWNrZWRcIikpe1xuICAgICAgICAgICAgICAgICAgICBpbnB1dENhdGVnb3J5ID0gY2IucHJvcGVydHkoXCJpZFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYoY2F0ZWdvcnkgPT0gaW5wdXRDYXRlZ29yeSkge1xuICAgICAgICAgICAgICAgIG15Q2xhc3MgPSAnbm9kZSBzaG93JztcbiAgICAgICAgICAgICAgICBpZihjYXRlZ29yeSA9PSA2KSB7XG4gICAgICAgICAgICAgICAgICAgIG15Q2xhc3MgKz0gJyBsaXZlJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG15Q2xhc3M7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAnbm9kZSBoaWRlJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdtb3VzZW92ZXInLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBpbmZvVG9vbHRpcC5odG1sKFwiPGltZyBzcmM9J2ltYWdlcy9hcGVyY3UvXCIrZC5pbWFnZStcIicgYWx0PScnIGNsYXNzPSdpbmZvVG9vbHRpcF9faW1nJz48ZGl2IGNsYXNzPSdpbmZvVG9vbHRpcF9fdGl0bGUnPlwiK2QubmFtZStcIjwvZGl2PlwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcImxlZnRcIiwgKGQzLmV2ZW50LnBhZ2VYICsgMjApICsgXCJweFwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcInRvcFwiLCAoZDMuZXZlbnQucGFnZVkgLSA1MCkgKyBcInB4XCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCAxKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgaW5mb1Rvb2x0aXAuc3R5bGUoXCJvcGFjaXR5XCIsIDApXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbihcIm1vdXNlbW92ZVwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBpbmZvVG9vbHRpcC5zdHlsZShcImxlZnRcIiwgKGQzLmV2ZW50LnBhZ2VYICsgMjApICsgXCJweFwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcInRvcFwiLCAoZDMuZXZlbnQucGFnZVkgLSA1MCkgKyBcInB4XCIpO1xuICAgICAgICB9KVxuICAgICAgICAub24oXCJjbGlja1wiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICB2YXIgbWFpblBhZ2UgPSBkMy5zZWxlY3QoXCIubWFpbi1wYWdlXCIpO1xuICAgICAgICAgICAgdmFyIG1vZGFsSW5mb19fdGl0bGUgPSBkMy5zZWxlY3QoXCJkaXYubW9kYWxJbmZvX19pbm5lcl9fdGl0bGVcIik7XG4gICAgICAgICAgICB2YXIgbW9kYWxJbmZvX192aWRlbyA9IGQzLnNlbGVjdChcImRpdi5tb2RhbEluZm9fX2lubmVyX192aWRlb1wiKTtcbiAgICAgICAgICAgIG1vZGFsSW5mb19fdGl0bGUuaHRtbChkLm5hbWUpO1xuICAgICAgICAgICAgbW9kYWxJbmZvX192aWRlby5odG1sKFwiPGlmcmFtZSB3aWR0aD0nNTYwJyBoZWlnaHQ9JzMxNScgc3JjPSdodHRwczovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC9cIitkLnRva2VuK1wiJyBmcmFtZWJvcmRlcj0nMCcgYWxsb3dmdWxsc2NyZWVuPjwvaWZyYW1lPlwiKTtcbiAgICAgICAgICAgIHByb2ouc2NhbGUoMTkwKTtcbiAgICAgICAgICAgIGQzLnNlbGVjdChcIi50aW1lbGluZVwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcIm9wYWNpdHlcIiwgXCIwXCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC01MCUsIDQwMCUpXCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwidHJhbnNpdGlvblwiLCBcImFsbCA4MDBtcyBlYXNlXCIpO1xuICAgICAgICAgICAgZDMuc2VsZWN0KFwiLmZpbHRlclwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcIm9wYWNpdHlcIiwgXCIwXCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC0xMDAlLCAtNTAlKVwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcInRyYW5zaXRpb25cIiwgXCJhbGwgODAwbXMgZWFzZVwiKTtcbiAgICAgICAgICAgIGQzLnNlbGVjdChcIi5kYXRhLXJpZ2h0XCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCBcIjBcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMTAwJSwgLTUwJSlcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJ0cmFuc2l0aW9uXCIsIFwiYWxsIDgwMG1zIGVhc2VcIik7XG4gICAgICAgICAgICBkMy5zZWxlY3QoXCIudG9vbGJhci1oZWFkZXJcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcbiAgICAgICAgICAgIGQzLnNlbGVjdChcIi5ob21lLW1hcFwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcImxlZnRcIiwgXCIwXCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwidHJhbnNpdGlvblwiLCBcImFsbCA4MDBtcyBlYXNlXCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwiei1pbmRleFwiLCBcIjk5OVwiKTtcbiAgICAgICAgICAgICQoJy5tb2RhbEluZm8nKS5kZWxheSgxMDAwKS5mYWRlSW4oKTtcbiAgICAgICAgfSk7XG5cbiAgICBpZigkKCcubm9kZScpLmhhc0NsYXNzKCdsaXZlJykpIHtcbiAgICAgICAgbm9kZXMuYXBwZW5kKFwic3ZnOmltYWdlXCIpXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgtNywgLTcpJylcbiAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIDcpXG4gICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgNylcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsJ21hcmtlcicpXG4gICAgICAgICAgICAuYXR0cihcImhyZWZcIixcIi4uL2ltYWdlcy9tYXJrZXItbGl2ZS5zdmdcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbm9kZXMuYXBwZW5kKFwic3ZnOmltYWdlXCIpXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgtNywgLTcpJylcbiAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIDcpXG4gICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgNylcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsJ21hcmtlcicpXG4gICAgICAgICAgICAuYXR0cihcImhyZWZcIixcIi4uL2ltYWdlcy9tYXJrZXIuc3ZnXCIpO1xuICAgIH1cblxuICAgIGQzLnNlbGVjdEFsbChcIi5maWx0ZXJfX2l0ZW0gaW5wdXRcIikub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24oZCl7XG4gICAgICAgIHZhciBzZWxlY3RlZCA9IHRoaXMuaWQsXG4gICAgICAgICAgICBvcGFjaXR5ID0gdGhpcy5jaGVja2VkID8gMSA6IDA7XG5cbiAgICAgICAgaWYoc2VsZWN0ZWQgPT0gNikge1xuICAgICAgICAgICAgbm9kZXNcbiAgICAgICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGVjdGVkID09IGQuY2F0ZWdvcnk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuc3R5bGUoJ29wYWNpdHknLCBvcGFjaXR5KVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJzdmc6aW1hZ2VcIilcbiAgICAgICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgtNywgLTcpJylcbiAgICAgICAgICAgICAgICAuYXR0cignd2lkdGgnLCA3KVxuICAgICAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCA3KVxuICAgICAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsJ21hcmtlcicpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJocmVmXCIsXCIuLi9pbWFnZXMvbWFya2VyLWxpdmUuc3ZnXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9kZXNcbiAgICAgICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGVjdGVkID09IGQuY2F0ZWdvcnk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuc3R5bGUoJ29wYWNpdHknLCBvcGFjaXR5KVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJzdmc6aW1hZ2VcIilcbiAgICAgICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgtNywgLTcpJylcbiAgICAgICAgICAgICAgICAuYXR0cignd2lkdGgnLCA3KVxuICAgICAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCA3KVxuICAgICAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsJ21hcmtlcicpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJocmVmXCIsXCIuLi9pbWFnZXMvbWFya2VyLnN2Z1wiKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gYmdzY3JvbGwoKSB7XG4gICAgICAgIGN1cnJlbnQgKz0gMTtcbiAgICAgICAgcHJvai5yb3RhdGUoW867KGN1cnJlbnQpLCAwXSk7XG4gICAgICAgIG1hcmtlclByb2oucm90YXRlKFvOuyhjdXJyZW50KSwgMF0pO1xuICAgICAgICBnLnNlbGVjdEFsbCgnLmxhbmQnKS5hdHRyKCdkJywgcGF0aCk7XG4gICAgICAgIG5vZGVzXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgIHZhciBwcm9qX3BvcyA9IHByb2ooW2QubG9uLCBkLmxhdF0pO1xuICAgICAgICAgICAgICAgIHJldHVybiAndHJhbnNsYXRlKCcgKyBwcm9qX3Bvc1swXSArICcsJyArIHByb2pfcG9zWzFdICsgJyknO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hdHRyKFwiZGlzcGxheVwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxvbl9sYXQgPSBbZC5sb24sIGQubGF0XSxcbiAgICAgICAgICAgICAgICAgICAgcHJval9wb3MgPSBwcm9qKGxvbl9sYXQpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGhhc1BhdGggPSBwYXRoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiUG9pbnRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvb3JkaW5hdGVzOiBsb25fbGF0XG4gICAgICAgICAgICAgICAgICAgIH0pICE9IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgIGlmIChoYXNQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcImlubGluZVwiO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgIH1cbiAgICB2YXIgdkF1dG9Sb3RhdGUgPSBzZXRJbnRlcnZhbChiZ3Njcm9sbCwgc2Nyb2xsU3BlZWQpO1xufVxuIiwiJCh3aW5kb3cpLm9uKCdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgJCgnLmxvYWRlcicpLmZhZGVPdXQoKTtcbn0pO1xuXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcbiAgICAkKCcuanNPcGVuU2VhcmNoJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICQoJy5zZWFyY2gnKS5mYWRlSW4oKTtcbiAgICB9KTtcbiAgICAkKCcuanNDbG9zZVNlYXJjaCcpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkKCcuc2VhcmNoJykuZmFkZU91dCgpO1xuICAgIH0pO1xuICAgICQoJy5tZWdhLXNlYXJjaF9faW5wdXQnKS5mb2N1cyhmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnLm1lZ2Etc2VhcmNoJykuYWRkQ2xhc3MoJ2ZvY3VzJyk7XG4gICAgfSkuYmx1cihmdW5jdGlvbiAoKSB7XG4gICAgICAgICQoJy5tZWdhLXNlYXJjaCcpLnJlbW92ZUNsYXNzKCdmb2N1cycpO1xuICAgIH0pO1xuXG4gICAgLy8gRGF0YSByaWdodC4uLlxuICAgIHZhciBuYlByb2cgPSB7XG4gICAgICAgIFwiMVwiIDogMzEwNCxcbiAgICAgICAgXCIyXCIgOiAyODU2LFxuICAgICAgICBcIjNcIjogMzY0NyxcbiAgICAgICAgXCI0XCI6IDE3OTYsXG4gICAgICAgIFwiNVwiOiAxMzI1LFxuICAgICAgICBcIjZcIjogNzY1LFxuICAgICAgICBcIjdcIjogMTU0NyxcbiAgICAgICAgXCI4XCI6IDQ3NjUsXG4gICAgICAgIFwiOVwiOiAzNjQ3LFxuICAgICAgICBcIjEwXCI6IDE3OTYsXG4gICAgICAgIFwiMTFcIjogMTMyNSxcbiAgICAgICAgXCIxMlwiOiA3NjUsXG4gICAgICAgIFwiMTNcIjogMTU0N1xuICAgIH07XG4gICAgdmFyIG5iRXhwbG8gPSB7XG4gICAgICAgIFwiMVwiIDogMjY1MTQsXG4gICAgICAgIFwiMlwiIDogMTkwODcsXG4gICAgICAgIFwiM1wiOiAyMjM1NyxcbiAgICAgICAgXCI0XCI6IDEyMzQ1LFxuICAgICAgICBcIjVcIjogMTQzNTYsXG4gICAgICAgIFwiNlwiOiAxODYzNCxcbiAgICAgICAgXCI3XCI6IDM0MDk3LFxuICAgICAgICBcIjhcIjogMzgzMjAsXG4gICAgICAgIFwiOVwiOiAxMjM0NSxcbiAgICAgICAgXCIxMFwiOiAxNDM1NixcbiAgICAgICAgXCIxMVwiOiAxODYzNCxcbiAgICAgICAgXCIxMlwiOiAzNDA5NyxcbiAgICAgICAgXCIxM1wiOiAzODMyMFxuICAgIH07XG5cbiAgICB2YXIgaW5kaWNlLFxuICAgICAgICB0b3RhbFByb2cgPSAwLFxuICAgICAgICB0b3RhbEV4cGxvID0gMCxcbiAgICAgICAgaW5wdXQgPSAkKFwiLmZpbHRlcl9faXRlbSBpbnB1dFwiKSxcbiAgICAgICAgaW5wdXRDaGVja2VkID0gW10sXG4gICAgICAgIGRhdGFQcm9nID0gJCgnLmRhdGEtcHJvZycpLFxuICAgICAgICBkYXRhRXhwbG8gPSAkKCcuZGF0YS1leHBsbycpO1xuXG4gICAgZGF0YVByb2cuaHRtbChuYlByb2dbNl0pO1xuICAgIGRhdGFFeHBsby5odG1sKG5iRXhwbG9bNl0pO1xuXG4gICAgdmFyIGlkID0gJCgnLmZpbHRlcl9faXRlbScpLmZpbmQoXCJpbnB1dDpjaGVja2VkXCIpLmF0dHIoJ2lkJyk7XG4gICAgaW5wdXRDaGVja2VkLnB1c2goaWQpO1xuICAgIC8vY29uc29sZS5sb2coaW5wdXRDaGVja2VkKTtcbiAgICB0b3RhbFByb2cgPSBuYlByb2dbaWRdO1xuICAgIHRvdGFsRXhwbG8gPSBuYkV4cGxvW2lkXTtcbiAgICAvL2NvbnNvbGUubG9nKFwidG90YWxQcm9nIDogXCIrdG90YWxQcm9nK1wiIC8vIHRvdGFsRXhwbG8gOiBcIit0b3RhbEV4cGxvKTtcblxuICAgIGlucHV0Lm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgaWYoJCh0aGlzKS5pcygnOmNoZWNrZWQnKSA9PSB0cnVlKSB7XG4gICAgICAgICAgICBpbnB1dENoZWNrZWQucHVzaCgkKHRoaXMpLmF0dHIoJ2lkJykpO1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhpbnB1dENoZWNrZWQpO1xuXG4gICAgICAgICAgICB0b3RhbFByb2cgKz0gbmJQcm9nWyQodGhpcykuYXR0cignaWQnKV07XG4gICAgICAgICAgICB0b3RhbEV4cGxvICs9IG5iRXhwbG9bJCh0aGlzKS5hdHRyKCdpZCcpXTtcblxuICAgICAgICAgICAgZGF0YVByb2cuaHRtbCh0b3RhbFByb2cpO1xuICAgICAgICAgICAgZGF0YUV4cGxvLmh0bWwodG90YWxFeHBsbyk7XG5cbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJ0b3RhbFByb2cgOiBcIit0b3RhbFByb2crXCIgLy8gdG90YWxFeHBsbyA6IFwiK3RvdGFsRXhwbG8pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW5kaWNlID0gaW5wdXRDaGVja2VkLmluZGV4T2YoJCh0aGlzKS5hdHRyKCdpZCcpKTtcbiAgICAgICAgICAgIGlucHV0Q2hlY2tlZC5zcGxpY2UoaW5kaWNlLCAxKTtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coaW5wdXRDaGVja2VkKTtcblxuICAgICAgICAgICAgdG90YWxQcm9nIC09IG5iUHJvZ1skKHRoaXMpLmF0dHIoJ2lkJyldO1xuICAgICAgICAgICAgdG90YWxFeHBsbyAtPSBuYkV4cGxvWyQodGhpcykuYXR0cignaWQnKV07XG5cbiAgICAgICAgICAgIGRhdGFQcm9nLmh0bWwodG90YWxQcm9nKTtcbiAgICAgICAgICAgIGRhdGFFeHBsby5odG1sKHRvdGFsRXhwbG8pO1xuXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwidG90YWxQcm9nIDogXCIrdG90YWxQcm9nK1wiIC8vIHRvdGFsRXhwbG8gOiBcIit0b3RhbEV4cGxvKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG59KTsiLCIkKHdpbmRvdykub24oXCJsb2FkXCIsZnVuY3Rpb24oKXtcbiAgICAkKFwiLmZpbHRlclwiKS5tQ3VzdG9tU2Nyb2xsYmFyKHtcbiAgICAgICAgYXhpczpcInlcIixcbiAgICAgICAgdGhlbWU6XCJsaWdodC0yXCJcbiAgICB9KTtcbn0pOyIsIi8vIEluaXRpYWxpc2F0aW9uIGRlcyB2YXJpYWJsZXMuLi5cbnZhciBkYXRlID0gbmV3IERhdGUsXG4gICAgaiA9IGRhdGUuZ2V0RGF0ZSgpLFxuICAgIGo3ID0gai03LFxuICAgIHRhYl9qb3VycyA9IG5ldyBBcnJheShcIkRcIiwgXCJMXCIsIFwiTVwiLCBcIk1cIiwgXCJKXCIsIFwiVlwiLCBcIlNcIiksXG4gICAgaW5kZXhfam91cnMgPSBbXSxcbiAgICB0YWJfaiA9IFtdLFxuICAgIHRhYl9kYXRlID0gW107XG5cbmZvcih2YXIgYT0wOyBhPDc7IGErKykge1xuICAgIGlmKGRhdGUuZ2V0RGF5KCktYSA+PSAwKSB7XG4gICAgICAgIGluZGV4X2pvdXJzLnB1c2goZGF0ZS5nZXREYXkoKS1hKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpbmRleF9qb3Vycy5wdXNoKGRhdGUuZ2V0RGF5KCkrNy1hKTtcbiAgICB9XG59XG5cbmZvciAodmFyIGk9ajsgaT49ajc7IGktLSkge1xuICAgIHRhYl9qLnB1c2goaSk7XG59XG5cbmZvcih2YXIgYj0wOyBiPDc7IGIrKykge1xuICAgIHZhciBkYXRlX2NvbXBsZXRlID0gdGFiX2pvdXJzW2luZGV4X2pvdXJzW2JdXStcIiBcIit0YWJfaltiXTtcbiAgICB0YWJfZGF0ZS5wdXNoKGRhdGVfY29tcGxldGUpO1xufVxuXG4kKFwiI3RpbWVsaW5lLWN1c3RvbVwiKS5pb25SYW5nZVNsaWRlcih7XG4gICAgdHlwZTogXCJzaW5nbGVcIixcbiAgICB2YWx1ZXM6IFt0YWJfZGF0ZVs2XSwgdGFiX2RhdGVbNV0sIHRhYl9kYXRlWzRdLCB0YWJfZGF0ZVszXSwgdGFiX2RhdGVbMl0sIHRhYl9kYXRlWzFdLCB0YWJfZGF0ZVswXV0sXG4gICAgZ3JpZDogdHJ1ZSxcbiAgICBmcm9tOiA2LFxuICAgIGhpZGVfbWluX21heDogdHJ1ZVxufSk7IiwiLy8gJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XG4vLyAgICAgJChmdW5jdGlvbigpe1xuLy8gICAgICAgICAkKFwiLmVsZW1lbnQtdHlwZWRcIikudHlwZWQoe1xuLy8gICAgICAgICAgICAgc3RyaW5nczogW1wiXCJdLFxuLy8gICAgICAgICAgICAgc3RyaW5nc0VsZW1lbnQ6IG51bGwsXG4vLyAgICAgICAgICAgICB0eXBlU3BlZWQ6IDAsXG4vLyAgICAgICAgICAgICBzdGFydERlbGF5OiAwLFxuLy8gICAgICAgICAgICAgYmFja1NwZWVkOiAwLFxuLy8gICAgICAgICAgICAgc2h1ZmZsZTogZmFsc2UsXG4vLyAgICAgICAgICAgICBiYWNrRGVsYXk6IDUwMCxcbi8vICAgICAgICAgICAgIGZhZGVPdXQ6IGZhbHNlLFxuLy8gICAgICAgICAgICAgZmFkZU91dENsYXNzOiAndHlwZWQtZmFkZS1vdXQnLFxuLy8gICAgICAgICAgICAgZmFkZU91dERlbGF5OiA1MDAsIC8vIG1pbGxpc2Vjb25kc1xuLy8gICAgICAgICAgICAgbG9vcDogZmFsc2UsXG4vLyAgICAgICAgICAgICBsb29wQ291bnQ6IG51bGwsXG4vLyAgICAgICAgICAgICBzaG93Q3Vyc29yOiB0cnVlLFxuLy8gICAgICAgICAgICAgY3Vyc29yQ2hhcjogXCJ8XCIsXG4vLyAgICAgICAgICAgICBhdHRyOiBudWxsLFxuLy8gICAgICAgICAgICAgY29udGVudFR5cGU6ICdodG1sJ1xuLy8gICAgICAgICB9KTtcbi8vICAgICB9KTtcbi8vIH0pOyJdfQ==
