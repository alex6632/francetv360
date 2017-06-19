<?php



/**
 * Utilisateur
 */
class Utilisateur
{
    /**
     * @var integer
     */
    private $idUtilisateur;

    /**
     * @var string
     */
    private $login;

    /**
     * @var string
     */
    private $password;


    /**
     * Get idUtilisateur
     *
     * @return integer
     */
    public function getIdUtilisateur()
    {
        return $this->idUtilisateur;
    }

    /**
     * Set login
     *
     * @param string $login
     *
     * @return Utilisateur
     */
    public function setLogin($login)
    {
        $this->login = $login;

        return $this;
    }

    /**
     * Get login
     *
     * @return string
     */
    public function getLogin()
    {
        return $this->login;
    }

    /**
     * Set password
     *
     * @param string $password
     *
     * @return Utilisateur
     */
    public function setPassword($password)
    {
        $this->password = $password;

        return $this;
    }

    /**
     * Get password
     *
     * @return string
     */
    public function getPassword()
    {
        return $this->password;
    }
}

