<?php
$switch = isset($_POST['switch']);
echo 'theme controller ='.$switch.'<br>';

if($switch == 1) {
    $theme = 'day';
    header('Location: ?t=day&p=map');
} else {
    $theme = '';
    header('Location: ?p=map');
}