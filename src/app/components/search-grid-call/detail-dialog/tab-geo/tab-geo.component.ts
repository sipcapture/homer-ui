import {
    Component,
    OnInit,
    AfterViewInit,
    ViewChild,
    ElementRef,
    Input,
    Output,
    EventEmitter,
    OnDestroy,
    ChangeDetectionStrategy
} from '@angular/core';
import { Functions } from '@app/helpers/functions';
import * as mapboxgl from 'maplibre-gl';

@Component({
    selector: 'app-tab-geo',
    templateUrl: './tab-geo.component.html',
    styleUrls: ['./tab-geo.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabGeoComponent implements OnInit, AfterViewInit, OnDestroy, AfterViewInit {
    @ViewChild('geomap', { static: false }) geomap: ElementRef;
    private _dataItem: any;
    private color_sid: string;
    private _interval: any;
    private coordinatesLan: Array<number> = [];
    private coordinatesLat: Array<number> = [];

    @Input() set dataItem(dataItem) {
        this._dataItem = dataItem;
    }
    get dataItem() { return this._dataItem; }

    @Output() ready: EventEmitter<any> = new EventEmitter();
    constructor() { }

    ngOnInit() {
        Functions.emitWindowResize();
    }

    ngAfterViewInit() {
        const map = new mapboxgl.Map({
            container: this.geomap.nativeElement,
            style: {
                version: 8,
                sources: {
                    osm: {
                        type: 'raster',
                        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                        tileSize: 256,
                        attribution: 'Map tiles by <a target="_top" rel="noopener" href="https://tile.openstreetmap.org/">OpenStreetMap tile servers</a>, under the <a target="_top" rel="noopener" href="https://operations.osmfoundation.org/policies/tiles/">tile usage policy</a>. Data by <a target="_top" rel="noopener" href="http://openstreetmap.org">OpenStreetMap</a>'
                    }
                },
                glyphs: 'http://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
                layers: [{
                    id: 'osm',
                    type: 'raster',
                    source: 'osm',
                }],
            },
            zoom: 1
        });
        map.on('load', () => {
            const pointsArray: Array<object> = [];
            const linesArray: Array<object> = [];
            this.dataItem.data.data.transaction.forEach((transaction, index) => {
                if ((transaction.data.geolan === 0 && transaction.data.geolat === 0)
                    || (transaction.data.destlan === 0 && transaction.data.destlat === 0)
                    || (transaction.data.geolan === undefined && transaction.data.geolat === undefined)
                    || (transaction.data.destlan === undefined && transaction.data.destlat === undefined)) {
                    return;
                }
                if (transaction.data.geolan !== 0 && transaction.data.geolan !== undefined) {
                    this.coordinatesLan.push(transaction.data.geolan);
                }
                if (transaction.data.destlan !== 0 && transaction.data.destlan !== undefined) {
                    this.coordinatesLan.push(transaction.data.destlan);
                }
                if (transaction.data.geolat !== 0 && transaction.data.geolat !== undefined) {
                    this.coordinatesLat.push(transaction.data.geolat);
                }
                if (transaction.data.destlat !== 0 && transaction.data.destlat !== undefined) {
                    this.coordinatesLat.push(transaction.data.destlat);
                }
                const pointA = {
                    // feature for Mapbox DC
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [transaction.data.geolan,
                        transaction.data.geolat]
                    },
                    'properties': {
                        'description': `<p> Caller ${index + 1}</p>
                                    <p> User: ${transaction.from_user}</p>
                                    <p> ${transaction.source_ip} </p>`
                    }
                };
                pointsArray.push(pointA);
                const pointB = {
                    // feature for Mapbox DC
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [
                            transaction.data.destlan,
                            transaction.data.destlat]
                    },
                    'properties': {
                        'description': `<p> Callee ${index + 1}</p>
                                    <p> User: ${transaction.to_user} </p>
                                    <p> ${transaction.destination_ip} </p>`
                    }
                };
                pointsArray.push(pointB);
                const line = {
                    'type': 'Feature',
                    'properties': {
                        'color': '#' + Functions.getColorByStringHEX(transaction.callid)
                    },
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': [
                            pointA.geometry.coordinates, pointB.geometry.coordinates
                        ]
                    }
                };
                linesArray.push(line);

            });
            map.flyTo({
                center: [
                    this.average(this.coordinatesLan),
                    this.average(this.coordinatesLat)
                ]
            });
            map.addSource('route', {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': linesArray
                }
            });
            map.addLayer({
                'id': 'route',
                'type': 'line',
                'source': 'route',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': ['get', 'color'],
                    'line-width': 8
                }
            });
            map.addSource('points', {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': pointsArray,
                }
            });
            map.loadImage('/assets/images/baseline_room_black_18dp.png', function (error, image) {
                if (error) {
                    throw error;
                }
                try {
                    map.addImage('custom-marker', image);
                    map.addLayer({
                        'id': 'points',
                        'type': 'symbol',
                        'source': 'points',
                        'layout': {
                            // get the icon name from the source's "icon" property
                            // concatenate the name to get an icon from the style's sprite sheet
                            'icon-image': 'custom-marker',
                            'icon-offset': [0, -15],
                            // get the title name from the source's "title" property
                            'text-field': ['get', 'title'],
                            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                            'text-offset': [0, 0.6],
                            'text-anchor': 'top'
                        }
                    });
                } catch (e) { }
            });
            map.on('click', 'points', function (e) {
                try {
                    const coordinates = e.features[0].geometry.coordinates.slice();
                    const description = e.features[0].properties.description;

                    // Ensure that if the map is zoomed out such that multiple
                    // copies of the feature are visible, the popup appears
                    // over the copy being pointed to.
                    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                    }
                    new mapboxgl.Popup()
                        .setLngLat(coordinates)
                        .setHTML(description)
                        .addTo(map);
                } catch (e) { }
            });
            Functions.emitWindowResize();
        });
        setTimeout(() => {
            this.ready.emit({});
        }, 100);
    }
    average(coordinates: Array<number>) {
        return coordinates.reduce((a, b) => (a + b)) / coordinates.length;
    }
    ngOnDestroy() {
        clearInterval(this._interval);
    }
}
