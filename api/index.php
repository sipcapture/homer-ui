<?php

/*
 * HOMER API Engine
 *
 * Copyright (C) 2011-2015 Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Copyright (C) 2011-2015 Lorenzo Mangani <lorenzo.mangani@gmail.com> QXIP B.V.
 *
 * The Initial Developers of the Original Code are
 *
 * Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Lorenzo Mangani <lorenzo.mangani@gmail.com> QXIP B.V.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
*/


define('ROOT', realpath(dirname(__FILE__) . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR));
define('_HOMEREXEC', "1");

require_once("configuration.php");

date_default_timezone_set(HOMER_TIMEZONE);
ini_set('date.timezone', HOMER_TIMEZONE);

/* if defined session_name, set this */
if(defined('SESSION_NAME')) session_name(SESSION_NAME);
session_start();

include "autoload.php";

use RestService\Server;

define('WEBROOT', preg_replace('/api(.*)$/', '', $_SERVER["REQUEST_URI"]));

Server::create(WEBROOT.'api/v1', 'RestApi\Auth') //base entry points `/admin`

    ->setDebugMode(false) //prints the debug trace, line number and file if a exception has been thrown.
    ->addGetRoute('session', 'getSession') // => /api/session
    ->addGetRoute('test', 'getTestAPI') // => /api/test
    ->addPostRoute('session', 'doSession') // => /api/session
    ->addDeleteRoute('session', 'doLogout') // => /admin/logout
    ->addGetRoute('logout', 'doLogout') // => /admin/logout
    
    ->addSubController('search', 'RestApi\Search') //adds a new sub entry point 'tools' => admin/tools
      ->addPostRoute('data', 'doSearchData') // => /api/session
      ->addPostRoute('method', 'doSearchMethod') // => /api/session
      ->addPostRoute('message', 'doSearchMessage') // => /api/session
      ->addPostRoute('transaction', 'doSearchTransaction') // => /api/session
      ->addPostRoute('sharelink', 'doShareLink') // => /api/session
      ->addPostRoute('share/transaction', 'doSearchShareTransaction') // => /api/session
      ->addPostRoute('share/export/pcap', 'doPcapExportById') // => /api/session
      ->addPostRoute('share/export/text', 'doTextExportById') // => /api/session
      ->addPostRoute('export/pcap', 'doPcapExport') // => /api/session
      ->addPostRoute('export/text', 'doTextExport') // => /api/session
      ->addPostRoute('export/data/pcap', 'doPcapExportData') // => /api/session
      ->addPostRoute('export/data/text', 'doTextExportData') // => /api/session      
      ->addGetRoute('data', 'getSearchData') // => /api/session
    ->done()

    /* statistic */    
    ->addSubController('statistic', 'RestApi\Statistic') //adds a new sub entry point 'tools' => admin/tools
      ->addGetRoute('method', 'getStatisticMethod') // => /api/session
      ->addPostRoute('method', 'doStatisticMethod') // => /api/session
      ->addPostRoute('data', 'doStatisticData') // => /api/session
      ->addGetRoute('data', 'getStatisticData') // => /api/session
      ->addPostRoute('ip', 'doStatisticIP') // => /api/session
      ->addGetRoute('ip', 'getStatisticIP') // => /api/session
      ->addPostRoute('useragent', 'doStatisticUserAgent') // => /api/session
      ->addGetRoute('useragent', 'getStatisticUserAgent') // => /api/session
    ->done()

    /* alarm */    
    ->addSubController('alarm', 'RestApi\Alarm') //adds a new sub entry point 'tools' => admin/tools
      ->addGetRoute('config/get', 'getAlarmConfig') // => /api/session
      ->addPostRoute('config/new', 'doNewAlarmConfig') // => /api/session
      ->addPostRoute('config/edit', 'doEditAlarmConfig') // => /api/session
      ->addDeleteRoute('config/delete/([0-9]+)', 'deleteAlarmConfig')      
      ->addGetRoute('list/get', 'getAlarmList') // => /api/session      
      ->addPostRoute('list/edit', 'doEditAlarmList') // => /api/session      
      ->addGetRoute('method', 'getAlarmMethod') // => /api/session
      ->addPostRoute('method', 'doAlarmMethod') // => /api/session
      ->addPostRoute('ip', 'doAlarmIP') // => /api/session
      ->addGetRoute('ip', 'getAlarmIP') // => /api/session
      ->addPostRoute('useragent', 'doAlarmUserAgent') // => /api/session
      ->addGetRoute('useragent', 'getAlarmUserAgent') // => /api/session
    ->done()

     /* report */
    ->addSubController('report', 'RestApi\Report') //adds a new sub entry point 'tools' => admin/tools
      ->addPostRoute('rtcp', 'doRTCPReport') // => /api/session
      ->addPostRoute('log', 'doLogReport') // => /api/session
      ->addPostRoute('share/log', 'doLogReportById') // => /api/report/share/log
      ->addPostRoute('share/rtcp', 'doRTCPReportById') // => /api/report/share/log
      ->addPostRoute('share/quality/short', 'doQualityReportById') // => /api/report/share/log
      ->addPostRoute('quality/([A-Za-z]+)', 'doQualityReport') // => /api/session
    ->done()


    /* admin */    
    ->addSubController('admin', 'RestApi\Admin') //adds a new sub entry point 'tools' => admin/tools
      ->addGetRoute('user/get', 'getUser') // => /api/session
      ->addGetRoute('user/get/([0-9A-Za-z_])', 'getUserById') // => /api/session
      ->addPostRoute('user/new', 'doNewUser') // => /api/session
      ->addPostRoute('user/edit', 'doEditUser') // => /api/session
      ->addDeleteRoute('user/delete/([0-9]+)', 'deleteUser')      

      /* alias */          
      ->addGetRoute('alias/get', 'getAlias') // => /api/session
      ->addGetRoute('user/get/([0-9A-Za-z_])', 'getAliasById') // => /api/session
      ->addPostRoute('alias/new', 'doNewAlias') // => /api/session
      ->addPostRoute('alias/edit', 'doEditAlias') // => /api/session
      ->addDeleteRoute('alias/delete/([0-9]+)', 'deleteAlias')          
      /* nodes */
      ->addGetRoute('node/get', 'getNode') // => /api/session
      ->addGetRoute('node/get/([0-9A-Za-z_])', 'getNodeById') // => /api/session
      ->addPostRoute('node/new', 'doNewNode') // => /api/session
      ->addPostRoute('node/edit', 'doEditNode') // => /api/session
      ->addDeleteRoute('node/delete/([0-9]+)', 'deleteNode')                
      /* alarms */
      ->addGetRoute('useragent', 'getAlarmUserAgent') // => /api/session
    ->done()

         
    ->addSubController('profile', 'RestApi\Profile') //adds a new sub entry point 'tools' => admin/tools
      ->addPostRoute('store/([0-9A-Za-z_-]+)', 'postIdProfile')
      ->addPostRoute('store', 'postProfile')
      ->addGetRoute('store/([0-9A-Za-z_-]+)', 'getIdProfile')      
      ->addGetRoute('store', 'getProfile')
      ->addDeleteRoute('store/([0-9A-Z_-]+)', 'deleteIdProfile')      
      ->addDeleteRoute('store', 'deleteProfile')
    ->done()
    
    ->addSubController('dashboard', 'RestApi\Dashboard') //adds a new sub entry point 'tools' => admin/tools
      ->addPostRoute('store/([0-9A-Z_-]+)', 'postIdDashboard')
      ->addPostRoute('store', 'postDashboard')
      ->addPostRoute('upload', 'uploadDashboard')
      ->addGetRoute('store/1', 'newDashboard')      
      ->addPostRoute('menu/([0-9A-Z_-]+)', 'postMenuDashboard')
      ->addGetRoute('node', 'getNode')
      ->addGetRoute('store/([0-9A-Za-z_-]+)', 'getIdDashboard')      
      ->addGetRoute('store', 'getDashboard')
      ->addDeleteRoute('store/([0-9A-Z_-]+)', 'deleteIdDashboard')      
      ->addDeleteRoute('store', 'deleteDashboard')
    ->done()
    
->run();

?>
