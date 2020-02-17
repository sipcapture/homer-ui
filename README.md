<img src="https://user-images.githubusercontent.com/1423657/55069501-8348c400-5084-11e9-9931-fefe0f9874a7.png" width=200/>

# HOMER User-Interface

This project provides the Front-End components of [HOMER 7.x](https://github.com/sipcapture) and higher, featuring native integration with all 
supported backend components for search and analytics including `pgsql`, `influxdb`, `prometheus`, `loki` and more.

HOMER-UI is designed to be bundled and served with the [homer-app](https://github.com/sipcapture/homer-app) project


<img src="https://i.imgur.com/Yv9e9OL.gif"/>

## Status
This project is still in Development. Please open well documented issues to report bugs or inconsistencies.

## Developers Guide
### Installation
```
npm install
npm install -g @angular/cli
npm run build
```

### Usage
#### PM2
```
pm2 start
```

#### Stand-Alone
```
ng serve --open --host 0.0.0.0 --port 8080 --source-map=false --vendorChunk=false --aot=true --disableHostCheck
```

----------------

### Support
For professional support, remote installations, customizations or commercial requests please contact: support@sipcapture.org

For community support, updates, user discussion and experience exchange please join our users   [Mailing-List](https://groups.google.com/forum/#!forum/homer-discuss)

For commercial licensing and support, please contact the [QXIP Team](http://qxip.net)

<img src="http://i.imgur.com/9AN08au.gif" width=100% height=50 >



### Developers
Contributors and Contributions to our project are always welcome! If you intend to participate and help us improve HOMER by sending patches, we kindly ask you to sign a standard [CLA (Contributor License Agreement)](http://cla.qxip.net) which enables us to distribute your code alongside the project without restrictions present or future. It doesn’t require you to assign to us any copyright you have, the ownership of which remains in full with you. Developers can coordinate with the existing team via the [homer-dev](http://groups.google.com/group/homer-dev) mailing list. If you'd like to join our internal team and volunteer to help with the project's many needs, feel free to contact us anytime!


### License & Copyright

![H5](https://img.shields.io/badge/license-GNU_AGPL_v3-blue.svg)

Homer components are released under the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

*(C) 2008-2020 [QXIP BV](http://qxip.net)*

----------

#### Made by Humans
This Open-Source project is made possible by actual Humans without corporate sponsors, angels or patreons.<br>
If you use this software in production, please consider supporting its development with contributions or [donations](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=donation%40sipcapture%2eorg&lc=US&item_name=SIPCAPTURE&no_note=0&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHostedGuest)

[![Donate](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=donation%40sipcapture%2eorg&lc=US&item_name=SIPCAPTURE&no_note=0&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHostedGuest) 

