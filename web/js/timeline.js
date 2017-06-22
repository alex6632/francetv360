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