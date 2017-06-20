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

var path = d3.geo.path().projection(proj).pointRadius(function(d) {
    return 6
});

//Zoom
var zoom = d3.behavior.zoom()
    .scaleExtent([1, 2])
    .on("zoom", zoomed);

//SVG container
var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "map");

var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.right + ")").call(zoom)
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

// background: -webkit-linear-gradient(-45deg, rgba(0,0,0,0.16) 0%,rgba(255,255,255,0.16) 100%);

var infoTooltip = d3.select("body").append("div").attr("class", "infoTooltip");
var modalInfo = d3.select("div.modalInfo");

queue()
    //.defer(d3.json, "../data/world-110m.json")
    .defer(d3.json, "../data/world-110m.json")
    .defer(d3.json, "../data/marker.json")
    .await(ready);


/*
 * ---- Functions -----
 */

//Zoom function
function zoomed() {
    g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

//Main function
function ready(error, world, locations) {

    $('.modalInfo').on('click', '.jsCloseModalInfo', function() {
        $(this).parent('.modalInfo').css("display", "none");
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

    g.selectAll('g.land')
        .data(topojson.feature(world, world.objects.countries).features)
        .enter().append('path')
        .attr('class', 'land')
        .attr('d', path)
        .call(d3.behavior.drag()
            .origin(function() {
                var r = proj.rotate();
                return {x: r[0] / sens, y: -r[1] / sens}; })
            .on('drag', function(d) {
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
        .on('mouseover', function(d) {
            infoTooltip.html("<div class='infoTooltip__title'>"+d.name+"</div><img src='img/dist/"+d.img+"' alt='' class='infoTooltip__img'>")
                .style("left", (d3.event.pageX - 110) + "px")
                .style("top", (d3.event.pageY - 100) + "px")
                .style("display", "block")
                .style("opacity", 1);
        })
        .on("mouseout", function(d) {
            infoTooltip.style("opacity", 0)
                .style("display", "none");
        })
        .on("mousemove", function(d) {
            infoTooltip.style("left", (d3.event.pageX - 110) + "px")
                .style("top", (d3.event.pageY - 100) + "px");
        })
        .on("click", function(d) {
            var modalInfo__title = d3.select("div.modalInfo__title");
            var modalInfo__video = d3.select("div.modalInfo__video");
            modalInfo__title.html(d.name);
            modalInfo__video.html("<iframe width='560' height='315' src='https://www.youtube.com/embed/"+d.token+"' frameborder='0' allowfullscreen></iframe>");
            modalInfo.style("display", "block");
        });

    nodes.append("svg:image")
        .attr('transform', 'translate(-7, -7)')
        .attr('width', 7)
        .attr('height', 7)
        .classed('white',true)
        .attr("href","../images/marker.png");
}

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsInR5cGVkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogLS0tLSBTZXR0aW5ncyAtLS0tLVxuICovXG5cbi8vSW5pdFxudmFyIHdpZHRoID0gMTAwMCxcbiAgICBoZWlnaHQgPSA2MDAsXG4gICAgc2VucyA9IDAuMjUsXG4gICAgc2NhbGUgPSAxLFxuICAgIG1hcmdpbiA9IHt0b3A6IDAsIHJpZ2h0OiAwLCBib3R0b206IDAsIGxlZnQ6IDB9O1xuXG4vL1NldHRpbmcgcHJvamVjdGlvblxudmFyIHByb2ogPSBkMy5nZW8ub3J0aG9ncmFwaGljKClcbiAgICAuc2NhbGUoMTkwKVxuICAgIC5yb3RhdGUoWzAsIDBdKVxuICAgIC50cmFuc2xhdGUoW3dpZHRoIC8gMiwgaGVpZ2h0IC8gMl0pXG4gICAgLmNsaXBBbmdsZSg5MCk7XG5cbnZhciBwYXRoID0gZDMuZ2VvLnBhdGgoKS5wcm9qZWN0aW9uKHByb2opLnBvaW50UmFkaXVzKGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gNlxufSk7XG5cbi8vWm9vbVxudmFyIHpvb20gPSBkMy5iZWhhdmlvci56b29tKClcbiAgICAuc2NhbGVFeHRlbnQoWzEsIDJdKVxuICAgIC5vbihcInpvb21cIiwgem9vbWVkKTtcblxuLy9TVkcgY29udGFpbmVyXG52YXIgc3ZnID0gZDMuc2VsZWN0KFwiYm9keVwiKS5hcHBlbmQoXCJzdmdcIilcbiAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoKVxuICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodClcbiAgICAuYXR0cihcImNsYXNzXCIsIFwibWFwXCIpO1xuXG52YXIgZyA9IHN2Zy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4ubGVmdCArIFwiLFwiICsgbWFyZ2luLnJpZ2h0ICsgXCIpXCIpLmNhbGwoem9vbSlcbiAgICAub24oXCJtb3VzZWRvd24uem9vbVwiLCBudWxsKVxuICAgIC5vbihcInRvdWNoc3RhcnQuem9vbVwiLCBudWxsKVxuICAgIC5vbihcInRvdWNobW92ZS56b29tXCIsIG51bGwpXG4gICAgLm9uKFwidG91Y2hlbmQuem9vbVwiLCBudWxsKTtcblxuLy9BZGQgZ3JhZGllbnQgb24gd2F0ZXJcbnZhciBkZWZzID0gc3ZnLmFwcGVuZChcImRlZnNcIik7XG52YXIgZ3JhZGllbnQgPSBkZWZzLmFwcGVuZChcImxpbmVhckdyYWRpZW50XCIpXG4gICAgLmF0dHIoXCJpZFwiLCBcImdyYWRpZW50XCIpXG4gICAgLmF0dHIoXCJ4MVwiLFwiMFwiKVxuICAgIC5hdHRyKFwieDJcIixcIjFcIilcbiAgICAuYXR0cihcInkxXCIsXCIwXCIpXG4gICAgLmF0dHIoXCJ5MlwiLFwiMVwiKTtcbmdyYWRpZW50LmFwcGVuZChcInN0b3BcIilcbiAgICAuYXR0cihcIm9mZnNldFwiLCBcIjAlXCIpXG4gICAgLmF0dHIoXCJzdG9wLWNvbG9yXCIsIFwiIzAwMFwiKVxuICAgIC5hdHRyKFwic3RvcC1vcGFjaXR5XCIsIFwiMC4xNlwiKTtcbmdyYWRpZW50LmFwcGVuZChcInN0b3BcIilcbiAgICAuYXR0cihcIm9mZnNldFwiLCBcIjEwMCVcIilcbiAgICAuYXR0cihcInN0b3AtY29sb3JcIiwgXCIjRkZGXCIpXG4gICAgLmF0dHIoXCJzdG9wLW9wYWNpdHlcIiwgXCIwLjE2XCIpO1xuXG4vLyBiYWNrZ3JvdW5kOiAtd2Via2l0LWxpbmVhci1ncmFkaWVudCgtNDVkZWcsIHJnYmEoMCwwLDAsMC4xNikgMCUscmdiYSgyNTUsMjU1LDI1NSwwLjE2KSAxMDAlKTtcblxudmFyIGluZm9Ub29sdGlwID0gZDMuc2VsZWN0KFwiYm9keVwiKS5hcHBlbmQoXCJkaXZcIikuYXR0cihcImNsYXNzXCIsIFwiaW5mb1Rvb2x0aXBcIik7XG52YXIgbW9kYWxJbmZvID0gZDMuc2VsZWN0KFwiZGl2Lm1vZGFsSW5mb1wiKTtcblxucXVldWUoKVxuICAgIC8vLmRlZmVyKGQzLmpzb24sIFwiLi4vZGF0YS93b3JsZC0xMTBtLmpzb25cIilcbiAgICAuZGVmZXIoZDMuanNvbiwgXCIuLi9kYXRhL3dvcmxkLTExMG0uanNvblwiKVxuICAgIC5kZWZlcihkMy5qc29uLCBcIi4uL2RhdGEvbWFya2VyLmpzb25cIilcbiAgICAuYXdhaXQocmVhZHkpO1xuXG5cbi8qXG4gKiAtLS0tIEZ1bmN0aW9ucyAtLS0tLVxuICovXG5cbi8vWm9vbSBmdW5jdGlvblxuZnVuY3Rpb24gem9vbWVkKCkge1xuICAgIGcuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIGQzLmV2ZW50LnRyYW5zbGF0ZSArIFwiKXNjYWxlKFwiICsgZDMuZXZlbnQuc2NhbGUgKyBcIilcIik7XG59XG5cbi8vTWFpbiBmdW5jdGlvblxuZnVuY3Rpb24gcmVhZHkoZXJyb3IsIHdvcmxkLCBsb2NhdGlvbnMpIHtcblxuICAgICQoJy5tb2RhbEluZm8nKS5vbignY2xpY2snLCAnLmpzQ2xvc2VNb2RhbEluZm8nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJCh0aGlzKS5wYXJlbnQoJy5tb2RhbEluZm8nKS5jc3MoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcbiAgICB9KTtcblxuICAgIC8vQWRkaW5nIHdhdGVyXG4gICAgdmFyIHdhdGVyID0gZy5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAuZGF0dW0oe3R5cGU6ICdTcGhlcmUnfSlcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ3dhdGVyJylcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKVxuICAgICAgICAuY2FsbChkMy5iZWhhdmlvci5kcmFnKClcbiAgICAgICAgICAgIC5vcmlnaW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIHIgPSBwcm9qLnJvdGF0ZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7eDogclswXSAvIHNlbnMsIHk6IC1yWzFdIC8gc2Vuc307IH0pXG4gICAgICAgICAgICAub24oJ2RyYWcnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJvdGF0ZSA9IHByb2oucm90YXRlKCk7XG4gICAgICAgICAgICAgICAgcHJvai5yb3RhdGUoW2QzLmV2ZW50LnggKiBzZW5zLCAtZDMuZXZlbnQueSAqIHNlbnMsIHJvdGF0ZVsyXV0pO1xuICAgICAgICAgICAgICAgIGcuc2VsZWN0QWxsKCcubGFuZCcpLmF0dHIoJ2QnLCBwYXRoKTtcblxuICAgICAgICAgICAgICAgIC8vIGZvciBlYWNoIG5vZGVcbiAgICAgICAgICAgICAgICBub2Rlcy5lYWNoKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGYgPSBkMy5zZWxlY3QodGhpcyksXG4gICAgICAgICAgICAgICAgICAgICAgICBsb25fbGF0ID0gW2QubG9uLCBkLmxhdF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9qX3BvcyA9IHByb2oobG9uX2xhdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGhhc1BhdGggPSBwYXRoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlBvaW50XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29vcmRpbmF0ZXM6IGxvbl9sYXRcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pICE9IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoaGFzUGF0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zdHlsZShcImRpc3BsYXlcIixcImlubGluZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuYXR0cihcInRyYW5zZm9ybVwiLCAndHJhbnNsYXRlKCcgKyBwcm9qX3Bvc1swXSArICcsJyArIHByb2pfcG9zWzFdICsgJyknKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zdHlsZShcImRpc3BsYXlcIixcIm5vbmVcIilcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgIGcuc2VsZWN0QWxsKCdnLmxhbmQnKVxuICAgICAgICAuZGF0YSh0b3BvanNvbi5mZWF0dXJlKHdvcmxkLCB3b3JsZC5vYmplY3RzLmNvdW50cmllcykuZmVhdHVyZXMpXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdsYW5kJylcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKVxuICAgICAgICAuY2FsbChkMy5iZWhhdmlvci5kcmFnKClcbiAgICAgICAgICAgIC5vcmlnaW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIHIgPSBwcm9qLnJvdGF0ZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7eDogclswXSAvIHNlbnMsIHk6IC1yWzFdIC8gc2Vuc307IH0pXG4gICAgICAgICAgICAub24oJ2RyYWcnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJvdGF0ZSA9IHByb2oucm90YXRlKCk7XG4gICAgICAgICAgICAgICAgcHJvai5yb3RhdGUoW2QzLmV2ZW50LnggKiBzZW5zLCAtZDMuZXZlbnQueSAqIHNlbnMsIHJvdGF0ZVsyXV0pO1xuICAgICAgICAgICAgICAgIGcuc2VsZWN0QWxsKCcubGFuZCcpLmF0dHIoJ2QnLCBwYXRoKTtcblxuICAgICAgICAgICAgICAgIC8vIGZvciBlYWNoIG5vZGVcbiAgICAgICAgICAgICAgICBub2Rlcy5lYWNoKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGYgPSBkMy5zZWxlY3QodGhpcyksXG4gICAgICAgICAgICAgICAgICAgICAgICBsb25fbGF0ID0gW2QubG9uLCBkLmxhdF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9qX3BvcyA9IHByb2oobG9uX2xhdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgdG8gc2VlIGlmIGl0J3Mgc3RpbGwgdmlzaWJsZVxuICAgICAgICAgICAgICAgICAgICB2YXIgaGFzUGF0aCA9IHBhdGgoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiUG9pbnRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb29yZGluYXRlczogbG9uX2xhdFxuICAgICAgICAgICAgICAgICAgICAgICAgfSkgIT0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIGl0IGlzIHNob3cgaXQgYW5kIHVwZGF0ZSBwb3NpdGlvblxuICAgICAgICAgICAgICAgICAgICBpZiAoaGFzUGF0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zdHlsZShcImRpc3BsYXlcIixcImlubGluZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuYXR0cihcInRyYW5zZm9ybVwiLCAndHJhbnNsYXRlKCcgKyBwcm9qX3Bvc1swXSArICcsJyArIHByb2pfcG9zWzFdICsgJyknKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIG90aGVyd2lzZSBoaWRlIGl0XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zdHlsZShcImRpc3BsYXlcIixcIm5vbmVcIilcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgIHZhciBub2RlcyA9IGcuc2VsZWN0QWxsKCdnLm5vZGUnKVxuICAgICAgICAuZGF0YShsb2NhdGlvbnMpXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgJ25vZGUnKVxuICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgdmFyIHByb2pfcG9zID0gcHJvaihbZC5sb24sIGQubGF0XSk7XG4gICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgcHJval9wb3NbMF0gKyAnLCcgKyBwcm9qX3Bvc1sxXSArICcpJztcbiAgICAgICAgfSlcbiAgICAgICAgLmF0dHIoJ3N0eWxlJywgJ2N1cnNvcjogcG9pbnRlcicpXG4gICAgICAgIC5hdHRyKFwiZFwiLCBwYXRoKVxuICAgICAgICAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIGluZm9Ub29sdGlwLmh0bWwoXCI8ZGl2IGNsYXNzPSdpbmZvVG9vbHRpcF9fdGl0bGUnPlwiK2QubmFtZStcIjwvZGl2PjxpbWcgc3JjPSdpbWcvZGlzdC9cIitkLmltZytcIicgYWx0PScnIGNsYXNzPSdpbmZvVG9vbHRpcF9faW1nJz5cIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJsZWZ0XCIsIChkMy5ldmVudC5wYWdlWCAtIDExMCkgKyBcInB4XCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwidG9wXCIsIChkMy5ldmVudC5wYWdlWSAtIDEwMCkgKyBcInB4XCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCAxKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgaW5mb1Rvb2x0aXAuc3R5bGUoXCJvcGFjaXR5XCIsIDApXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbihcIm1vdXNlbW92ZVwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBpbmZvVG9vbHRpcC5zdHlsZShcImxlZnRcIiwgKGQzLmV2ZW50LnBhZ2VYIC0gMTEwKSArIFwicHhcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJ0b3BcIiwgKGQzLmV2ZW50LnBhZ2VZIC0gMTAwKSArIFwicHhcIik7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIHZhciBtb2RhbEluZm9fX3RpdGxlID0gZDMuc2VsZWN0KFwiZGl2Lm1vZGFsSW5mb19fdGl0bGVcIik7XG4gICAgICAgICAgICB2YXIgbW9kYWxJbmZvX192aWRlbyA9IGQzLnNlbGVjdChcImRpdi5tb2RhbEluZm9fX3ZpZGVvXCIpO1xuICAgICAgICAgICAgbW9kYWxJbmZvX190aXRsZS5odG1sKGQubmFtZSk7XG4gICAgICAgICAgICBtb2RhbEluZm9fX3ZpZGVvLmh0bWwoXCI8aWZyYW1lIHdpZHRoPSc1NjAnIGhlaWdodD0nMzE1JyBzcmM9J2h0dHBzOi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkL1wiK2QudG9rZW4rXCInIGZyYW1lYm9yZGVyPScwJyBhbGxvd2Z1bGxzY3JlZW4+PC9pZnJhbWU+XCIpO1xuICAgICAgICAgICAgbW9kYWxJbmZvLnN0eWxlKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpO1xuICAgICAgICB9KTtcblxuICAgIG5vZGVzLmFwcGVuZChcInN2ZzppbWFnZVwiKVxuICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgtNywgLTcpJylcbiAgICAgICAgLmF0dHIoJ3dpZHRoJywgNylcbiAgICAgICAgLmF0dHIoJ2hlaWdodCcsIDcpXG4gICAgICAgIC5jbGFzc2VkKCd3aGl0ZScsdHJ1ZSlcbiAgICAgICAgLmF0dHIoXCJocmVmXCIsXCIuLi9pbWFnZXMvbWFya2VyLnBuZ1wiKTtcbn1cbiIsIiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xuICAgICQoZnVuY3Rpb24oKXtcbiAgICAgICAgJChcIi5lbGVtZW50XCIpLnR5cGVkKHtcbiAgICAgICAgICAgIHN0cmluZ3M6IFtcIkZpcnN0IF4xMDAwIHNlbnRlbmNlLlwiLCBcIlNlY29uZCBzZW50ZW5jZS5cIl0sXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5IHVzZSBhbiBIVE1MIGVsZW1lbnQgdG8gZ3JhYiBzdHJpbmdzIGZyb20gKG11c3Qgd3JhcCBlYWNoIHN0cmluZyBpbiBhIDxwPilcbiAgICAgICAgICAgIHN0cmluZ3NFbGVtZW50OiBudWxsLFxuICAgICAgICAgICAgLy8gdHlwaW5nIHNwZWVkXG4gICAgICAgICAgICB0eXBlU3BlZWQ6IDAsXG4gICAgICAgICAgICAvLyB0aW1lIGJlZm9yZSB0eXBpbmcgc3RhcnRzXG4gICAgICAgICAgICBzdGFydERlbGF5OiAwLFxuICAgICAgICAgICAgLy8gYmFja3NwYWNpbmcgc3BlZWRcbiAgICAgICAgICAgIGJhY2tTcGVlZDogMCxcbiAgICAgICAgICAgIC8vIHNodWZmbGUgdGhlIHN0cmluZ3NcbiAgICAgICAgICAgIHNodWZmbGU6IGZhbHNlLFxuICAgICAgICAgICAgLy8gdGltZSBiZWZvcmUgYmFja3NwYWNpbmdcbiAgICAgICAgICAgIGJhY2tEZWxheTogNTAwLFxuICAgICAgICAgICAgLy8gRmFkZSBvdXQgaW5zdGVhZCBvZiBiYWNrc3BhY2UgKG11c3QgdXNlIENTUyBjbGFzcylcbiAgICAgICAgICAgIGZhZGVPdXQ6IGZhbHNlLFxuICAgICAgICAgICAgZmFkZU91dENsYXNzOiAndHlwZWQtZmFkZS1vdXQnLFxuICAgICAgICAgICAgZmFkZU91dERlbGF5OiA1MDAsIC8vIG1pbGxpc2Vjb25kc1xuICAgICAgICAgICAgLy8gbG9vcFxuICAgICAgICAgICAgbG9vcDogZmFsc2UsXG4gICAgICAgICAgICAvLyBudWxsID0gaW5maW5pdGVcbiAgICAgICAgICAgIGxvb3BDb3VudDogbnVsbCxcbiAgICAgICAgICAgIC8vIHNob3cgY3Vyc29yXG4gICAgICAgICAgICBzaG93Q3Vyc29yOiB0cnVlLFxuICAgICAgICAgICAgLy8gY2hhcmFjdGVyIGZvciBjdXJzb3JcbiAgICAgICAgICAgIGN1cnNvckNoYXI6IFwifFwiLFxuICAgICAgICAgICAgLy8gYXR0cmlidXRlIHRvIHR5cGUgKG51bGwgPT0gdGV4dClcbiAgICAgICAgICAgIGF0dHI6IG51bGwsXG4gICAgICAgICAgICAvLyBlaXRoZXIgaHRtbCBvciB0ZXh0XG4gICAgICAgICAgICBjb250ZW50VHlwZTogJ2h0bWwnLFxuICAgICAgICAgICAgLy8gY2FsbCB3aGVuIGRvbmUgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgICAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbigpIHt9LFxuICAgICAgICAgICAgLy8gc3RhcnRpbmcgY2FsbGJhY2sgZnVuY3Rpb24gYmVmb3JlIGVhY2ggc3RyaW5nXG4gICAgICAgICAgICBwcmVTdHJpbmdUeXBlZDogZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgICAgIC8vY2FsbGJhY2sgZm9yIGV2ZXJ5IHR5cGVkIHN0cmluZ1xuICAgICAgICAgICAgb25TdHJpbmdUeXBlZDogZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgICAgIC8vIGNhbGxiYWNrIGZvciByZXNldFxuICAgICAgICAgICAgcmVzZXRDYWxsYmFjazogZnVuY3Rpb24oKSB7fVxuICAgICAgICB9KTtcbiAgICB9KTtcbn0pOyJdfQ==
