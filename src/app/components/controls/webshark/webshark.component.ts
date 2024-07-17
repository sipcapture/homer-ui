import { TooltipService } from '@app/services/tooltip.service';
import { WebsharkDictionaryApiService, IdType } from './webshark-dictionary-api.service';
import { WebsharkDictionary } from './webshark-dictionary';
import { Functions, log } from '@app/helpers/functions';
import { Input, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import  moment from 'moment';

interface TreeNode {
    name: string;
    description?: string;
    children?: TreeNode[];
}
interface FlatNode {
    expandable: boolean;
    name: string;
    description?: string;
    level: number;
}

@Component({
    selector: 'app-webshark',
    templateUrl: './webshark.component.html',
    styleUrls: ['./webshark.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush

})
export class WebsharkComponent implements OnInit, AfterViewInit {
    _data: any;
    textFilterGrid = '';
    textFilterTree = '';
    dataTree: TreeNode[];
    detailsTable = [];
    columnsTable = ['id', 'time', 'source', 'description', 'protocol', 'length', 'callid', 'info'];
    dataIndex: any[] = [];
    treeControl = new FlatTreeControl<FlatNode>(
        node => node.level,
        node => node.expandable
    );

    treeFlattener = new MatTreeFlattener(
        this._transformer, node => node.level, node => node.expandable, node => node.children);

    dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    @Input() set sipDataItem(val: any) {
        this.rowData = val.data.messages.map(msg => msg.source_data);

    }
    get sipDataItem(): any {
        return {};
    }
    _rowData: any;

    @Input() set rowData(v: any) {
        log({ rowData: v });
        this._rowData = v;
        const getId = o => +o.frame?.['frame.number'];
        this.detailsTable = v?.map(i => {
            const frame = i.frame || (Functions.JSON_parse(i.raw_source) || {}).frame || {};
            let time = frame['frame.time_epoch'] || '';
            const arr = time.replace('.', '').split('').reverse();
            arr.splice(6, 0, '.');
            time = arr.reverse().join('');
            const [unixTime, miroSeconds] = time.split('.') || [];
            return {
                id: getId({frame}),
                callid: i.callid,
                time: `${moment(+unixTime).format('DD-MM-YYYY HH:mm:ss.SSS')}${miroSeconds}`,
                source: i.aliasSrc,
                description: i.aliasDst,
                protocol: i.frame_protocol.split(':')
                    .slice(2)
                    .join(' > ')
                    .toUpperCase(),
                length: frame['frame.cap_len'],
                info: '.. info ..',
                item: i
            };
        });
    }
    get rowData(): any {
        return this._rowData;
    }

    vocabularyFromApis: any = {};

    @Input()
    set data(val: any) {
        this.setData(val);
    }

    get data(): any {
        return this._data;
    }

    @Output() ready: EventEmitter<any> = new EventEmitter();
    @Output() dblclick: EventEmitter<any> = new EventEmitter();


    constructor(
        private websharkDictionaryApiService: WebsharkDictionaryApiService,
        public tooltipService: TooltipService,
        private cdr: ChangeDetectorRef
    ) {
        this.dataSource.data = [{ name: 'Loading...' }];
    }
    private async setData(val) {
        this._data = typeof val !== 'object' ? (Functions.JSON_parse(val) || val) : val;
        this.dataTree = await this.getData(this._data, 'root');
        this.dataSource.data = this.dataTree;
        this.ngAfterViewInit();
    }

    // make data as TREE
    private async getData(d: any, hostKey) {
        d = this.sortObject(hostKey, d);
        const arrTreeNode: TreeNode[] = [];

        // tslint:disable-next-line: forin
        for (const [key, val] of Object.entries(d)) {
            const rxTree = /_tree$/g;
            if (rxTree.test(key)) {
                continue;
            }
            const treeNode: TreeNode = {
                name: await this.getLabelByKey(key, val),
                description: typeof val === 'object' ? key : `${key} == ${val}`
            };
            this.dataIndex.push(Functions.cloneObject(treeNode));
            const objDetails = d[key + '_tree'] || (typeof val === 'object' ? val : null);
            if (objDetails) {
                const c = await this.getData(objDetails, key);
                if (c !== null) {
                    treeNode.children = c;
                }
            }
            arrTreeNode.push(treeNode);
        }

        return arrTreeNode.filter(i => !!i);
    }
    ngAfterViewInit() {

        setTimeout(() => {
            this.ready.emit({});
            this.cdr.detectChanges();
        }, 100);
    }
    public hasChild(_: number, node: FlatNode) {
        return node.expandable;
    }
    private _transformer(node: TreeNode, level: number) {
        return {
            expandable: !!node.children && node.children.length > 0,
            description: node.description,
            name: node.name,
            level: level,
        };
    }
    private sorObjKeys(obj) {
        return Object.keys(obj).sort().reduce((o, key) => {
            o[key] = obj[key];
            return o;
        }, {});
    }
    private sortObject(key, obj: any): any {
        switch (key) {
            case 'root':
                return Object.assign({
                    frame: null,
                }, this._data);
            case 'tcp.flags':
                return Object.assign({
                    'tcp.flags.res': null,
                    'tcp.flags.ns': null,
                    'tcp.flags.cwr': null,
                    'tcp.flags.ecn': null,
                    'tcp.flags.urg': null,
                    'tcp.flags.ack': null,
                    'tcp.flags.push': null,
                    'tcp.flags.reset': null,
                    'tcp.flags.syn': null,
                    'tcp.flags.fin': null,
                }, obj);
            case 'ip':
                return Object.assign({
                    'ip.version': `0100 .... = Version: `,
                    'ip.hdr_len': `.... 0101 = Header Length:  bytes (5)`,
                }, obj);
            case 'ip.flags':
                return Object.assign({
                    'ip.flags.rb': null,
                    'ip.flags.df': null,
                    'ip.flags.mf': null,
                }, obj);
            default:
                return this.sorObjKeys(obj);
        }

    }
    private async getLabelByKey(key: string, value: any) {
        /**
         * INFO: https://tools.ietf.org/id/draft-munoz-6tisch-examples-00.html
         */

        const b2s = v => {
            const baseStyle = c => `
                background-color: light${c};
                padding: 0px 8px;
                border-radius: 1rem;`;

            const { style, name } = [
                { style: 'pink', name: 'Not set' },
                { style: 'green', name: 'Set' }
            ][+!!(+v)];

            return `<span style="${baseStyle(style)}">${name}</span>`;
        };

        const blue = v => `<span style="color: blue">${v}</span>`;
        const normalizerString = v => ('' + v).split('').map(i => i.charCodeAt(0).toString(16))
            .filter(i => i !== 'c2').map(i => String.fromCharCode(parseInt(i, 16))).join('');
        const mapping = {
            'frame': `Frame ${blue(value['frame.number'])}:
                ${blue(value['frame.len'])} bytes on wire (${blue(value['frame.len'] * 8)} bits),
                ${blue(value['frame.cap_len'])} bytes captured (${blue(value['frame.cap_len'] * 8)} bits)`,
            'frame.encap_type': `Encapsulation type: Ethernet (${blue(value)})`,
            'frame.offset_shift': `Time shift for this packet: ${blue(value)} seconds`,
            'frame.time_epoch': `Epoch Time: ${blue(value)} seconds`,
            'frame.time_delta': `Time delta from previous captured frame: ${blue(value)} seconds`,
            'frame.time_delta_displayed': `Time delta from previous displayed frame: ${blue(value)} seconds`,
            'frame.time_relative': `Time since reference or first frame: ${blue(value)} seconds`,
            'frame.len': `Frame Length: ${blue(value)} bytes (${blue(value * 8)} bits)`,
            'frame.cap_len': `Capture Length: ${blue(value)} bytes (${blue(value * 8)} bits)`,
            'eth': `Ethernet II, Src: ${blue(value['eth.src'])} (${blue(value['eth.src'])}), Dst: ${blue(value['eth.dst'])} (${blue(value['eth.dst'])})`,
            'eth.dst': `Destination: ${blue(value)} (${blue(value)})`,
            'eth.addr': `Address: ${blue(value)} (${blue(value)})`,
            'eth.lg': `.... ..${blue(value)}. .... .... .... .... = LG bit: Globally unique address (factory default)`,
            'eth.ig': `.... ...${blue(value)} .... .... .... .... = IG bit: Individual address (unicast)`,
            'eth.src': `Source: ${blue(value)} (${blue(value)})`,
            'eth.type': `Type: IPv4 (${blue(value)})`,
            'ip': `Internet Protocol Version 4, Src: ${blue(value['ip.src'])}, Dst: ${blue(value['ip.dst'])}`,
            'ip.version': `0100 .... = Version: ${blue(value)}`,
            'ip.hdr_len': `.... 0101 = Header Length: ${blue(value)} bytes (5)`,
            'ip.flags.rb': `${blue(value)}... .... = Reserved bit: ${b2s(value)}`,
            'ip.flags.df': `.${blue(value)}.. .... = Don't fragment: ${b2s(value)}`,
            'ip.flags.mf': `..${blue(value)}. .... = More fragments: ${b2s(value)}`,
            'ip.dsfield.dscp': `0000 0${blue(value)}.. = Differentiated Services Codepoint: Default (${blue(value)})`,
            'ip.dsfield.ecn': `.... ..0${blue(value)} = Explicit Congestion Notification: Not ECN-Capable Transport (${blue(value)})`,
            'tcp': `Transmission Control Protocol,
                Src Port: ${blue(value['tcp.srcport'])},
                Dst Port:  ${blue(value['tcp.dstport'])},
                Seq: ${blue(value['tcp.seq'])},
                Ack: ${blue(value['tcp.ack'])},
                Len: ${blue(value['tcp.len'])}`,
            'tcp.seq': `Sequence Number: ${blue(value)} (relative sequence number)`,
            'tcp.nxtseq': `Next Sequence Number: ${blue(value)} (relative sequence number)`,
            'tcp.ack': `Acknowledgment Number: ${blue(value)} (relative ack number)`,
            'tcp.hdr_len': `1000 .... = Header Length: ${blue(value)} bytes (${blue(value * 8)})`,
            'tcp.flags': `Flags: ${blue(value)}`,
            'tcp.flags.res': `00${blue(value)}. .... .... = Reserved: ${b2s(value)}`,
            'tcp.flags.ns': `...${blue(value)} .... .... = Nonce: ${b2s(value)}`,
            'tcp.flags.cwr': `.... ${blue(value)}... .... = Congestion Window Reduced (CWR): ${b2s(value)}`,
            'tcp.flags.ecn': `.... .${blue(value)}.. .... = ECN-Echo: ${b2s(value)}`,
            'tcp.flags.urg': `.... ..${blue(value)}. .... = Urgent: ${b2s(value)}`,
            'tcp.flags.ack': `.... ...${blue(value)} .... = Acknowledgment: ${b2s(value)}`,
            'tcp.flags.push': `.... .... ${blue(value)}... = Push: ${b2s(value)}`,
            'tcp.flags.reset': `.... .... .${blue(value)}.. = Reset: ${b2s(value)}`,
            'tcp.flags.syn': `.... .... ..${blue(value)}. = Syn: ${b2s(value)}`,
            'tcp.flags.fin': `.... .... ...${blue(value)} = Fin: ${b2s(value)}`,
            'tcp.flags.str': `TCP Flags: ${normalizerString(value)}`,
            'tcp.options.nop': `TCP Option - No-Operation (NOP): ${blue(value)}`,

        };

        const [rootKey] = key.match(/\w+/g) || [];
        const vocData = await this.getVocabularyById(rootKey) || {};
        const strTitle = vocData[key] || WebsharkDictionary[rootKey]?.[key];
        const valueData = typeof value !== 'object' ? `: ${value}` : '';
        const secondTitle = strTitle && strTitle + blue(valueData);
        return mapping[key] || secondTitle || `<i>${this.strToLabel(key)}</i>` + valueData;
    }
    private async getVocabularyById(key) {
        return await this.websharkDictionaryApiService.get(key as IdType);
    }

    private strToLabel(str: string): string {
        /**
         * convert string from
         * 'tcp.analysis.push_bytes_sent'
         * to
         * 'Tcp Analysis Push Bytes Sent'
         */
        return (str + '')
            .split(/[\._]{1}/g)
            .map(
                i => i.replace(/(\w){1}/, (g, a) => ('' + a).toUpperCase()))
            .join(' ');
    }

    ngOnInit() {
    }

    showMessage(event) {

        const d = event.row?.item?.message || event.row?.item?.raw_source;
        if (d) {
            this.data = d;
        }
    }

    setFilterGrid(textFilter) {
        this.textFilterGrid = textFilter;
        this.cdr.detectChanges();
    }
    treeFilter({ description, name }) {
        if (this.textFilterTree === '') {
            return true;
        }
        const a = this.dataIndex.filter(i => i.description.includes(this.textFilterTree) || i.name.includes(this.textFilterTree));
        const b = a.map(i => i.description.split(' == ')[0].split('.').slice(0, -1).join('.')).sort().filter((i, k, aa) => i !== aa[k + 1]);
        const c = b.map(j => this.dataIndex.filter(i => i.description.split(' == ')[0] === j)).map((i) => i?.[0]?.description);
        return c.includes(description) || description.includes(this.textFilterTree) || name.includes(this.textFilterTree);
    }
    highlight(text) {
        return this.textFilterTree !== '' ?
            text.replaceAll(
                this.textFilterTree,
                `<span style="background-color: yellow;">${this.textFilterTree}</span>`) :
            text;
    }
    onKeyUpFilterTree() {
        this.cdr.detectChanges();
    }
    filterGrid(details: any[]) {
        if (this.textFilterGrid === '') {
            return details;
        }
        const out = details?.filter(({ item }) => {
            const data = item.message || item.data || item.raw_source;
            return data.includes(this.textFilterGrid.replace(` == `, `":"`));
        }) || details;
        return out;
    }
    openDetails(event) {
        // console.log(event);
        const data = event?.row?.item;
        data.uniqueId = Functions.md5object(data);
        this.dblclick.emit({data});
    }
    ngOnDestroy() {
        this.tooltipService.hide();
    }
}
