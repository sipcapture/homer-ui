include config/utility.am
include config/project.am


@PACKAGE@_wwwdata = \
	COPYING \
	css \
	fonts \
	img \
	index.html \
	js \
	lib \
	share \
	store \
	templates

@PACKAGE@_EXTRA_DIST = $(@PACKAGE@_wwwdata) \
	pkg \
	README.md

@PACKAGE@datadir = /var/www/sipcapture/htdocs

install-data-local:
	mkdir -p $(DESTDIR)/var/www/sipcapture/htdocs
	cp -r $(@PACKAGE@_wwwdata) $(DESTDIR)/var/www/sipcapture/htdocs/
