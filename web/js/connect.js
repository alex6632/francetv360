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