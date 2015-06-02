/*
 * HOMER 5 UI (Xenophon)
 *
 * Copyright (C) 2011-2015 Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Copyright (C) 2011-2015 Lorenzo Mangani <lorenzo.mangani@gmail.com> QXIP B.V.
 * License AGPL-3.0 http://opensource.org/licenses/AGPL-3.0
 *
*/

'use strict';

angular.module('homer.widgets.randommsg', ['adf.provider'])
  .config(function(dashboardProvider){
    dashboardProvider
      .widget('randommsg', {
        title: 'Random Method',
        description: 'Display a random SIP Method definition and RFC',
        templateUrl: 'js/widgets/randommsg/randommsg.html',
        controller: 'randommsgCtrl',
	reload: true
      });
  })
  .service('randommsgService', function(){
    // source http://bookriot.com/2012/05/25/the-42-best-lines-from-douglas-adams-the-hitchhikers-guide-to-the-galaxy-series/
    var msgs = [
	'INVITE: Indicates a client is being invited to participate in a call session.',
	'ACK: Confirms that the client has received a final response to an INVITE request.',
	'BYE: Terminates a call and can be sent by either the caller or the callee.',
	'CANCEL: Cancels any pending request.',
	'OPTIONS: Queries the capabilities of servers.',
	'REGISTER: Registers the address listed in the To header field with a SIP server.',
	'PRACK: Provisional acknowledgement.',
	'SUBSCRIBE: Subscribes for an Event of Notification from the Notifier.',
	'NOTIFY: Notify the subscriber of a new Event.',
	'PUBLISH: Publishes an event to the Server.',
	'INFO: Sends mid-session information that does not modify the session state.',
	'REFER: Asks recipient to issue SIP request (call transfer.)',
	'MESSAGE: Transports instant messages using SIP.',
	'UPDATE: Modifies the state of a session without changing the state of the dialog.'
    ];
    var rfcs= [
	'RFC3261',
	'RFC3261',
	'RFC3261',
	'RFC3261',
	'RFC3261',
	'RFC3261',
	'RFC3262',
	'RFC6665',
	'RFC6665',
	'RFC3903',
	'RFC6086',
	'RFC3515',
	'RFC3428',
	'RFC3311'
    ];
    
    return {
      get: function(){
        var pick = Math.floor(Math.random() * msgs.length);
        return {
          text2: msgs[Math.floor(Math.random() * msgs.length)],
          text: msgs[pick],
          author: rfcs[pick]
        };
      }
    };
  })
  .controller('randommsgCtrl', function($scope, randommsgService){
    $scope.msg = randommsgService.get();
  });
