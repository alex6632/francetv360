<script
    src="https://code.jquery.com/jquery-3.2.1.min.js"
    integrity="sha256-hwg4gsxgFZhOsEEamdOYGBf13FyQuiTwlAQgxVSNgt4="
    crossorigin="anonymous"></script>

<!--<script src="app/js/offline/jquery-3.2.1.min.js"></script>-->
<!--<script src="app/js/offline/d3.min.js"></script>-->
<!--<script src="app/js/offline/topojson.min.js"></script>-->
<!--<script src="app/js/offline/queue.min.js"></script>-->
<!--<script src="app/js/offline/typed.min.js"></script>-->

<?php if($template == 'home') { ?>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/0.98.2/js/materialize.min.js"></script>
    <script src="app/js/home.js"></script>
<?php } else { ?>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/typed.js/1.1.7/typed.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ion-rangeslider/2.1.8/js/ion.rangeSlider.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/malihu-custom-scrollbar-plugin/3.1.5/jquery.mCustomScrollbar.concat.min.js"></script>
    <script src="http://d3js.org/d3.v3.min.js"></script>
    <script src="http://d3js.org/topojson.v1.min.js"></script>
    <script src="http://d3js.org/queue.v1.min.js"></script>
<?php } ?>
<?php if($template == 'didacticiel') { ?>
    <script src="app/js/app-didac.js"></script>
<?php } else if($template == 'map') { ?>
    <script src="app/js/app.js"></script>
<?php } ?>
</body>
</html>