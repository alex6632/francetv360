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