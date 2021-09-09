Strings for translation are separated semantically. It is important that structure for everything stays the same.
There's also an object called `LINK` which can be referenced from inside of other strings by writing `@LINK.propertyName@`. 
I.E. 

    LINK: {
    	"dashboard" = "Dashboard"
    }

This two strings

    "createNewDashboard": "Create New @LINK.dashboard@",
    "dashboardShared": "@LINK.dashboard@ shared",

Will be displayed as

    Create New Dashboard
and 

	Dashboard shared
Also you can add `.toLowerCase()` and `.toUpperCase()` to those `@LINK.propertyName@` references to format something

    "selectDashboard": "Select @LINK.dashboard.toLowerCase()@",
will be displayed as  `Select dashboard` instead of `Select Dashboard` if it was without `.toLowerCase()`.
With  `.toUpperCase()`  result would've been `Select DASHBOARD`.

You can freely add new properties to `LINK` if you need to be able to reuse same word or sentence in multiple places.

String can be provided with variable in form of `{{ variable }}` in that case it can receive data from Angular to show dynamic data. 
I.E. 

    "{{message}} {{page}} data"

    {{ 'preference.deleteDialog.title' | translate: {
	    'message': 'Delete',
	    'page': 'user'
    }
    }}
Will be displayed as `Delete user data`
