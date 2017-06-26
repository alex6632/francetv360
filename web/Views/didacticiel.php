<div class="main-page">

    <div class="container mg-top">
        <?php include_once 'inc/header.php'; ?>
    </div>

    <div class="didacticiel">
        <div class="didacticiel__prev disabled"></div>
        <div class="didacticiel__next"></div>

        <div class="didacticiel__inner didacticiel__inner--p1">
            <h1>Ne cherchez plus, <span>explorez !</span></h1>

            <ul class="didacticiel__inner__list">
                <li class="didacticiel__inner__list__item">
                    <img src="images/globe.png" alt=""><span>Explorez en 3d</span>
                </li>
                <li class="didacticiel__inner__list__item">
                    <img src="images/time.png" alt=""><span>Parcourez le temps</span>
                </li>
            </ul>

            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam eget condimentum erat, nec auctor orci donec.</p>
        </div>

        <div class="didacticiel__inner didacticiel__inner--p2">
            <h1>Ne cherchez plus, <span>explorez !</span></h1>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam eget condimentum erat, nec auctor orci donec.</p>

            <div class="didacticiel__inner__cta">
                <a href="#signin" class="btn btn--signin"><div class="line"></div>S'inscrire</a>
                <?php
                    if($theme == 'day') {
                        echo '<a href="?t=day&p=map" class="btn"><div class="line"></div>Continuer sans s\'inscrire</a>';
                    } else {
                        echo '<a href="?p=map" class="btn"><div class="line"></div>Continuer sans s\'inscrire</a>';
                    }
                ?>

            </div>
        </div>

    </div>

    <div class="container">
        <?php include_once 'inc/footer.php'; ?>
    </div>

    <div class="home-map didac"></div>

</div> <!-- /.main-page -->