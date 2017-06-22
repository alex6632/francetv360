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