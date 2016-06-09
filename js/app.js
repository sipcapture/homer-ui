/*
 * HOMER 5 UI (Xenophon)
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

(function (angular, homer) {
    'use strict';

    defineHomerAngularModule(homer.modules.app.name, [
        'adf',
        'ui.router',
        'ui.bootstrap',                
        'ui.grid',
        'ui.grid.resizeColumns',
        'ui.grid.autoResize',
        'ui.grid.pagination',
        'ui.grid.selection',
        'ui.grid.saveState',
        'ui.grid.cellNav', 
        'ui.grid.resizeColumns', 
        'ui.grid.moveColumns', 
        'ui.grid.pinning', 
        'ui.grid.grouping',
        'ui.grid.exporter',
        'oitozero.ngSweetAlert',
        'ngAnimate',
        'ngCookies',
        'inputDropdown',
        'LocalStorageModule',
        'ngSanitize',
        'dialogs.main',
        'angularFileUpload',
        'homer.modal',
        'homer.cflow',        
        homer.modules.core.name,
        homer.modules.structures.name,
        homer.modules.auth.name,
        homer.modules.admin.name,
        homer.modules.pages.name,
        'adf.widgets.markdown', 
        'adf.widgets.news', 
        'adf.widgets.linklist', 
        'homer.widget.clock',
        'homer.widgets.quicksearch', 
      //  'homer.widgets.ripesearch', 
      //  'homer.widgets.ripewhois', 
        'homer.widgets.adminuser',
        'homer.widgets.adminalias',
        'homer.widgets.adminnode',
        'homer.widgets.alarm',
        'homer.widgets.alarmlist',
        'homer.widgets.sipcapture', 
        'homer.widgets.querycap', 
        'homer.widgets.geochart', 
     //   'homer.widgets.elasticap', 
        'homer.widgets.elasticaggs', 
        'homer.widgets.randommsg'              
    ]);        
    
}(angular, homer));


String.prototype.hashCode = function() {
  var hash = 0, i, chr, len;
  if (this.length == 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; 
  }
  return hash;
};

//console.log(mermaid);

var DEBUG = true;

if(!DEBUG){
    if(!window.console) window.console = {};
    var methods = ["log", "debug", "warn", "info"];
    for(var i=0;i<methods.length;i++){
    console[methods[i]] = function(){};
    }
};

