/*
 * HOMER 5 UI (Xenophon)
 *
 * Copyright (C) 2011-2015 Alexandr Dubovikov <alexandr.dubovikov@gmail.com>
 * Copyright (C) 2011-2015 Lorenzo Mangani <lorenzo.mangani@gmail.com> QXIP B.V.
 * License AGPL-3.0 http://opensource.org/licenses/AGPL-3.0
 *
*/

(function (angular, homer) {

	'use strict';

	homer.modules.structures = {
		name: 'structures'
	};

	angular.module(homer.modules.structures.name, ['adf'])
		.config(function(dashboardProvider){

		dashboardProvider
		    .structure('12', {
		      	rows: [{
        		  columns: [{
		          	styleClass: 'col-md-12'
			     }]
		          }]
		    })	
		    .structure('6-6', {
		      	rows: [{
        		  columns: [{
		          	styleClass: 'col-md-6'
			  }, {
        		  	styleClass: 'col-md-6'
			     }]
		          }]
		    })	
		    .structure('4-4-4', {
		      	rows: [{
        		  columns: [{
		          	styleClass: 'col-md-4'
			  }, {
        		  	styleClass: 'col-md-4'
			  }, {
        		  	styleClass: 'col-md-4'
			     }]
		          }]
		    })	
		    .structure('4-8', {
			rows: [{
			  columns: [{
					styleClass: 'col-md-4',
					widgets: []
				}, {
					styleClass: 'col-md-8',
					widgets: []
				}]
			  }]
		    })
		    .structure('12/4-4-4', {
			rows: [{
				columns: [{
					styleClass: 'col-md-12'
				 	}]
				}, {
				  columns: [{
					styleClass: 'col-md-4'
				  }, {
					styleClass: 'col-md-4'
				  }, {
					styleClass: 'col-md-4'
				  }]
				}]
			 })
		   .structure('12/6-6', {
			rows: [{
					columns: [{
						styleClass: 'col-md-12'
					}]
				}, {
					columns: [{
						styleClass: 'col-md-6'
					}, {
					          styleClass: 'col-md-6'
					}]
				}]
		   })
		   .structure('12/6-6/12', {
			rows: [{
				columns: [{
					styleClass: 'col-md-12'
					}]
				}, {
				columns: [{
			        	  styleClass: 'col-md-6'
				        }, {
				          styleClass: 'col-md-6'
				        }]
				}, {
			        columns: [{
				          styleClass: 'col-md-12'
			        }]
			}]
		   });
	});

}(angular, homer));
