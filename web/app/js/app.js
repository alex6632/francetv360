/*
 * ---- Settings -----
 */

//Init
var width = 500,
    height = 500,
    sens = 0.25,
    scale = 1,
    margin = {top: 0, right: 0, bottom: 0, left: 0};

//Setting projection
var proj = d3.geo.orthographic()
    .scale(245)
    .rotate([0, 0])
    .translate([width / 2, height / 2])
    .clipAngle(90);

var path = d3.geo.path().projection(proj).pointRadius(function(d) {
    return 6
});

//Zoom
var zoom = d3.behavior.zoom()
    .scaleExtent([1, 10])
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
        .attr('transform', 'translate(-24, -20)')
        .attr('width', 20)
        .attr('height', 24)
        .classed('white',true)
        .attr("href","../images/marker.svg");
}

$(document).ready(function() {
    $('#connectForm').on('submit', function(e) {
        e.preventDefault();
        var $this = $(this);
        var pseudo = $('#pseudo').val();
        var password = $('#password').val();

        if(pseudo !== '' && password !== '') {
            $.ajax({
                url: $this.attr('Controllers/connexion.php'),
                type: $this.attr('post'),
                data: $this.serialize(),
                success: function(html) {
                    console.log(html);
                }
            });
        }
    });
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbm5lY3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogLS0tLSBTZXR0aW5ncyAtLS0tLVxuICovXG5cbi8vSW5pdFxudmFyIHdpZHRoID0gNTAwLFxuICAgIGhlaWdodCA9IDUwMCxcbiAgICBzZW5zID0gMC4yNSxcbiAgICBzY2FsZSA9IDEsXG4gICAgbWFyZ2luID0ge3RvcDogMCwgcmlnaHQ6IDAsIGJvdHRvbTogMCwgbGVmdDogMH07XG5cbi8vU2V0dGluZyBwcm9qZWN0aW9uXG52YXIgcHJvaiA9IGQzLmdlby5vcnRob2dyYXBoaWMoKVxuICAgIC5zY2FsZSgyNDUpXG4gICAgLnJvdGF0ZShbMCwgMF0pXG4gICAgLnRyYW5zbGF0ZShbd2lkdGggLyAyLCBoZWlnaHQgLyAyXSlcbiAgICAuY2xpcEFuZ2xlKDkwKTtcblxudmFyIHBhdGggPSBkMy5nZW8ucGF0aCgpLnByb2plY3Rpb24ocHJvaikucG9pbnRSYWRpdXMoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiA2XG59KTtcblxuLy9ab29tXG52YXIgem9vbSA9IGQzLmJlaGF2aW9yLnpvb20oKVxuICAgIC5zY2FsZUV4dGVudChbMSwgMTBdKVxuICAgIC5vbihcInpvb21cIiwgem9vbWVkKTtcblxuLy9TVkcgY29udGFpbmVyXG52YXIgc3ZnID0gZDMuc2VsZWN0KFwiYm9keVwiKS5hcHBlbmQoXCJzdmdcIilcbiAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoKVxuICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodClcbiAgICAuYXR0cihcImNsYXNzXCIsIFwibWFwXCIpO1xuXG52YXIgZyA9IHN2Zy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4ubGVmdCArIFwiLFwiICsgbWFyZ2luLnJpZ2h0ICsgXCIpXCIpLmNhbGwoem9vbSlcbiAgICAub24oXCJtb3VzZWRvd24uem9vbVwiLCBudWxsKVxuICAgIC5vbihcInRvdWNoc3RhcnQuem9vbVwiLCBudWxsKVxuICAgIC5vbihcInRvdWNobW92ZS56b29tXCIsIG51bGwpXG4gICAgLm9uKFwidG91Y2hlbmQuem9vbVwiLCBudWxsKTtcblxudmFyIGluZm9Ub29sdGlwID0gZDMuc2VsZWN0KFwiYm9keVwiKS5hcHBlbmQoXCJkaXZcIikuYXR0cihcImNsYXNzXCIsIFwiaW5mb1Rvb2x0aXBcIik7XG52YXIgbW9kYWxJbmZvID0gZDMuc2VsZWN0KFwiZGl2Lm1vZGFsSW5mb1wiKTtcblxucXVldWUoKVxuICAgIC8vLmRlZmVyKGQzLmpzb24sIFwiLi4vZGF0YS93b3JsZC0xMTBtLmpzb25cIilcbiAgICAuZGVmZXIoZDMuanNvbiwgXCIuLi9kYXRhL3dvcmxkLTExMG0uanNvblwiKVxuICAgIC5kZWZlcihkMy5qc29uLCBcIi4uL2RhdGEvbWFya2VyLmpzb25cIilcbiAgICAuYXdhaXQocmVhZHkpO1xuXG5cbi8qXG4gKiAtLS0tIEZ1bmN0aW9ucyAtLS0tLVxuICovXG5cbi8vWm9vbSBmdW5jdGlvblxuZnVuY3Rpb24gem9vbWVkKCkge1xuICAgIGcuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIGQzLmV2ZW50LnRyYW5zbGF0ZSArIFwiKXNjYWxlKFwiICsgZDMuZXZlbnQuc2NhbGUgKyBcIilcIik7XG59XG5cbi8vTWFpbiBmdW5jdGlvblxuZnVuY3Rpb24gcmVhZHkoZXJyb3IsIHdvcmxkLCBsb2NhdGlvbnMpIHtcblxuICAgICQoJy5tb2RhbEluZm8nKS5vbignY2xpY2snLCAnLmpzQ2xvc2VNb2RhbEluZm8nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJCh0aGlzKS5wYXJlbnQoJy5tb2RhbEluZm8nKS5jc3MoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcbiAgICB9KTtcblxuICAgIC8vQWRkaW5nIHdhdGVyXG4gICAgdmFyIHdhdGVyID0gZy5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAuZGF0dW0oe3R5cGU6ICdTcGhlcmUnfSlcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ3dhdGVyJylcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKVxuICAgICAgICAuY2FsbChkMy5iZWhhdmlvci5kcmFnKClcbiAgICAgICAgICAgIC5vcmlnaW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIHIgPSBwcm9qLnJvdGF0ZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7eDogclswXSAvIHNlbnMsIHk6IC1yWzFdIC8gc2Vuc307IH0pXG4gICAgICAgICAgICAub24oJ2RyYWcnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJvdGF0ZSA9IHByb2oucm90YXRlKCk7XG4gICAgICAgICAgICAgICAgcHJvai5yb3RhdGUoW2QzLmV2ZW50LnggKiBzZW5zLCAtZDMuZXZlbnQueSAqIHNlbnMsIHJvdGF0ZVsyXV0pO1xuICAgICAgICAgICAgICAgIGcuc2VsZWN0QWxsKCcubGFuZCcpLmF0dHIoJ2QnLCBwYXRoKTtcblxuICAgICAgICAgICAgICAgIC8vIGZvciBlYWNoIG5vZGVcbiAgICAgICAgICAgICAgICBub2Rlcy5lYWNoKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGYgPSBkMy5zZWxlY3QodGhpcyksXG4gICAgICAgICAgICAgICAgICAgICAgICBsb25fbGF0ID0gW2QubG9uLCBkLmxhdF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9qX3BvcyA9IHByb2oobG9uX2xhdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGhhc1BhdGggPSBwYXRoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlBvaW50XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29vcmRpbmF0ZXM6IGxvbl9sYXRcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pICE9IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoaGFzUGF0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zdHlsZShcImRpc3BsYXlcIixcImlubGluZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuYXR0cihcInRyYW5zZm9ybVwiLCAndHJhbnNsYXRlKCcgKyBwcm9qX3Bvc1swXSArICcsJyArIHByb2pfcG9zWzFdICsgJyknKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zdHlsZShcImRpc3BsYXlcIixcIm5vbmVcIilcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgIGcuc2VsZWN0QWxsKCdnLmxhbmQnKVxuICAgICAgICAuZGF0YSh0b3BvanNvbi5mZWF0dXJlKHdvcmxkLCB3b3JsZC5vYmplY3RzLmNvdW50cmllcykuZmVhdHVyZXMpXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdsYW5kJylcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKVxuICAgICAgICAuY2FsbChkMy5iZWhhdmlvci5kcmFnKClcbiAgICAgICAgICAgIC5vcmlnaW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIHIgPSBwcm9qLnJvdGF0ZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7eDogclswXSAvIHNlbnMsIHk6IC1yWzFdIC8gc2Vuc307IH0pXG4gICAgICAgICAgICAub24oJ2RyYWcnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJvdGF0ZSA9IHByb2oucm90YXRlKCk7XG4gICAgICAgICAgICAgICAgcHJvai5yb3RhdGUoW2QzLmV2ZW50LnggKiBzZW5zLCAtZDMuZXZlbnQueSAqIHNlbnMsIHJvdGF0ZVsyXV0pO1xuICAgICAgICAgICAgICAgIGcuc2VsZWN0QWxsKCcubGFuZCcpLmF0dHIoJ2QnLCBwYXRoKTtcblxuICAgICAgICAgICAgICAgIC8vIGZvciBlYWNoIG5vZGVcbiAgICAgICAgICAgICAgICBub2Rlcy5lYWNoKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGYgPSBkMy5zZWxlY3QodGhpcyksXG4gICAgICAgICAgICAgICAgICAgICAgICBsb25fbGF0ID0gW2QubG9uLCBkLmxhdF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9qX3BvcyA9IHByb2oobG9uX2xhdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgdG8gc2VlIGlmIGl0J3Mgc3RpbGwgdmlzaWJsZVxuICAgICAgICAgICAgICAgICAgICB2YXIgaGFzUGF0aCA9IHBhdGgoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiUG9pbnRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb29yZGluYXRlczogbG9uX2xhdFxuICAgICAgICAgICAgICAgICAgICAgICAgfSkgIT0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIGl0IGlzIHNob3cgaXQgYW5kIHVwZGF0ZSBwb3NpdGlvblxuICAgICAgICAgICAgICAgICAgICBpZiAoaGFzUGF0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zdHlsZShcImRpc3BsYXlcIixcImlubGluZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuYXR0cihcInRyYW5zZm9ybVwiLCAndHJhbnNsYXRlKCcgKyBwcm9qX3Bvc1swXSArICcsJyArIHByb2pfcG9zWzFdICsgJyknKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIG90aGVyd2lzZSBoaWRlIGl0XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zdHlsZShcImRpc3BsYXlcIixcIm5vbmVcIilcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgIHZhciBub2RlcyA9IGcuc2VsZWN0QWxsKCdnLm5vZGUnKVxuICAgICAgICAuZGF0YShsb2NhdGlvbnMpXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgJ25vZGUnKVxuICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgdmFyIHByb2pfcG9zID0gcHJvaihbZC5sb24sIGQubGF0XSk7XG4gICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgcHJval9wb3NbMF0gKyAnLCcgKyBwcm9qX3Bvc1sxXSArICcpJztcbiAgICAgICAgfSlcbiAgICAgICAgLmF0dHIoJ3N0eWxlJywgJ2N1cnNvcjogcG9pbnRlcicpXG4gICAgICAgIC5hdHRyKFwiZFwiLCBwYXRoKVxuICAgICAgICAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIGluZm9Ub29sdGlwLmh0bWwoXCI8ZGl2IGNsYXNzPSdpbmZvVG9vbHRpcF9fdGl0bGUnPlwiK2QubmFtZStcIjwvZGl2PjxpbWcgc3JjPSdpbWcvZGlzdC9cIitkLmltZytcIicgYWx0PScnIGNsYXNzPSdpbmZvVG9vbHRpcF9faW1nJz5cIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJsZWZ0XCIsIChkMy5ldmVudC5wYWdlWCAtIDExMCkgKyBcInB4XCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwidG9wXCIsIChkMy5ldmVudC5wYWdlWSAtIDEwMCkgKyBcInB4XCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCAxKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgaW5mb1Rvb2x0aXAuc3R5bGUoXCJvcGFjaXR5XCIsIDApXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbihcIm1vdXNlbW92ZVwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBpbmZvVG9vbHRpcC5zdHlsZShcImxlZnRcIiwgKGQzLmV2ZW50LnBhZ2VYIC0gMTEwKSArIFwicHhcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJ0b3BcIiwgKGQzLmV2ZW50LnBhZ2VZIC0gMTAwKSArIFwicHhcIik7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIHZhciBtb2RhbEluZm9fX3RpdGxlID0gZDMuc2VsZWN0KFwiZGl2Lm1vZGFsSW5mb19fdGl0bGVcIik7XG4gICAgICAgICAgICB2YXIgbW9kYWxJbmZvX192aWRlbyA9IGQzLnNlbGVjdChcImRpdi5tb2RhbEluZm9fX3ZpZGVvXCIpO1xuICAgICAgICAgICAgbW9kYWxJbmZvX190aXRsZS5odG1sKGQubmFtZSk7XG4gICAgICAgICAgICBtb2RhbEluZm9fX3ZpZGVvLmh0bWwoXCI8aWZyYW1lIHdpZHRoPSc1NjAnIGhlaWdodD0nMzE1JyBzcmM9J2h0dHBzOi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkL1wiK2QudG9rZW4rXCInIGZyYW1lYm9yZGVyPScwJyBhbGxvd2Z1bGxzY3JlZW4+PC9pZnJhbWU+XCIpO1xuICAgICAgICAgICAgbW9kYWxJbmZvLnN0eWxlKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpO1xuICAgICAgICB9KTtcblxuICAgIG5vZGVzLmFwcGVuZChcInN2ZzppbWFnZVwiKVxuICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgtMjQsIC0yMCknKVxuICAgICAgICAuYXR0cignd2lkdGgnLCAyMClcbiAgICAgICAgLmF0dHIoJ2hlaWdodCcsIDI0KVxuICAgICAgICAuY2xhc3NlZCgnd2hpdGUnLHRydWUpXG4gICAgICAgIC5hdHRyKFwiaHJlZlwiLFwiLi4vaW1hZ2VzL21hcmtlci5zdmdcIik7XG59XG4iLCIkKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcbiAgICAkKCcjY29ubmVjdEZvcm0nKS5vbignc3VibWl0JywgZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XG4gICAgICAgIHZhciBwc2V1ZG8gPSAkKCcjcHNldWRvJykudmFsKCk7XG4gICAgICAgIHZhciBwYXNzd29yZCA9ICQoJyNwYXNzd29yZCcpLnZhbCgpO1xuXG4gICAgICAgIGlmKHBzZXVkbyAhPT0gJycgJiYgcGFzc3dvcmQgIT09ICcnKSB7XG4gICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgIHVybDogJHRoaXMuYXR0cignQ29udHJvbGxlcnMvY29ubmV4aW9uLnBocCcpLFxuICAgICAgICAgICAgICAgIHR5cGU6ICR0aGlzLmF0dHIoJ3Bvc3QnKSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkdGhpcy5zZXJpYWxpemUoKSxcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihodG1sKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGh0bWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG59KTsiXX0=
