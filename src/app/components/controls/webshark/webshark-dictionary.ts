/**
 * Dictionary WebShark:
 * https://www.wireshark.org/docs/dfref/
 * 
 * https://github.com/aerospike-community/aerospike-wireshark-plugin/blob/master/tests/test-heartbeat-mesh.pcapng.pdml
 */
import { Component } from '@angular/core';

@Component({
    template: ''
})
export class WebsharkDictionary {
    static _ws = {
        '_ws.expert': `Expert Info`,
        '_ws.expert.group': `Group`,
        '_ws.expert.message': `Message`,
        '_ws.expert.severity': `Severity level`,
    };
    static sdp = {
        sdp: `Session Description Protocol`
    };
    static sip = {
        sip: `Session Initiation Protocol`
    };
    static ssh = {
        ssh: `SSH Protocol`
    };
    static frame = {
        'comment': `Comment`,
        'frame.cap_len': `Frame length stored into the capture file`,
        'frame.coloring_rule.name': `Coloring Rule Name`,
        'frame.coloring_rule.string': `Coloring Rule String`,
        'frame.comment': `Comment`,
        'frame.comment.expert': `Formatted comment`,
        'frame.dlt': `WTAP_ENCAP`,
        'frame.encap_type': `Encapsulation type`,
        'frame.file_off': `File Offset`,
        'frame.ignored': `Frame is ignored`,
        'frame.incomplete': `Incomplete dissector`,
        'frame.interface_description': `Interface description`,
        'frame.interface_id': `Interface id`,
        'frame.interface_name': `Interface name`,
        'frame.interface_queue': `Interface queue`,
        'frame.len': `Frame length on the wire`,
        'frame.link_nr': `Link Number`,
        'frame.marked': `Frame is marked`,
        'frame.md5_hash': `Frame MD5 Hash`,
        'frame.number': `Frame Number`,
        'frame.offset_shift': `Time shift for this packet`,
        'frame.p2p_dir': `Point-to-Point Direction`,
        'frame.p_prot_data': `Number of per-protocol-data`,
        'frame.packet_flags': `Packet flags`,
        'frame.packet_flags_crc_error': `CRC error`,
        'frame.packet_flags_direction': `Direction`,
        'frame.packet_flags_fcs_length': `FCS length`,
        'frame.packet_flags_packet_too_error': `Packet too long error`,
        'frame.packet_flags_packet_too_short_error': `Packet too short error`,
        'frame.packet_flags_preamble_error': `Preamble error`,
        'frame.packet_flags_reception_type': `Reception type`,
        'frame.packet_flags_reserved': `Reserved`,
        'frame.packet_flags_start_frame_delimiter_error': `Start frame delimiter error`,
        'frame.packet_flags_symbol_error': `Symbol error`,
        'frame.packet_flags_unaligned_frame_error': `Unaligned frame error`,
        'frame.packet_flags_wrong_inter_frame_gap_error': `Wrong interframe gap error`,
        'frame.packet_id': `Packet id`,
        'frame.pkt_len': `Frame length on the wire`,
        'frame.protocols': `Protocols in frame`,
        'frame.ref_time': `This is a Time Reference frame`,
        'frame.time': `Arrival Time`,
        'frame.time_delta': `Time delta from previous captured frame`,
        'frame.time_delta_displayed': `Time delta from previous displayed frame`,
        'frame.time_epoch': `Epoch Time`,
        'frame.time_invalid': `Arrival Time: Fractional second out of range (0-1000000000)`,
        'frame.time_relative': `Time since reference or first frame`,
        'frame.verdict': `Verdict`,
        'frame.verdict.ebpf_tc': `eBPF TC`,
        'frame.verdict.ebpf_xdp': `eBPF XDP`,
        'frame.verdict.hw': `Hardware`,
        'frame.verdict.unknown': `Unknown`,
    };
}
