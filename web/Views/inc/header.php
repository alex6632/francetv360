<header class="header-map">
    <a href="/?p=map" class="logo"><img src="images/logo.png" alt=""></a>
    <div class="toolbar-header">
<!--        <div class="icon-play jsPlayRotateGlobe"><img src="images/play.svg" alt=""></div>-->
        <?php if($template == 'map') { ?>
            <form action="?p=theme&c=general" method="post" id="jsSwitchForm">
                <div class="switch">
                    <input type="checkbox" id="switch" name="switch" <?php if($theme == 'day') { echo 'checked="checked"'; } ?>><label for="switch">&nbsp;</label>
                    <input type="submit" class="switch__submit">
                </div>
            </form>
            <div class="icon-search jsOpenSearch"><img src="images/search.png" alt=""></div>
            <div class="icon-help">
            <?php
                if($theme == 'day') {
                    echo '<a href="?t=day&p=didacticiel"><img src="images/help.png" alt=""></a>';
                } else {
                    echo '<a href="?p=didacticiel"><img src="images/help.png" alt=""></a>';
                }
            ?>
            </div>
            <div class="icon-profile"><img src="images/profile.jpg" alt=""></div>
        <?php } ?>
    </div>
</header>