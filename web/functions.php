<?php

/*
 * This function permits to execute a query to the db
 */
function execute_query($query) {
    global $link;
    $result = mysqli_query($link, $query);
    if(!$result) {
        die('<br>Erreur de connexion (' . mysqli_errno($link) . ') ' . mysqli_error($link));
    }
    return $result;
}

/*
 * This function permits to retrieve the results from the db
 */
function my_fetch_all($query) {
    $result = execute_query($query);
    $data = mysqli_fetch_all($result, MYSQLI_ASSOC);
    return $data;
}

/*
 * This function try to stop SQL injection
 */
function escape($data) {
    global $link;

    return mysqli_escape_string($link, $data);
}

/*
 * This function permits to get the credentials send by the post form at signUp page
 */
function getPost() {
    $credentials = [];
    foreach ($_POST as $k => $v) {
        $credentials[$k] = $v;
        //echo $v."<br>";
    }
    //die();
    return ($credentials);
}

/*
 * This function permits to send mail to the admin
 * to ask a user to become blogger (from signUp or Profile Page)
 */
function sendMailAskBlogger($credentials) {
    $message = '<body style="margin: 0; padding: 0;">
        <h2 style="font-family: sans-serif; text-align: center; margin: 0; padding: 0;">Vous avez recu une nouvelle notification d\'ajout</h2>
        <p style="font-family: sans-serif; ">'.$credentials['email'].' souhaite être ajouté au groupe d\'utilisateur BLOGGER.</p>
      </body>';

    $subject = "Demande d'ajout de ".$credentials['email']." pour devenir blogger";
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "content-type:text/html; charset=UTF-8" . "\r\n";

    // TODO mettre en conf les Admin, itérer sur l'array d'admin
    mail('a.simonin69@gmail.com', $subject, $message, $headers);
    mail('kevin.loiseleur@gmail.com', $subject, $message, $headers);
}

/*
 * This function send a verification email
 */
//TODO : Verification view + good link, set the confirmation for the user 0 to 1.
function sendMailSignUp($credentials) {
    $message = '<body style="margin: 0; padding: 0;">
        <h2 style="font-family: sans-serif; text-align: center; margin: 0; padding: 0;">Merci pour votre inscription '.$credentials['email'].'sur Wesh Blog ! </h2>
        <p style="font-family: sans-serif; ">Pour valider votre inscription, veuillez suivre ce lien : <a href="http://alexandre-simonin.fr?action=validation&controler=user&email='.$credentials['email'].'">Valider mon compte</a></p>
      </body>';

    $subject = "Valider votre inscription sur Wesh Blog";
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "content-type:text/html; charset=UTF-8" . "\r\n";

    mail($credentials['email'], $subject, $message, $headers);
}