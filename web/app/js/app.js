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
        timer1,
        timer2,
        totalProg = 0,
        totalExplo = 0,
        input = $(".filter__item input"),
        inputChecked = [],
        dataProg = $('.data-prog'),
        dataExplo = $('.data-explo'),
        newProg_text = "",
        newExplo_text = "",
        totalProg_text = "",
        totalExplo_text = "",
        totalProg_length = 0,
        totalExplo_length = 0,
        i = 0,
        j = 0;

    dataProg.html(nbProg[6]);
    dataExplo.html(nbExplo[6]);

    var id = $('.filter__item').find("input:checked").attr('id');
    inputChecked.push(id);
    //console.log(inputChecked);
    totalProg = nbProg[id];
    totalExplo = nbExplo[id];
    //console.log("totalProg : "+totalProg+" // totalExplo : "+totalExplo);

    function typed(text1, text2) {
        totalProg_text = text1.toString();
        totalExplo_text = text2.toString();

        totalProg_length = totalProg_text.length;
        totalExplo_length = totalExplo_text.length;

        dataProg.text('');
        dataExplo.text('');
        newProg_text = '';
        newExplo_text = '';
        i = 0;
        j = 0;

        timer1 = setInterval(function(){
            newProg_text += totalProg_text[i];
            dataProg.text(newProg_text);
            if(i < totalProg_length-1) { i++; } else { clearInterval(timer1); }
        }, 50);

        timer2 = setInterval(function(){
            newExplo_text += totalExplo_text[j];
            dataExplo.text(newExplo_text);
            if(j < totalExplo_length-1) { j++; } else { clearInterval(timer2); }
        }, 50);
    }

    input.on("change", function(){

        if($(this).is(':checked') == true) {
            inputChecked.push($(this).attr('id'));

            totalProg += nbProg[$(this).attr('id')];
            totalExplo += nbExplo[$(this).attr('id')];

            typed(totalProg, totalExplo);
        } else {
            indice = inputChecked.indexOf($(this).attr('id'));
            inputChecked.splice(indice, 1);

            totalProg -= nbProg[$(this).attr('id')];
            totalExplo -= nbExplo[$(this).attr('id')];

            typed(totalProg, totalExplo);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImludGVyYWN0aW9ucy5qcyIsInNjcm9sbGJhci5qcyIsInRpbWVsaW5lLmpzIiwidHlwZWQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOVZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiAtLS0tIFNldHRpbmdzIC0tLS0tXG4gKi9cblxuLy9Jbml0XG52YXIgd2lkdGggPSAxMDAwLFxuICAgIGhlaWdodCA9IDYwMCxcbiAgICBzZW5zID0gMC4yNSxcbiAgICBzY2FsZSA9IDEzMCxcbiAgICBtYXJnaW4gPSB7dG9wOiAwLCByaWdodDogMCwgYm90dG9tOiAwLCBsZWZ0OiAwfTtcblxuLy9TZXR0aW5nIHByb2plY3Rpb25cbnZhciBwcm9qID0gZDMuZ2VvLm9ydGhvZ3JhcGhpYygpXG4gICAgLy8uc2NhbGUoMTkwKVxuICAgIC5zY2FsZSgxOTApXG4gICAgLnJvdGF0ZShbMCwgMF0pXG4gICAgLnRyYW5zbGF0ZShbd2lkdGggLyAyLCBoZWlnaHQgLyAyXSlcbiAgICAuY2xpcEFuZ2xlKDkwKTtcblxudmFyIG1hcmtlclByb2ogPSBkMy5nZW8ub3J0aG9ncmFwaGljKClcbiAgICAuc2NhbGUoMTkwKVxuICAgIC5yb3RhdGUoWzAsIDBdKVxuICAgIC50cmFuc2xhdGUoW3dpZHRoIC8gMiwgaGVpZ2h0IC8gMl0pXG4gICAgLmNsaXBBbmdsZSg5MCk7XG5cbnZhciBwYXRoID0gZDMuZ2VvLnBhdGgoKS5wcm9qZWN0aW9uKHByb2opLnBvaW50UmFkaXVzKGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gNlxufSk7XG5cbi8vWm9vbVxudmFyIHpvb20gPSBkMy5iZWhhdmlvci56b29tKClcbiAgICAuc2NhbGVFeHRlbnQoWzEsIDJdKVxuICAgIC5vbihcInpvb21cIiwgem9vbWVkKTtcblxuLy9TVkcgY29udGFpbmVyXG52YXIgc3ZnID0gZDMuc2VsZWN0KFwiYm9keSAuaG9tZS1tYXBcIikuYXBwZW5kKFwic3ZnXCIpXG4gICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aClcbiAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcIm1hcFwiKTtcblxudmFyIGcgPSBzdmcuYXBwZW5kKFwiZ1wiKS5jYWxsKHpvb20pXG4gICAgLm9uKFwibW91c2Vkb3duLnpvb21cIiwgbnVsbClcbiAgICAub24oXCJ0b3VjaHN0YXJ0Lnpvb21cIiwgbnVsbClcbiAgICAub24oXCJ0b3VjaG1vdmUuem9vbVwiLCBudWxsKVxuICAgIC5vbihcInRvdWNoZW5kLnpvb21cIiwgbnVsbCk7XG5cbi8vQWRkIGdyYWRpZW50IG9uIHdhdGVyXG52YXIgZGVmcyA9IHN2Zy5hcHBlbmQoXCJkZWZzXCIpO1xudmFyIGdyYWRpZW50ID0gZGVmcy5hcHBlbmQoXCJsaW5lYXJHcmFkaWVudFwiKVxuICAgIC5hdHRyKFwiaWRcIiwgXCJncmFkaWVudFwiKVxuICAgIC5hdHRyKFwieDFcIixcIjBcIilcbiAgICAuYXR0cihcIngyXCIsXCIxXCIpXG4gICAgLmF0dHIoXCJ5MVwiLFwiMFwiKVxuICAgIC5hdHRyKFwieTJcIixcIjFcIik7XG5ncmFkaWVudC5hcHBlbmQoXCJzdG9wXCIpXG4gICAgLmF0dHIoXCJvZmZzZXRcIiwgXCIwJVwiKVxuICAgIC5hdHRyKFwic3RvcC1jb2xvclwiLCBcIiMwMDBcIilcbiAgICAuYXR0cihcInN0b3Atb3BhY2l0eVwiLCBcIjAuMTZcIik7XG5ncmFkaWVudC5hcHBlbmQoXCJzdG9wXCIpXG4gICAgLmF0dHIoXCJvZmZzZXRcIiwgXCIxMDAlXCIpXG4gICAgLmF0dHIoXCJzdG9wLWNvbG9yXCIsIFwiI0ZGRlwiKVxuICAgIC5hdHRyKFwic3RvcC1vcGFjaXR5XCIsIFwiMC4xNlwiKTtcblxudmFyIGluZm9Ub29sdGlwID0gZDMuc2VsZWN0KFwiYm9keVwiKS5hcHBlbmQoXCJkaXZcIikuYXR0cihcImNsYXNzXCIsIFwiaW5mb1Rvb2x0aXBcIik7XG52YXIgbW9kYWxJbmZvID0gZDMuc2VsZWN0KFwiZGl2Lm1vZGFsSW5mb1wiKTtcblxudmFyIHNjcm9sbFNwZWVkID0gNTA7XG52YXIgY3VycmVudCA9IDA7XG52YXIgzrsgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgIC5kb21haW4oWzAsIHdpZHRoXSlcbiAgICAucmFuZ2UoWy0xODAsIDE4MF0pO1xuXG5xdWV1ZSgpXG4gICAgLmRlZmVyKGQzLmpzb24sIFwiLi4vZGF0YS93b3JsZC0xMTBtLmpzb25cIilcbiAgICAuZGVmZXIoZDMuanNvbiwgXCIuLi9kYXRhL21hcmtlci5qc29uXCIpXG4gICAgLmRlZmVyKGQzLnRzdiwgXCIuLi9kYXRhL2ZpbHRlci1uYW1lcy50c3ZcIilcbiAgICAuYXdhaXQocmVhZHkpO1xuXG5cbi8qXG4gKiAtLS0tIEZ1bmN0aW9ucyAtLS0tLVxuICovXG5cbi8vWm9vbSBmdW5jdGlvblxuZnVuY3Rpb24gem9vbWVkKCkge1xuICAgIGcuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIGQzLmV2ZW50LnRyYW5zbGF0ZSArIFwiKXNjYWxlKFwiICsgZDMuZXZlbnQuc2NhbGUgKyBcIilcIik7XG59XG5cbi8vTWFpbiBmdW5jdGlvblxuZnVuY3Rpb24gcmVhZHkoZXJyb3IsIHdvcmxkLCBsb2NhdGlvbnMsIGZpbHRlcnMpIHtcblxuXG4gICAgJCgnLm1vZGFsSW5mbycpLm9uKCdjbGljaycsICcuanNDbG9zZU1vZGFsSW5mbycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkKHRoaXMpLnBhcmVudCgnLm1vZGFsSW5mbycpLmZhZGVPdXQoKTtcbiAgICAgICAgJCgnLmhvbWUtbWFwJykuY3NzKHtcbiAgICAgICAgICAgIGxlZnQ6IFwiNTAlXCIsXG4gICAgICAgICAgICB0cmFuc2l0aW9uOiBcImFsbCA4MDBtcyA4MDBtcyBlYXNlXCIsXG4gICAgICAgICAgICB6SW5kZXg6IDlcbiAgICAgICAgfSk7XG4gICAgICAgICQoJy50aW1lbGluZScpLmNzcyh7XG4gICAgICAgICAgICB0cmFuc2Zvcm06IFwidHJhbnNsYXRlKC01MCUsIDAlKVwiLFxuICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgIHRyYW5zaXRpb246IFwiYWxsIDgwMG1zIDgwMG1zIGVhc2VcIlxuICAgICAgICB9KTtcbiAgICAgICAgJCgnLmZpbHRlcicpLmNzcyh7XG4gICAgICAgICAgICB0cmFuc2Zvcm06IFwidHJhbnNsYXRlKDAsIC01MCUpXCIsXG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNpdGlvbjogXCJhbGwgODAwbXMgODAwbXMgZWFzZVwiXG4gICAgICAgIH0pO1xuICAgICAgICAkKCcuZGF0YS1yaWdodCcpLmNzcyh7XG4gICAgICAgICAgICB0cmFuc2Zvcm06IFwidHJhbnNsYXRlKDAsIC01MCUpXCIsXG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNpdGlvbjogXCJhbGwgODAwbXMgODAwbXMgZWFzZVwiXG4gICAgICAgIH0pO1xuICAgICAgICAkKCcudG9vbGJhci1oZWFkZXInKS5jc3Moe1xuICAgICAgICAgICAgZGlzcGxheTogXCJibG9ja1wiXG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgICQoJy5qc1BsYXlSb3RhdGVHbG9iZScpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICBzZXRJbnRlcnZhbChiZ3Njcm9sbCwgc2Nyb2xsU3BlZWQpO1xuICAgIH0pO1xuXG4gICAgLy9BZGRpbmcgd2F0ZXJcbiAgICB2YXIgd2F0ZXIgPSBnLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5kYXR1bSh7dHlwZTogJ1NwaGVyZSd9KVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnd2F0ZXInKVxuICAgICAgICAuYXR0cignZCcsIHBhdGgpXG4gICAgICAgIC5jYWxsKGQzLmJlaGF2aW9yLmRyYWcoKVxuICAgICAgICAgICAgLm9yaWdpbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgciA9IHByb2oucm90YXRlKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHt4OiByWzBdIC8gc2VucywgeTogLXJbMV0gLyBzZW5zfTsgfSlcbiAgICAgICAgICAgIC5vbignZHJhZycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHZBdXRvUm90YXRlKTtcbiAgICAgICAgICAgICAgICB2YXIgcm90YXRlID0gcHJvai5yb3RhdGUoKTtcbiAgICAgICAgICAgICAgICBwcm9qLnJvdGF0ZShbZDMuZXZlbnQueCAqIHNlbnMsIC1kMy5ldmVudC55ICogc2Vucywgcm90YXRlWzJdXSk7XG4gICAgICAgICAgICAgICAgZy5zZWxlY3RBbGwoJy5sYW5kJykuYXR0cignZCcsIHBhdGgpO1xuXG4gICAgICAgICAgICAgICAgLy8gZm9yIGVhY2ggbm9kZVxuICAgICAgICAgICAgICAgIG5vZGVzLmVhY2goZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IGQzLnNlbGVjdCh0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvbl9sYXQgPSBbZC5sb24sIGQubGF0XSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2pfcG9zID0gcHJvaihsb25fbGF0KTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgaGFzUGF0aCA9IHBhdGgoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiUG9pbnRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb29yZGluYXRlczogbG9uX2xhdFxuICAgICAgICAgICAgICAgICAgICAgICAgfSkgIT0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChoYXNQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnN0eWxlKFwiZGlzcGxheVwiLFwiaW5saW5lXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5hdHRyKFwidHJhbnNmb3JtXCIsICd0cmFuc2xhdGUoJyArIHByb2pfcG9zWzBdICsgJywnICsgcHJval9wb3NbMV0gKyAnKScpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnN0eWxlKFwiZGlzcGxheVwiLFwibm9uZVwiKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICApO1xuXG4gICAgdmFyIGNvdW50cmllcyA9IHRvcG9qc29uLmZlYXR1cmUod29ybGQsIHdvcmxkLm9iamVjdHMuY291bnRyaWVzKS5mZWF0dXJlcztcbiAgICBnLnNlbGVjdEFsbCgnZy5sYW5kJylcbiAgICAgICAgLmRhdGEoY291bnRyaWVzKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnbGFuZCcpXG4gICAgICAgIC5hdHRyKCdkJywgcGF0aClcbiAgICAgICAgLmNhbGwoZDMuYmVoYXZpb3IuZHJhZygpXG4gICAgICAgICAgICAub3JpZ2luKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciByID0gcHJvai5yb3RhdGUoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge3g6IHJbMF0gLyBzZW5zLCB5OiAtclsxXSAvIHNlbnN9OyB9KVxuICAgICAgICAgICAgLm9uKCdkcmFnJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodkF1dG9Sb3RhdGUpO1xuICAgICAgICAgICAgICAgIHZhciByb3RhdGUgPSBwcm9qLnJvdGF0ZSgpO1xuICAgICAgICAgICAgICAgIHByb2oucm90YXRlKFtkMy5ldmVudC54ICogc2VucywgLWQzLmV2ZW50LnkgKiBzZW5zLCByb3RhdGVbMl1dKTtcbiAgICAgICAgICAgICAgICBnLnNlbGVjdEFsbCgnLmxhbmQnKS5hdHRyKCdkJywgcGF0aCk7XG5cbiAgICAgICAgICAgICAgICAvLyBmb3IgZWFjaCBub2RlXG4gICAgICAgICAgICAgICAgbm9kZXMuZWFjaChmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxmID0gZDMuc2VsZWN0KHRoaXMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgbG9uX2xhdCA9IFtkLmxvbiwgZC5sYXRdLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJval9wb3MgPSBwcm9qKGxvbl9sYXQpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIHRvIHNlZSBpZiBpdCdzIHN0aWxsIHZpc2libGVcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhhc1BhdGggPSBwYXRoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlBvaW50XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29vcmRpbmF0ZXM6IGxvbl9sYXRcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pICE9IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgICAgICAvLyBpZiBpdCBpcyBzaG93IGl0IGFuZCB1cGRhdGUgcG9zaXRpb25cbiAgICAgICAgICAgICAgICAgICAgaWYgKGhhc1BhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc3R5bGUoXCJkaXNwbGF5XCIsXCJpbmxpbmVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgJ3RyYW5zbGF0ZSgnICsgcHJval9wb3NbMF0gKyAnLCcgKyBwcm9qX3Bvc1sxXSArICcpJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBvdGhlcndpc2UgaGlkZSBpdFxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc3R5bGUoXCJkaXNwbGF5XCIsXCJub25lXCIpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICk7XG5cbiAgICB2YXIgbm9kZXMgPSBnLnNlbGVjdEFsbCgnZy5ub2RlJylcbiAgICAgICAgLmRhdGEobG9jYXRpb25zKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoJ2cnKS5hdHRyKCdjbGFzcycsICdub2RlJylcbiAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIHZhciBwcm9qX3BvcyA9IHByb2ooW2QubG9uLCBkLmxhdF0pO1xuICAgICAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoJyArIHByb2pfcG9zWzBdICsgJywnICsgcHJval9wb3NbMV0gKyAnKSc7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKCdzdHlsZScsICdjdXJzb3I6IHBvaW50ZXInKVxuICAgICAgICAuYXR0cihcImRcIiwgcGF0aClcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgdmFyIGNhdGVnb3J5ID0gZC5jYXRlZ29yeSxcbiAgICAgICAgICAgICAgICBpbnB1dENhdGVnb3J5LFxuICAgICAgICAgICAgICAgIG15Q2xhc3M7XG4gICAgICAgICAgICBkMy5zZWxlY3RBbGwoXCIuZmlsdGVyX19pdGVtIGlucHV0XCIpLmVhY2goZnVuY3Rpb24oZCl7XG4gICAgICAgICAgICAgICAgY2IgPSBkMy5zZWxlY3QodGhpcyk7XG4gICAgICAgICAgICAgICAgaWYoY2IucHJvcGVydHkoXCJjaGVja2VkXCIpKXtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXRDYXRlZ29yeSA9IGNiLnByb3BlcnR5KFwiaWRcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmKGNhdGVnb3J5ID09IGlucHV0Q2F0ZWdvcnkpIHtcbiAgICAgICAgICAgICAgICBteUNsYXNzID0gJ25vZGUgc2hvdyc7XG4gICAgICAgICAgICAgICAgaWYoY2F0ZWdvcnkgPT0gNikge1xuICAgICAgICAgICAgICAgICAgICBteUNsYXNzICs9ICcgbGl2ZSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBteUNsYXNzO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ25vZGUgaGlkZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignbW91c2VvdmVyJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgaW5mb1Rvb2x0aXAuaHRtbChcIjxpbWcgc3JjPSdpbWFnZXMvYXBlcmN1L1wiK2QuaW1hZ2UrXCInIGFsdD0nJyBjbGFzcz0naW5mb1Rvb2x0aXBfX2ltZyc+PGRpdiBjbGFzcz0naW5mb1Rvb2x0aXBfX3RpdGxlJz5cIitkLm5hbWUrXCI8L2Rpdj5cIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJsZWZ0XCIsIChkMy5ldmVudC5wYWdlWCArIDIwKSArIFwicHhcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJ0b3BcIiwgKGQzLmV2ZW50LnBhZ2VZIC0gNTApICsgXCJweFwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcImRpc3BsYXlcIiwgXCJibG9ja1wiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcIm9wYWNpdHlcIiwgMSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIGluZm9Ub29sdGlwLnN0eWxlKFwib3BhY2l0eVwiLCAwKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuICAgICAgICB9KVxuICAgICAgICAub24oXCJtb3VzZW1vdmVcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgaW5mb1Rvb2x0aXAuc3R5bGUoXCJsZWZ0XCIsIChkMy5ldmVudC5wYWdlWCArIDIwKSArIFwicHhcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJ0b3BcIiwgKGQzLmV2ZW50LnBhZ2VZIC0gNTApICsgXCJweFwiKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgdmFyIG1haW5QYWdlID0gZDMuc2VsZWN0KFwiLm1haW4tcGFnZVwiKTtcbiAgICAgICAgICAgIHZhciBtb2RhbEluZm9fX3RpdGxlID0gZDMuc2VsZWN0KFwiZGl2Lm1vZGFsSW5mb19faW5uZXJfX3RpdGxlXCIpO1xuICAgICAgICAgICAgdmFyIG1vZGFsSW5mb19fdmlkZW8gPSBkMy5zZWxlY3QoXCJkaXYubW9kYWxJbmZvX19pbm5lcl9fdmlkZW9cIik7XG4gICAgICAgICAgICBtb2RhbEluZm9fX3RpdGxlLmh0bWwoZC5uYW1lKTtcbiAgICAgICAgICAgIG1vZGFsSW5mb19fdmlkZW8uaHRtbChcIjxpZnJhbWUgd2lkdGg9JzU2MCcgaGVpZ2h0PSczMTUnIHNyYz0naHR0cHM6Ly93d3cueW91dHViZS5jb20vZW1iZWQvXCIrZC50b2tlbitcIicgZnJhbWVib3JkZXI9JzAnIGFsbG93ZnVsbHNjcmVlbj48L2lmcmFtZT5cIik7XG4gICAgICAgICAgICBwcm9qLnNjYWxlKDE5MCk7XG4gICAgICAgICAgICBkMy5zZWxlY3QoXCIudGltZWxpbmVcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJvcGFjaXR5XCIsIFwiMFwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgtNTAlLCA0MDAlKVwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcInRyYW5zaXRpb25cIiwgXCJhbGwgODAwbXMgZWFzZVwiKTtcbiAgICAgICAgICAgIGQzLnNlbGVjdChcIi5maWx0ZXJcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJvcGFjaXR5XCIsIFwiMFwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgtMTAwJSwgLTUwJSlcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJ0cmFuc2l0aW9uXCIsIFwiYWxsIDgwMG1zIGVhc2VcIik7XG4gICAgICAgICAgICBkMy5zZWxlY3QoXCIuZGF0YS1yaWdodFwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcIm9wYWNpdHlcIiwgXCIwXCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDEwMCUsIC01MCUpXCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwidHJhbnNpdGlvblwiLCBcImFsbCA4MDBtcyBlYXNlXCIpO1xuICAgICAgICAgICAgZDMuc2VsZWN0KFwiLnRvb2xiYXItaGVhZGVyXCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gICAgICAgICAgICBkMy5zZWxlY3QoXCIuaG9tZS1tYXBcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJsZWZ0XCIsIFwiMFwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcInRyYW5zaXRpb25cIiwgXCJhbGwgODAwbXMgZWFzZVwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcInotaW5kZXhcIiwgXCI5OTlcIik7XG4gICAgICAgICAgICAkKCcubW9kYWxJbmZvJykuZGVsYXkoMTAwMCkuZmFkZUluKCk7XG4gICAgICAgIH0pO1xuXG4gICAgaWYoJCgnLm5vZGUnKS5oYXNDbGFzcygnbGl2ZScpKSB7XG4gICAgICAgIG5vZGVzLmFwcGVuZChcInN2ZzppbWFnZVwiKVxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoLTcsIC03KScpXG4gICAgICAgICAgICAuYXR0cignd2lkdGgnLCA3KVxuICAgICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIDcpXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCdtYXJrZXInKVxuICAgICAgICAgICAgLmF0dHIoXCJocmVmXCIsXCIuLi9pbWFnZXMvbWFya2VyLWxpdmUuc3ZnXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG5vZGVzLmFwcGVuZChcInN2ZzppbWFnZVwiKVxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoLTcsIC03KScpXG4gICAgICAgICAgICAuYXR0cignd2lkdGgnLCA3KVxuICAgICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIDcpXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCdtYXJrZXInKVxuICAgICAgICAgICAgLmF0dHIoXCJocmVmXCIsXCIuLi9pbWFnZXMvbWFya2VyLnN2Z1wiKTtcbiAgICB9XG5cbiAgICBkMy5zZWxlY3RBbGwoXCIuZmlsdGVyX19pdGVtIGlucHV0XCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uKGQpe1xuICAgICAgICB2YXIgc2VsZWN0ZWQgPSB0aGlzLmlkLFxuICAgICAgICAgICAgb3BhY2l0eSA9IHRoaXMuY2hlY2tlZCA/IDEgOiAwO1xuXG4gICAgICAgIGlmKHNlbGVjdGVkID09IDYpIHtcbiAgICAgICAgICAgIG5vZGVzXG4gICAgICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxlY3RlZCA9PSBkLmNhdGVnb3J5O1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnN0eWxlKCdvcGFjaXR5Jywgb3BhY2l0eSlcbiAgICAgICAgICAgICAgICAuYXBwZW5kKFwic3ZnOmltYWdlXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoLTcsIC03KScpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgNylcbiAgICAgICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgNylcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCdtYXJrZXInKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiaHJlZlwiLFwiLi4vaW1hZ2VzL21hcmtlci1saXZlLnN2Z1wiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5vZGVzXG4gICAgICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxlY3RlZCA9PSBkLmNhdGVnb3J5O1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnN0eWxlKCdvcGFjaXR5Jywgb3BhY2l0eSlcbiAgICAgICAgICAgICAgICAuYXBwZW5kKFwic3ZnOmltYWdlXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoLTcsIC03KScpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgNylcbiAgICAgICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgNylcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCdtYXJrZXInKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiaHJlZlwiLFwiLi4vaW1hZ2VzL21hcmtlci5zdmdcIik7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIGJnc2Nyb2xsKCkge1xuICAgICAgICBjdXJyZW50ICs9IDE7XG4gICAgICAgIHByb2oucm90YXRlKFvOuyhjdXJyZW50KSwgMF0pO1xuICAgICAgICBtYXJrZXJQcm9qLnJvdGF0ZShbzrsoY3VycmVudCksIDBdKTtcbiAgICAgICAgZy5zZWxlY3RBbGwoJy5sYW5kJykuYXR0cignZCcsIHBhdGgpO1xuICAgICAgICBub2Rlc1xuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICB2YXIgcHJval9wb3MgPSBwcm9qKFtkLmxvbiwgZC5sYXRdKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgcHJval9wb3NbMF0gKyAnLCcgKyBwcm9qX3Bvc1sxXSArICcpJztcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuYXR0cihcImRpc3BsYXlcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgIHZhciBsb25fbGF0ID0gW2QubG9uLCBkLmxhdF0sXG4gICAgICAgICAgICAgICAgICAgIHByb2pfcG9zID0gcHJvaihsb25fbGF0KTtcblxuICAgICAgICAgICAgICAgIHZhciBoYXNQYXRoID0gcGF0aCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlBvaW50XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb29yZGluYXRlczogbG9uX2xhdFxuICAgICAgICAgICAgICAgICAgICB9KSAhPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgICAgICBpZiAoaGFzUGF0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJpbmxpbmVcIjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICB9XG4gICAgdmFyIHZBdXRvUm90YXRlID0gc2V0SW50ZXJ2YWwoYmdzY3JvbGwsIHNjcm9sbFNwZWVkKTtcbn1cbiIsIiQod2luZG93KS5vbignbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICQoJy5sb2FkZXInKS5mYWRlT3V0KCk7XG59KTtcblxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgJCgnLmpzT3BlblNlYXJjaCcpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkKCcuc2VhcmNoJykuZmFkZUluKCk7XG4gICAgfSk7XG4gICAgJCgnLmpzQ2xvc2VTZWFyY2gnKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnLnNlYXJjaCcpLmZhZGVPdXQoKTtcbiAgICB9KTtcbiAgICAkKCcubWVnYS1zZWFyY2hfX2lucHV0JykuZm9jdXMoZnVuY3Rpb24oKSB7XG4gICAgICAgICQoJy5tZWdhLXNlYXJjaCcpLmFkZENsYXNzKCdmb2N1cycpO1xuICAgIH0pLmJsdXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAkKCcubWVnYS1zZWFyY2gnKS5yZW1vdmVDbGFzcygnZm9jdXMnKTtcbiAgICB9KTtcblxuICAgIC8vIERhdGEgcmlnaHQuLi5cbiAgICB2YXIgbmJQcm9nID0ge1xuICAgICAgICBcIjFcIiA6IDMxMDQsXG4gICAgICAgIFwiMlwiIDogMjg1NixcbiAgICAgICAgXCIzXCI6IDM2NDcsXG4gICAgICAgIFwiNFwiOiAxNzk2LFxuICAgICAgICBcIjVcIjogMTMyNSxcbiAgICAgICAgXCI2XCI6IDc2NSxcbiAgICAgICAgXCI3XCI6IDE1NDcsXG4gICAgICAgIFwiOFwiOiA0NzY1LFxuICAgICAgICBcIjlcIjogMzY0NyxcbiAgICAgICAgXCIxMFwiOiAxNzk2LFxuICAgICAgICBcIjExXCI6IDEzMjUsXG4gICAgICAgIFwiMTJcIjogNzY1LFxuICAgICAgICBcIjEzXCI6IDE1NDdcbiAgICB9O1xuICAgIHZhciBuYkV4cGxvID0ge1xuICAgICAgICBcIjFcIiA6IDI2NTE0LFxuICAgICAgICBcIjJcIiA6IDE5MDg3LFxuICAgICAgICBcIjNcIjogMjIzNTcsXG4gICAgICAgIFwiNFwiOiAxMjM0NSxcbiAgICAgICAgXCI1XCI6IDE0MzU2LFxuICAgICAgICBcIjZcIjogMTg2MzQsXG4gICAgICAgIFwiN1wiOiAzNDA5NyxcbiAgICAgICAgXCI4XCI6IDM4MzIwLFxuICAgICAgICBcIjlcIjogMTIzNDUsXG4gICAgICAgIFwiMTBcIjogMTQzNTYsXG4gICAgICAgIFwiMTFcIjogMTg2MzQsXG4gICAgICAgIFwiMTJcIjogMzQwOTcsXG4gICAgICAgIFwiMTNcIjogMzgzMjBcbiAgICB9O1xuXG4gICAgdmFyIGluZGljZSxcbiAgICAgICAgdGltZXIxLFxuICAgICAgICB0aW1lcjIsXG4gICAgICAgIHRvdGFsUHJvZyA9IDAsXG4gICAgICAgIHRvdGFsRXhwbG8gPSAwLFxuICAgICAgICBpbnB1dCA9ICQoXCIuZmlsdGVyX19pdGVtIGlucHV0XCIpLFxuICAgICAgICBpbnB1dENoZWNrZWQgPSBbXSxcbiAgICAgICAgZGF0YVByb2cgPSAkKCcuZGF0YS1wcm9nJyksXG4gICAgICAgIGRhdGFFeHBsbyA9ICQoJy5kYXRhLWV4cGxvJyksXG4gICAgICAgIG5ld1Byb2dfdGV4dCA9IFwiXCIsXG4gICAgICAgIG5ld0V4cGxvX3RleHQgPSBcIlwiLFxuICAgICAgICB0b3RhbFByb2dfdGV4dCA9IFwiXCIsXG4gICAgICAgIHRvdGFsRXhwbG9fdGV4dCA9IFwiXCIsXG4gICAgICAgIHRvdGFsUHJvZ19sZW5ndGggPSAwLFxuICAgICAgICB0b3RhbEV4cGxvX2xlbmd0aCA9IDAsXG4gICAgICAgIGkgPSAwLFxuICAgICAgICBqID0gMDtcblxuICAgIGRhdGFQcm9nLmh0bWwobmJQcm9nWzZdKTtcbiAgICBkYXRhRXhwbG8uaHRtbChuYkV4cGxvWzZdKTtcblxuICAgIHZhciBpZCA9ICQoJy5maWx0ZXJfX2l0ZW0nKS5maW5kKFwiaW5wdXQ6Y2hlY2tlZFwiKS5hdHRyKCdpZCcpO1xuICAgIGlucHV0Q2hlY2tlZC5wdXNoKGlkKTtcbiAgICAvL2NvbnNvbGUubG9nKGlucHV0Q2hlY2tlZCk7XG4gICAgdG90YWxQcm9nID0gbmJQcm9nW2lkXTtcbiAgICB0b3RhbEV4cGxvID0gbmJFeHBsb1tpZF07XG4gICAgLy9jb25zb2xlLmxvZyhcInRvdGFsUHJvZyA6IFwiK3RvdGFsUHJvZytcIiAvLyB0b3RhbEV4cGxvIDogXCIrdG90YWxFeHBsbyk7XG5cbiAgICBmdW5jdGlvbiB0eXBlZCh0ZXh0MSwgdGV4dDIpIHtcbiAgICAgICAgdG90YWxQcm9nX3RleHQgPSB0ZXh0MS50b1N0cmluZygpO1xuICAgICAgICB0b3RhbEV4cGxvX3RleHQgPSB0ZXh0Mi50b1N0cmluZygpO1xuXG4gICAgICAgIHRvdGFsUHJvZ19sZW5ndGggPSB0b3RhbFByb2dfdGV4dC5sZW5ndGg7XG4gICAgICAgIHRvdGFsRXhwbG9fbGVuZ3RoID0gdG90YWxFeHBsb190ZXh0Lmxlbmd0aDtcblxuICAgICAgICBkYXRhUHJvZy50ZXh0KCcnKTtcbiAgICAgICAgZGF0YUV4cGxvLnRleHQoJycpO1xuICAgICAgICBuZXdQcm9nX3RleHQgPSAnJztcbiAgICAgICAgbmV3RXhwbG9fdGV4dCA9ICcnO1xuICAgICAgICBpID0gMDtcbiAgICAgICAgaiA9IDA7XG5cbiAgICAgICAgdGltZXIxID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIG5ld1Byb2dfdGV4dCArPSB0b3RhbFByb2dfdGV4dFtpXTtcbiAgICAgICAgICAgIGRhdGFQcm9nLnRleHQobmV3UHJvZ190ZXh0KTtcbiAgICAgICAgICAgIGlmKGkgPCB0b3RhbFByb2dfbGVuZ3RoLTEpIHsgaSsrOyB9IGVsc2UgeyBjbGVhckludGVydmFsKHRpbWVyMSk7IH1cbiAgICAgICAgfSwgNTApO1xuXG4gICAgICAgIHRpbWVyMiA9IHNldEludGVydmFsKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBuZXdFeHBsb190ZXh0ICs9IHRvdGFsRXhwbG9fdGV4dFtqXTtcbiAgICAgICAgICAgIGRhdGFFeHBsby50ZXh0KG5ld0V4cGxvX3RleHQpO1xuICAgICAgICAgICAgaWYoaiA8IHRvdGFsRXhwbG9fbGVuZ3RoLTEpIHsgaisrOyB9IGVsc2UgeyBjbGVhckludGVydmFsKHRpbWVyMik7IH1cbiAgICAgICAgfSwgNTApO1xuICAgIH1cblxuICAgIGlucHV0Lm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgaWYoJCh0aGlzKS5pcygnOmNoZWNrZWQnKSA9PSB0cnVlKSB7XG4gICAgICAgICAgICBpbnB1dENoZWNrZWQucHVzaCgkKHRoaXMpLmF0dHIoJ2lkJykpO1xuXG4gICAgICAgICAgICB0b3RhbFByb2cgKz0gbmJQcm9nWyQodGhpcykuYXR0cignaWQnKV07XG4gICAgICAgICAgICB0b3RhbEV4cGxvICs9IG5iRXhwbG9bJCh0aGlzKS5hdHRyKCdpZCcpXTtcblxuICAgICAgICAgICAgdHlwZWQodG90YWxQcm9nLCB0b3RhbEV4cGxvKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGluZGljZSA9IGlucHV0Q2hlY2tlZC5pbmRleE9mKCQodGhpcykuYXR0cignaWQnKSk7XG4gICAgICAgICAgICBpbnB1dENoZWNrZWQuc3BsaWNlKGluZGljZSwgMSk7XG5cbiAgICAgICAgICAgIHRvdGFsUHJvZyAtPSBuYlByb2dbJCh0aGlzKS5hdHRyKCdpZCcpXTtcbiAgICAgICAgICAgIHRvdGFsRXhwbG8gLT0gbmJFeHBsb1skKHRoaXMpLmF0dHIoJ2lkJyldO1xuXG4gICAgICAgICAgICB0eXBlZCh0b3RhbFByb2csIHRvdGFsRXhwbG8pO1xuICAgICAgICB9XG4gICAgfSk7XG5cbn0pOyIsIiQod2luZG93KS5vbihcImxvYWRcIixmdW5jdGlvbigpe1xuICAgICQoXCIuZmlsdGVyXCIpLm1DdXN0b21TY3JvbGxiYXIoe1xuICAgICAgICBheGlzOlwieVwiLFxuICAgICAgICB0aGVtZTpcImxpZ2h0LTJcIlxuICAgIH0pO1xufSk7IiwiLy8gSW5pdGlhbGlzYXRpb24gZGVzIHZhcmlhYmxlcy4uLlxudmFyIGRhdGUgPSBuZXcgRGF0ZSxcbiAgICBqID0gZGF0ZS5nZXREYXRlKCksXG4gICAgajcgPSBqLTcsXG4gICAgdGFiX2pvdXJzID0gbmV3IEFycmF5KFwiRFwiLCBcIkxcIiwgXCJNXCIsIFwiTVwiLCBcIkpcIiwgXCJWXCIsIFwiU1wiKSxcbiAgICBpbmRleF9qb3VycyA9IFtdLFxuICAgIHRhYl9qID0gW10sXG4gICAgdGFiX2RhdGUgPSBbXTtcblxuZm9yKHZhciBhPTA7IGE8NzsgYSsrKSB7XG4gICAgaWYoZGF0ZS5nZXREYXkoKS1hID49IDApIHtcbiAgICAgICAgaW5kZXhfam91cnMucHVzaChkYXRlLmdldERheSgpLWEpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGluZGV4X2pvdXJzLnB1c2goZGF0ZS5nZXREYXkoKSs3LWEpO1xuICAgIH1cbn1cblxuZm9yICh2YXIgaT1qOyBpPj1qNzsgaS0tKSB7XG4gICAgdGFiX2oucHVzaChpKTtcbn1cblxuZm9yKHZhciBiPTA7IGI8NzsgYisrKSB7XG4gICAgdmFyIGRhdGVfY29tcGxldGUgPSB0YWJfam91cnNbaW5kZXhfam91cnNbYl1dK1wiIFwiK3RhYl9qW2JdO1xuICAgIHRhYl9kYXRlLnB1c2goZGF0ZV9jb21wbGV0ZSk7XG59XG5cbiQoXCIjdGltZWxpbmUtY3VzdG9tXCIpLmlvblJhbmdlU2xpZGVyKHtcbiAgICB0eXBlOiBcInNpbmdsZVwiLFxuICAgIHZhbHVlczogW3RhYl9kYXRlWzZdLCB0YWJfZGF0ZVs1XSwgdGFiX2RhdGVbNF0sIHRhYl9kYXRlWzNdLCB0YWJfZGF0ZVsyXSwgdGFiX2RhdGVbMV0sIHRhYl9kYXRlWzBdXSxcbiAgICBncmlkOiB0cnVlLFxuICAgIGZyb206IDYsXG4gICAgaGlkZV9taW5fbWF4OiB0cnVlXG59KTsiLCIvLyAkKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcbi8vICAgICAkKGZ1bmN0aW9uKCl7XG4vLyAgICAgICAgICQoXCIuZWxlbWVudC10eXBlZFwiKS50eXBlZCh7XG4vLyAgICAgICAgICAgICBzdHJpbmdzOiBbXCJcIl0sXG4vLyAgICAgICAgICAgICBzdHJpbmdzRWxlbWVudDogbnVsbCxcbi8vICAgICAgICAgICAgIHR5cGVTcGVlZDogMCxcbi8vICAgICAgICAgICAgIHN0YXJ0RGVsYXk6IDAsXG4vLyAgICAgICAgICAgICBiYWNrU3BlZWQ6IDAsXG4vLyAgICAgICAgICAgICBzaHVmZmxlOiBmYWxzZSxcbi8vICAgICAgICAgICAgIGJhY2tEZWxheTogNTAwLFxuLy8gICAgICAgICAgICAgZmFkZU91dDogZmFsc2UsXG4vLyAgICAgICAgICAgICBmYWRlT3V0Q2xhc3M6ICd0eXBlZC1mYWRlLW91dCcsXG4vLyAgICAgICAgICAgICBmYWRlT3V0RGVsYXk6IDUwMCwgLy8gbWlsbGlzZWNvbmRzXG4vLyAgICAgICAgICAgICBsb29wOiBmYWxzZSxcbi8vICAgICAgICAgICAgIGxvb3BDb3VudDogbnVsbCxcbi8vICAgICAgICAgICAgIHNob3dDdXJzb3I6IHRydWUsXG4vLyAgICAgICAgICAgICBjdXJzb3JDaGFyOiBcInxcIixcbi8vICAgICAgICAgICAgIGF0dHI6IG51bGwsXG4vLyAgICAgICAgICAgICBjb250ZW50VHlwZTogJ2h0bWwnXG4vLyAgICAgICAgIH0pO1xuLy8gICAgIH0pO1xuLy8gfSk7Il19
