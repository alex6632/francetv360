<?php
/*
 * User Login action
 */

function loginAction() {
    global $template;
    global $errors;
    include 'bootstrap.php';

    $credentials = getPost();
    $errors = checkLoginErrors($credentials);
    // If input are empty...
    if (!empty($errors)) {
        $template = 'login';
    } else {
        // Check if login and password are correct...
        $user = $entityManager->getRepository('\Utilisateur')->userAuthAdminModel($credentials['pseudo'], $credentials['pass']);
        if (!$user) {
            $template = 'map';
        } else {
            $_SESSION['is-connected'] = true;
            $_SESSION['id'] = $user->getIdUtilisateur();
            $_SESSION['login'] = $user->getLogin();
            $_SESSION['access'] = $user->getAccess();
            $template = 'map';
        }
    }
}

/*
 *  Check if input are not empty...
 */
function checkLoginErrors($credentials) {
    global $errors;
    $errors = [];

    if (!isset($credentials['pseudo']) || empty($credentials['pseudo'])) {
        $errors['pseudo'] = 'Le nom d\'utilisateur est obligatoire';
    }
    if (!isset($credentials['pass']) || empty($credentials['pass'])) {
        $errors['pass'] = 'Le mot de passe est obligatoire';
    }
    return $errors;
}

loginAction();