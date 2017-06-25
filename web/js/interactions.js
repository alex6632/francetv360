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