/*
 * ---- Settings -----
 */

//Init
var width = 500,
    height = 500,
    sens = 0.25,
    scale = 1,
    margin = {top: 0, right: 0, bottom: 0, left: 0},
    focused;

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
    .attr("height", height);

var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.right + ")").call(zoom)
    .on("mousedown.zoom", null)
    .on("touchstart.zoom", null)
    .on("touchmove.zoom", null)
    .on("touchend.zoom", null);

var infoTooltip = d3.select("body").append("div").attr("class", "infoTooltip");
var modalInfo = d3.select("div.modalInfo");

queue()
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
        .attr('d', path);

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
                        lon_lat = [d.lon, d.lat];
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
            var modalInfo__video = d3.select("div.modalInfo__video--connected");
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbm5lY3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiAtLS0tIFNldHRpbmdzIC0tLS0tXG4gKi9cblxuLy9Jbml0XG52YXIgd2lkdGggPSA1MDAsXG4gICAgaGVpZ2h0ID0gNTAwLFxuICAgIHNlbnMgPSAwLjI1LFxuICAgIHNjYWxlID0gMSxcbiAgICBtYXJnaW4gPSB7dG9wOiAwLCByaWdodDogMCwgYm90dG9tOiAwLCBsZWZ0OiAwfSxcbiAgICBmb2N1c2VkO1xuXG4vL1NldHRpbmcgcHJvamVjdGlvblxudmFyIHByb2ogPSBkMy5nZW8ub3J0aG9ncmFwaGljKClcbiAgICAuc2NhbGUoMjQ1KVxuICAgIC5yb3RhdGUoWzAsIDBdKVxuICAgIC50cmFuc2xhdGUoW3dpZHRoIC8gMiwgaGVpZ2h0IC8gMl0pXG4gICAgLmNsaXBBbmdsZSg5MCk7XG5cbnZhciBwYXRoID0gZDMuZ2VvLnBhdGgoKS5wcm9qZWN0aW9uKHByb2opLnBvaW50UmFkaXVzKGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gNlxufSk7XG5cbi8vWm9vbVxudmFyIHpvb20gPSBkMy5iZWhhdmlvci56b29tKClcbiAgICAuc2NhbGVFeHRlbnQoWzEsIDEwXSlcbiAgICAub24oXCJ6b29tXCIsIHpvb21lZCk7XG5cbi8vU1ZHIGNvbnRhaW5lclxudmFyIHN2ZyA9IGQzLnNlbGVjdChcImJvZHlcIikuYXBwZW5kKFwic3ZnXCIpXG4gICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aClcbiAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpO1xuXG52YXIgZyA9IHN2Zy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4ubGVmdCArIFwiLFwiICsgbWFyZ2luLnJpZ2h0ICsgXCIpXCIpLmNhbGwoem9vbSlcbiAgICAub24oXCJtb3VzZWRvd24uem9vbVwiLCBudWxsKVxuICAgIC5vbihcInRvdWNoc3RhcnQuem9vbVwiLCBudWxsKVxuICAgIC5vbihcInRvdWNobW92ZS56b29tXCIsIG51bGwpXG4gICAgLm9uKFwidG91Y2hlbmQuem9vbVwiLCBudWxsKTtcblxudmFyIGluZm9Ub29sdGlwID0gZDMuc2VsZWN0KFwiYm9keVwiKS5hcHBlbmQoXCJkaXZcIikuYXR0cihcImNsYXNzXCIsIFwiaW5mb1Rvb2x0aXBcIik7XG52YXIgbW9kYWxJbmZvID0gZDMuc2VsZWN0KFwiZGl2Lm1vZGFsSW5mb1wiKTtcblxucXVldWUoKVxuICAgIC5kZWZlcihkMy5qc29uLCBcIi4uL2RhdGEvd29ybGQtMTEwbS5qc29uXCIpXG4gICAgLmRlZmVyKGQzLmpzb24sIFwiLi4vZGF0YS9tYXJrZXIuanNvblwiKVxuICAgIC5hd2FpdChyZWFkeSk7XG5cblxuLypcbiAqIC0tLS0gRnVuY3Rpb25zIC0tLS0tXG4gKi9cblxuLy9ab29tIGZ1bmN0aW9uXG5mdW5jdGlvbiB6b29tZWQoKSB7XG4gICAgZy5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgZDMuZXZlbnQudHJhbnNsYXRlICsgXCIpc2NhbGUoXCIgKyBkMy5ldmVudC5zY2FsZSArIFwiKVwiKTtcbn1cblxuLy9NYWluIGZ1bmN0aW9uXG5mdW5jdGlvbiByZWFkeShlcnJvciwgd29ybGQsIGxvY2F0aW9ucykge1xuXG4gICAgJCgnLm1vZGFsSW5mbycpLm9uKCdjbGljaycsICcuanNDbG9zZU1vZGFsSW5mbycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkKHRoaXMpLnBhcmVudCgnLm1vZGFsSW5mbycpLmNzcyhcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuICAgIH0pO1xuXG4gICAgLy9BZGRpbmcgd2F0ZXJcbiAgICB2YXIgd2F0ZXIgPSBnLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5kYXR1bSh7dHlwZTogJ1NwaGVyZSd9KVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnd2F0ZXInKVxuICAgICAgICAuYXR0cignZCcsIHBhdGgpO1xuXG4gICAgZy5zZWxlY3RBbGwoJ2cubGFuZCcpXG4gICAgICAgIC5kYXRhKHRvcG9qc29uLmZlYXR1cmUod29ybGQsIHdvcmxkLm9iamVjdHMuY291bnRyaWVzKS5mZWF0dXJlcylcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xhbmQnKVxuICAgICAgICAuYXR0cignZCcsIHBhdGgpXG4gICAgICAgIC5jYWxsKGQzLmJlaGF2aW9yLmRyYWcoKVxuICAgICAgICAgICAgLm9yaWdpbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgciA9IHByb2oucm90YXRlKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHt4OiByWzBdIC8gc2VucywgeTogLXJbMV0gLyBzZW5zfTsgfSlcbiAgICAgICAgICAgIC5vbignZHJhZycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICB2YXIgcm90YXRlID0gcHJvai5yb3RhdGUoKTtcbiAgICAgICAgICAgICAgICBwcm9qLnJvdGF0ZShbZDMuZXZlbnQueCAqIHNlbnMsIC1kMy5ldmVudC55ICogc2Vucywgcm90YXRlWzJdXSk7XG4gICAgICAgICAgICAgICAgZy5zZWxlY3RBbGwoJy5sYW5kJykuYXR0cignZCcsIHBhdGgpO1xuXG4gICAgICAgICAgICAgICAgLy8gZm9yIGVhY2ggbm9kZVxuICAgICAgICAgICAgICAgIG5vZGVzLmVhY2goZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IGQzLnNlbGVjdCh0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvbl9sYXQgPSBbZC5sb24sIGQubGF0XTtcbiAgICAgICAgICAgICAgICAgICAgcHJval9wb3MgPSBwcm9qKGxvbl9sYXQpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIHRvIHNlZSBpZiBpdCdzIHN0aWxsIHZpc2libGVcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhhc1BhdGggPSBwYXRoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlBvaW50XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29vcmRpbmF0ZXM6IGxvbl9sYXRcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pICE9IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgICAgICAvLyBpZiBpdCBpcyBzaG93IGl0IGFuZCB1cGRhdGUgcG9zaXRpb25cbiAgICAgICAgICAgICAgICAgICAgaWYgKGhhc1BhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc3R5bGUoXCJkaXNwbGF5XCIsXCJpbmxpbmVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgJ3RyYW5zbGF0ZSgnICsgcHJval9wb3NbMF0gKyAnLCcgKyBwcm9qX3Bvc1sxXSArICcpJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBvdGhlcndpc2UgaGlkZSBpdFxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc3R5bGUoXCJkaXNwbGF5XCIsXCJub25lXCIpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICk7XG5cbiAgICB2YXIgbm9kZXMgPSBnLnNlbGVjdEFsbCgnZy5ub2RlJylcbiAgICAgICAgLmRhdGEobG9jYXRpb25zKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoJ2cnKS5hdHRyKCdjbGFzcycsICdub2RlJylcbiAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIHZhciBwcm9qX3BvcyA9IHByb2ooW2QubG9uLCBkLmxhdF0pO1xuICAgICAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoJyArIHByb2pfcG9zWzBdICsgJywnICsgcHJval9wb3NbMV0gKyAnKSc7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKCdzdHlsZScsICdjdXJzb3I6IHBvaW50ZXInKVxuICAgICAgICAuYXR0cihcImRcIiwgcGF0aClcbiAgICAgICAgLm9uKCdtb3VzZW92ZXInLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBpbmZvVG9vbHRpcC5odG1sKFwiPGRpdiBjbGFzcz0naW5mb1Rvb2x0aXBfX3RpdGxlJz5cIitkLm5hbWUrXCI8L2Rpdj48aW1nIHNyYz0naW1nL2Rpc3QvXCIrZC5pbWcrXCInIGFsdD0nJyBjbGFzcz0naW5mb1Rvb2x0aXBfX2ltZyc+XCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwibGVmdFwiLCAoZDMuZXZlbnQucGFnZVggLSAxMTApICsgXCJweFwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcInRvcFwiLCAoZDMuZXZlbnQucGFnZVkgLSAxMDApICsgXCJweFwiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcImRpc3BsYXlcIiwgXCJibG9ja1wiKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcIm9wYWNpdHlcIiwgMSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIGluZm9Ub29sdGlwLnN0eWxlKFwib3BhY2l0eVwiLCAwKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuICAgICAgICB9KVxuICAgICAgICAub24oXCJtb3VzZW1vdmVcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgaW5mb1Rvb2x0aXAuc3R5bGUoXCJsZWZ0XCIsIChkMy5ldmVudC5wYWdlWCAtIDExMCkgKyBcInB4XCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwidG9wXCIsIChkMy5ldmVudC5wYWdlWSAtIDEwMCkgKyBcInB4XCIpO1xuICAgICAgICB9KVxuICAgICAgICAub24oXCJjbGlja1wiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICB2YXIgbW9kYWxJbmZvX190aXRsZSA9IGQzLnNlbGVjdChcImRpdi5tb2RhbEluZm9fX3RpdGxlXCIpO1xuICAgICAgICAgICAgdmFyIG1vZGFsSW5mb19fdmlkZW8gPSBkMy5zZWxlY3QoXCJkaXYubW9kYWxJbmZvX192aWRlby0tY29ubmVjdGVkXCIpO1xuICAgICAgICAgICAgbW9kYWxJbmZvX190aXRsZS5odG1sKGQubmFtZSk7XG4gICAgICAgICAgICBtb2RhbEluZm9fX3ZpZGVvLmh0bWwoXCI8aWZyYW1lIHdpZHRoPSc1NjAnIGhlaWdodD0nMzE1JyBzcmM9J2h0dHBzOi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkL1wiK2QudG9rZW4rXCInIGZyYW1lYm9yZGVyPScwJyBhbGxvd2Z1bGxzY3JlZW4+PC9pZnJhbWU+XCIpO1xuICAgICAgICAgICAgbW9kYWxJbmZvLnN0eWxlKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpO1xuICAgICAgICB9KTtcblxuICAgIG5vZGVzLmFwcGVuZChcInN2ZzppbWFnZVwiKVxuICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgtMjQsIC0yMCknKVxuICAgICAgICAuYXR0cignd2lkdGgnLCAyMClcbiAgICAgICAgLmF0dHIoJ2hlaWdodCcsIDI0KVxuICAgICAgICAuY2xhc3NlZCgnd2hpdGUnLHRydWUpXG4gICAgICAgIC5hdHRyKFwiaHJlZlwiLFwiLi4vaW1hZ2VzL21hcmtlci5zdmdcIik7XG59XG4iLCIkKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcbiAgICAkKCcjY29ubmVjdEZvcm0nKS5vbignc3VibWl0JywgZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XG4gICAgICAgIHZhciBwc2V1ZG8gPSAkKCcjcHNldWRvJykudmFsKCk7XG4gICAgICAgIHZhciBwYXNzd29yZCA9ICQoJyNwYXNzd29yZCcpLnZhbCgpO1xuXG4gICAgICAgIGlmKHBzZXVkbyAhPT0gJycgJiYgcGFzc3dvcmQgIT09ICcnKSB7XG4gICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgIHVybDogJHRoaXMuYXR0cignQ29udHJvbGxlcnMvY29ubmV4aW9uLnBocCcpLFxuICAgICAgICAgICAgICAgIHR5cGU6ICR0aGlzLmF0dHIoJ3Bvc3QnKSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkdGhpcy5zZXJpYWxpemUoKSxcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihodG1sKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGh0bWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG59KTsiXX0=
