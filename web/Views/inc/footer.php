<footer class="footer-map">
    <!-- Social block -->
    <div class="network">
        <a href="#fb" class="network__link"><img src="images/facebook.png" alt=""></a>
        <a href="#tw" class="network__link"><img src="images/twitter.png" alt=""></a>
        <a href="#yt" class="network__link"><img src="images/youtube.png" alt=""></a>
    </div>
    <!-- Timeline block -->
    <?php if($template == 'map') { ?>
        <div class="timeline">
            <div class="live">Live <span></span></div>
            <input type="text" id="timeline-custom" name="example_name" value="" />
        </div>
    <?php } ?>
    <!-- France•tv link -->
    <div class="footer-map__right">
        <a href="https://www.france.tv/" target="_blank" class="logo"><img src="images/francetv.png" alt=""></a>
    </div>
</footer>