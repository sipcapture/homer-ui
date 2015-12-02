<?php

if(!defined('HOMER_CONFIGURATION')):
define('HOMER_CONFIGURATION', 1);

/*********************************************************************************/
/* AUTH DB homer. User and Configuration */
define('DB_HOSTNAME', "127.0.0.1");
define('DB_PORT', 3306);
define('DB_USERNAME', "root");
define('DB_PASSWORD', "Aithiew8");
define('DB_CONFIGURATION', "h5_homer_configuration");
define('DB_STATISTIC', "h5_homer_statistic");
define('DB_HOMER', "h5_homer_data");
define('SINGLE_NODE', 1);

/*********************************************************************************/

/* webHomer Settings 
*  Adjust to reflect your system preferences
*/

define('PCAPDIR', ROOT."/tmp/");
define('WEBPCAPLOC',"/tmp/");

/* INCLUDE preferences */

include_once("preferences.php");

endif;

?>
