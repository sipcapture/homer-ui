/**
 * TODO:
 * exemple https://visjs.github.io/vis-network/examples/network/exampleApplications/nodeLegend.html
 * https://visjs.github.io/vis-network/docs/network/edges.html#
 */


import {
    Component,
    OnInit,
    ViewChild,
    ElementRef,
    Input,
    Output,
    AfterViewInit,
    EventEmitter,
    ChangeDetectorRef,
    ChangeDetectionStrategy,
    OnDestroy
} from '@angular/core';
import { Network } from 'vis';
import { Functions } from '@app/helpers/functions';
import { TooltipService } from '@app/services/tooltip.service';

import { TransactionFilterService } from '@app/components/controls/transaction-filter/transaction-filter.service';

@Component({
    selector: 'app-tab-graph',
    templateUrl: './tab-graph.component.html',
    styleUrls: ['./tab-graph.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabGraphComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('siteConfigNetwork', { static: true }) siteConfigNetwork: ElementRef;
    @ViewChild('svgNetwork', { static: false }) svgNetworkContainer: ElementRef;
    _settings;
    @Input() set settings(value) {
        if (typeof value !== 'undefined') {
            this.options = value;
            this.network?.setOptions(this.options);
            this.cdr.detectChanges()
        }
    };
    get settings() {
        return this.options;
    }
    public tooltipData: any = [];
    public network: any;
    trans: any;
    fullTrans: any;

    isSimplify;
    isSimplifyPort;
    isCombineByAlias;

    options: any = {
        interaction: {
            hover: true,
        },
        manipulation: {
            enabled: false
        },
        nodes: {
            // shape: 'dot',
            scaling: {
                min: 16,
                max: 32,
            },
        },
        edges: {
            color: {
                color: '#848484',
                highlight: '#848484',
                hover: '#848484',
                inherit: 'from',
                opacity: 1.0
            },
            smooth: {
                enabled: true,
                type: 'dynamic',
                roundness: 20
            },
            arrows: {
                to: {
                    enabled: true,
                    scaleFactor: 0.5,
                    type: 'arrow',
                },
            },

        },
        physics: {
            barnesHut: {
                gravitationalConstant: -20000,
                centralGravity: 0.05,
                damping: 0.95,
                springConstant: 0.01,
                springLength: 15,
                avoidOverlap: 1
            },
            maxVelocity: 5,
            stabilization: {
                updateInterval: 2000,
                iterations: 1
            },
        },

        groups: {
            IP: {
                shape: 'triangle',
                color: '#FF9900', // orange
            },
            USER: {
                shape: 'dot',
                color: '#2B7CE9', // blue
            },
            SERVER: {
                shape: 'square',
                color: '#109618', // green
            },
            ALIAS: {
                shape: 'square',
                color: '#109618', // green
            }
        }
    };
    @Input() set dataItem(_dataItem) {
        this.fullTrans = this.trans = _dataItem.data;
        this.trans = Functions.cloneObject(this.fullTrans);
        const treedata = this.calcVectors();
        this.loadVisTree(treedata);
        this.cdr.detectChanges();
    }
    @Output() ready: EventEmitter<any> = new EventEmitter();
    constructor(
        private tooltipService: TooltipService,
        private cdr: ChangeDetectorRef
    ) { }
    ngOnInit() {
        TransactionFilterService.listen.subscribe(filter => {
            const {
                isSimplify,
                isSimplifyPort,
                isCombineByAlias,
                PayloadType,
                filterIP,
                CallId
            } = filter;
            this.isSimplify = isSimplify;
            this.isSimplifyPort = !isSimplifyPort;
            this.isCombineByAlias = isCombineByAlias;

            if (this.fullTrans && this.trans) {
                this.trans.messages = this.fullTrans.messages.filter(item => {
                    const srcHost = item.srcHost || item.source_ip || item.sourceSipIP || item.srcAlias;
                    const dstHost = item.dstHost || item.destination_ip || item.destinationSipIP || item.dstAlias;
                    const _f = str => ((filterIP?.find(i => i.title === str)) || { selected: true }).selected;
                    const ipFilter = _f(srcHost) && _f(dstHost);

                    const itemFilter = (CallId?.find(i => i.title === item.callid)) || { selected: true };
                    const payloadFilter = (PayloadType?.find(i => i.title === item.typeItem)) || { selected: true };
                    return itemFilter.selected && payloadFilter.selected && ipFilter;
                }).filter((item: any) => {
                    if (item.typeItem === 'RTP' || item.typeItem === 'RTCP') {
                        if (item.messageData.item.QOS.qosTYPE !== 'PERIODIC') {
                            return true;
                        }
                    }
                    return true;

                });
                const treedata = this.calcVectors();
                this.loadVisTree(treedata);
                this.cdr.detectChanges();
            }
        });
    }
    ngAfterViewInit() {
        setTimeout(() => {
            this.ready.emit(this.options);
        }, 35);
    }
    eventHideTooltip() {
        this.tooltipService.hide();
        this.cdr.detectChanges();
    }
    loadVisTree(treedata) {
        if (!this.siteConfigNetwork || !this.siteConfigNetwork.nativeElement) {
            setTimeout(() => {
                this.loadVisTree(treedata);
            });
            return;
        }
        if (this.network?.destroy) {
            // clear old one, before initialize new one.
            this.network?.destroy();
        }
        const container = this.siteConfigNetwork.nativeElement;
        this.network = new Network(container, treedata, this.options);

        this.network.on('hoverNode', params => {
            this.tooltipService.show(treedata.nodes.find(i => i.id === params.node));
            this.cdr.detectChanges();
        });

        this.network.on('hoverEdge', evt => {
            const edge = treedata.edges.find(j => j.id === evt.edge);
            const [data]: any = edge.items;
            if (data) {
                if (data.typeItem === 'SIP') {
                    this.tooltipService.show(data.raw_source);
                } else if (data.typeItem === 'DTMF') {
                    this.tooltipService.show(
                        Object.assign({}, data.DTMFSingleData, data)
                    );
                } else if (data.typeItem === 'LOG') {
                    this.tooltipService.show(
                        Functions.JSON_parse(data.item.message) || data.item.message
                    );
                } else {

                    if (data.QOS?.tabType === 'UAReport') {
                        this.tooltipService.show(data.QOS);
                    } else {
                        // RTP | RTCP
                        this.tooltipService.show(data.QOS ? data.QOS?.message : data);
                    }
                }
            }
        });

        this.network.on('selectEdge', evt => {
            const arrEdges = evt.edges.map(i => treedata.edges.find(j => j.id === i));
        });

        this.network.on('blurNode', this.eventHideTooltip.bind(this));
        this.network.on('blurEdge', this.eventHideTooltip.bind(this));
        this.cdr.detectChanges();
    }
    groupUnique(arr, options = null) {
        return arr.map(i => JSON.stringify(i)).sort()
            .filter((i, k, a) => i !== a[k - 1])
            .map(i => JSON.parse(i));
    }
    calcVectors() {
        const m5o = Functions.md5object;
        const f1 = stream => ['IP', 'ALIAS'].includes(stream.group);
        const f2 = stream => ['USER'].includes(stream.group);

        let _edges = [];
        let _nodes = [];
        const { messages } = this.trans;
        this.groupUnique(messages.map(i => i.messageData.item).map(i => {
            const srcHost = (i.srcHost || i.source_ip || i.sourceSipIP || i.srcAlias) +
                (i.source_port && this.isSimplifyPort ? `:${i.source_port}` : '');
            const dstHost = (i.dstHost || i.destination_ip || i.destinationSipIP || i.dstAlias) +
                (i.destination_port && this.isSimplifyPort ? `:${i.destination_port}` : '');

            const isSAlias = i.srcAlias && i.srcAlias !== srcHost;
            const isDAlias = i.dstAlias && i.dstAlias !== dstHost;

            const arr = [
                i.data && i.data.from_user && {
                    group: 'USER',
                    label: 'from_user: ' + i.data.from_user + ' ► ',
                    value: 5

                } || null,
                !this.isCombineByAlias && {
                    group: 'IP',
                    label: srcHost,
                    value: 2
                } || null,
                this.isCombineByAlias && {
                    group: 'ALIAS',
                    label: i.srcAlias,
                    value: 3
                } || null,
                this.isCombineByAlias && {
                    group: 'ALIAS',
                    label: i.dstAlias,
                    value: 3
                } || null,
                !this.isCombineByAlias && {
                    group: 'IP',
                    label: dstHost,
                    value: 2
                } || null,
                i.data && i.data.to_user && {
                    group: 'USER',
                    label: 'To user: ' + i.data.to_user + ' ◄ ',
                    value: 5
                } || null
            ];
            return arr.filter(k => !!k).map((j: any, k, inArr) => {
                if (!this.isSimplifyPort && [j, inArr[k - 1], inArr[k + 1]].filter(q => !!q).map(_ => _.group).includes('USER')) {
                    return j;
                }
                j.item = i;
                j.MOS = i.QOS?.MOS;
                j.DTMF = i.DTMFSingleData?.NUM;
                j.type =
                    i.typeItem === 'SIP' ? i.typeItem + '>' + i.method :
                        i.typeItem;
                return j;
            });
        })).map(item => item.forEach((i, k, a) => {
            _nodes.push(i);

            if (a[k + 1]) {
                _edges.push([i, a[k + 1]]);
            }
        }));
        _edges = this.groupUnique(_edges, { group_to_array: ['item'] });
        _nodes = this.groupUnique(_nodes.map(
            ({ group, label, value }) => ({
                group, label, value,
                // fixed: label === 'Botauro'
            })
        ));
        _nodes.forEach((i, k) => i.id = k);

        _edges = _edges
            .filter(([from, to]: any[]) => m5o(from) !== m5o(to))
            .map(([from, to]: any[]) => {
                const isiptoalias = f1(from) && f1(to);
                const vector = unit => _nodes.findIndex(n => n.label === unit.label && n.group === unit.group);
                return {
                    from: vector(from),
                    to: vector(to),
                    id: m5o([from, to]),
                    items: [from.item, to.item],
                    length: !!from.MOS && 150 || isiptoalias ? 2 : 1,
                    width: from.MOS ? 6 / from.MOS : 1,
                    color: from.MOS && {
                        color: from.type === 'SDP' ? '#f5f5f5' : Functions.MOSColorGradient(from.MOS * 100),
                        highlight: Functions.MOSColorGradient(from.MOS * 100)
                    },
                    dashes: f2(from) || f2(to),
                    label: from.type ? (`${from.type}` +
                        (from.MOS ? `[mos:${from.MOS}]` : '') +
                        (from.DTMF ? `[${from.DTMF}]` : '')) : '',
                };
            });

        return {
            nodes: _nodes,
            edges: _edges
        };
    }

    ngOnDestroy() {
        if (this.network?.destroy) {
            this.network?.destroy();
        }
    }
}
