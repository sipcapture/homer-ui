<?php

define('CONFIG_VERSION', "2.0.1"); /* Please ALWAYS include CONFIGVERSION */
define('WEBHOMER_VERSION', "5.0.1"); /* WEBHOMER VERSION */
define('HOMER_TIMEZONE', "Europe/Amsterdam"); /* Set a global application default timezone */

/* CFLOW Options */
define('CFLOW_HPORT', 2); /* Column/Host Mode = Plain: 0, +Port: 1, Auto-Select: 2 */
define('CFLOW_EPORT', 0); /* Enable Ephemeral port detection, experimental */
define('MESSAGE_POPUP',1); /* Modal type: 1, Browser popup: 2 */

/* Search Results Options */
define('RESULTS_ORDER', "asc"); 
define('AUTOCOMPLETE', 0);  /* Enables autocomplete in FROM & TO fiels- WARNING: db intensive */
define('FORMAT_DATE_RESULT', "H:i:s"); /* Controls the Date/Time output in search results, ie: "m-d H:i:s"  */

/* BLEG DETECTION */
define('BLEGDETECT', 1); /* always detect BLEG leg in CFLOW/PCAP*/
define('BLEGCID', "b2b"); /* options: x-cid, b2b */
define('BLEGTAIL', "_b2b-1"); /* session-ID correlation suffix, required for b2b mode */

/* Database: mysql */
define('DATABASE_DRIVER',"mysql");

/* AUTH: CLASS NAME. i.e. Internal  */
define('AUTHENTICATION',"Internal");
// define('AUTHENTICATION_TEXT',"Please login with your credentials");

/* ALARM MAIL */
define('ALARM_FROMEMAIL',"homer@example.com");
define('ALARM_TOEMAIL',"admin@example.com");

/* configuration check */
define('NOCHECK', 0); /* set to 1, dont check config */

/* ACCESS LEVEL 3 - Users, 2 - Manager, 1 - Admin, 0 - nobody */
define('ACCESS_DASHBOARD', 3); /* ALARM FOR ALL:*/
define('ACCESS_ALARM', 3); /* ALARM FOR ALL:*/
define('ACCESS_SEARCH', 3); /* SEARCH FOR ALL:*/
define('ACCESS_TOOLBOX', 1); /* TOLBOX FOR ADMIN */
define('ACCESS_STATS', 3); /* STATS FOR ALL */
define('ACCESS_ADMIN', 1); /* ADMIN FOR ADMIN */
define('ACCESS_ACCOUNT', 3); /* ACCOUNT FOR ALL:*/

/* LOGGING. to enable set bigger as 0, if 10 == 10 days keep logs */
define('SEARCHLOG', 0);

/*DEFAULT SELECTED DB NODE */
define('DEFAULTDBNODE',1);
  
define('SESSION_NAME',"HOMERSESSID"); /* session ID name. */

/* SQL SCHEMA VERSION */
define('SQL_SCHEMA_VERSION', 5); /* SQL SCHEMA VERSION. Default 5 */

/* database connector Class */
define('DATABASE_CONNECTOR', "PDOConnector");

/* fields */
define('FIELDS_CAPTURE', "id, date, (micro_ts DIV 1000) as milli_ts, micro_ts,method,reply_reason,ruri,ruri_user,ruri_domain,from_user,from_domain,from_tag,
to_user,to_domain,to_tag,pid_user,contact_user,auth_user,callid,callid_aleg,via_1,via_1_branch,cseq,diversion,reason,content_type,auth,
user_agent,source_ip,source_port,destination_ip,destination_port,contact_ip,contact_port,originator_ip,originator_port,correlation_id,proto,family,rtp_stat,type,node");

/* can be file or db */
define('PROFILE_STORE','db');
define('PROFILE_PARAM', ROOT.'/store/profile');

/* can be file or db */
define('DASHBOARD_STORE','db');
define('DASHBOARD_PARAM', ROOT.'/store/dashboard');

/* PUBLIC HOST FOR SHARE */
define('PUBLIC_SHARE_HOST',"http://h5.sipcapture.io/share/");

/* LDAP SETTINGS */

/*
define('LDAP_HOST',"localhost");
define('LDAP_PORT',NULL);
define('LDAP_BASEDN',"dc=example,dc=com");
define('LDAP_REALM',"My Realm");
define('LDAP_USERNAME_ATTRIBUTE_OPEN',"uid=");
define('LDAP_USERNAME_ATTRIBUTE_CLOSE',"");
define('LDAP_USERLEVEL',3); 
*/

?>
