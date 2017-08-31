<?php
/*
 * HOMER API Engine
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
namespace RestApi;
class Report {
	protected $_instance = array();
	private $authmodule = true;
	function __construct()
	{
	}
	/**
	* Checks if a user is logged in.
	*
	* @return boolean
	*/
	public function getLoggedIn() {
		$answer = array();
		if($this->authmodule == false) return $answer;
		if(!$this->getContainer('auth')->checkSession()) {
			$answer['sid'] = session_id();
			$answer['auth'] = 'false';
			$answer['status'] = 403;
			$answer['message'] = 'bad session';
			$answer['data'] = array();
		}
		return $answer;
	}
	public function doRTCPReport($timestamp, $param) {
		/* get our DB */
		$db = $this->getContainer('db');
		$db->select_db(DB_CONFIGURATION);
		$db->dbconnect();
		/* get our DB Abstract Layer */
		$layer = $this->getContainer('layer');
		$data = array();
		$lnodes = array();
		$newcorrid = array();
		//if(array_key_exists('node', $param)) $lnodes = $param['node'];
		if(isset($param['location'])) $lnodes = $param['location']['node'];
		$time['from'] = getVar('from', round((microtime(true) - 300) * 1000), $timestamp, 'long');
		$time['to'] = getVar('to', round(microtime(true) * 1000), $timestamp, 'long');
		$time['from_ts'] = floor($time['from']/1000);
		$time['to_ts'] = round($time['to']/1000);
		/* lets make a range */
		$time['from_ts']-=600;
		$time['to_ts']+=60;
		/* search fields */
		$node = getVar('node', NULL, $param['search'], 'string');
		$type = getVar('type', -1, $param['search'], 'int');
		$proto = getVar('proto', -1, $param['search'], 'int');
		$family = getVar('family', -1, $param['search'], 'int');
		$and_or = getVar('orand', NULL, $param['search'], 'string');
		$limit_orig = getVar('limit', 100, $param, 'int');
		$answer = array();
		$callids = getVar('callid', array(), $param['search'], 'array');
		$callwhere = array();
		$cn = count($callids);
		for($i=0; $i < $cn; $i++) $callids[] = substr($callids[$i], 0, -1);
		$search['callid'] = implode(";", $callids);
		//$callwhere[] = "`correlation_id` IN ('".implode("','", $callids)."')";
		$answer = array();
		if(empty($callids)) {
			$answer['sid'] = session_id();
			$answer['auth'] = 'true';
			$answer['status'] = 200;
			$answer['message'] = 'no data';
			$answer['data'] = $data;
			$answer['count'] = count($data);
			return $answer;
		}
		$nodes = array();
		if(SINGLE_NODE == 1) $nodes[] = array( "dbname" =>  DB_HOMER, "name" => "single");
		else {
			foreach($lnodes as $lnd) $nodes[] = $this->getNode($lnd['name']);
		}
		$timearray = $this->getTimeArray($time['from_ts'], $time['to_ts']);
		if(empty($callwhere)) $callwhere = generateWhere($search, $and_or, $db, 0);
		$layerHelper = array();
		$layerHelper['table'] = array();
		$layerHelper['order'] = array();
		$layerHelper['where'] = array();
		$layerHelper['fields'] = array();
		$layerHelper['values'] = array();
		$layerHelper['table']['base'] = "sip_capture";
		$layerHelper['where']['type'] = $and_or ? "OR" : "AND";
		$layerHelper['where']['param'] = $callwhere;
		$layerHelper['time'] = $time;
		$layerHelper['fields']['distinct'] = "correlation_id";
		/* get all correlation_id */
		foreach($nodes as $node) {
			$db->dbconnect_node($node);
			$limit = 20;
			foreach($timearray as $tkey=>$tval) {
				if($limit < 1) break;
				$layerHelper['table']['type'] = "call";
				$layerHelper['table']['timestamp'] = $tkey;
				$layerHelper['order']['limit'] = $limit;
				$query = $layer->querySearchData($layerHelper);
				$noderows = $db->loadObjectArray($query);
				foreach($noderows as $k=>$d) {
					$newcorrid[$d["correlation_id"]]=$d["correlation_id"];
					$kz = substr($d["correlation_id"], 0, -1);
					$newcorrid[$kz] = $kz;
				}
				$limit -= count($noderows);
			}
		}
		if(!empty($noderows)) {
			$search=array();
			//$callids = implode(";", $newcorrid);
			$callids = $newcorrid;
		}
		$search['correlation_id'] = implode(";", $callids);
		$timearray = $this->getTimeArray($time['from_ts'], $time['to_ts']);
		$callwhere = generateWhere($search, $and_or, $db, 0);
		$layerHelper = array();
		$layerHelper['table'] = array();
		$layerHelper['order'] = array();
		$layerHelper['where'] = array();
		$layerHelper['fields'] = array();
		$layerHelper['table']['base'] = "rtcp_capture";
		$layerHelper['where']['type'] = $and_or ? "OR" : "AND";
		$layerHelper['where']['param'] = $callwhere;
		$layerHelper['time'] = $time;
		foreach($nodes as $node) {
			$db->dbconnect_node($node);
			$limit = $limit_orig;
			if (defined('RTCP_TABLE_PARTITION') && RTCP_TABLE_PARTITION == 1){
				foreach($timearray as $tkey=>$tval) {
					$layerHelper['table']['type'] = "all";
					$layerHelper['table']['timestamp'] = $tkey;
				}
			}
			$layerHelper['values'] = array();
			$layerHelper['values'][] = "*";
			$layerHelper['values'][] = "'".$node['name']."' as dbnode";
			$query = $layer->querySearchData($layerHelper);
			$noderows = $db->loadObjectArray($query);
			$data = array_merge($data,$noderows);
			$limit -= count($noderows);
		}
		/* RTCP report fix */
		for($i=0; $i < count($data); $i++) {
			if(!is_array($data[$i]["msg"])) $data[$i]["msg"] = json_decode($data[$i]["msg"]);
		}
		/* sorting */
		usort($data, create_function('$a, $b', 'return $a["micro_ts"] > $b["micro_ts"] ? 1 : -1;'));
		if(empty($data)) {
			$answer['sid'] = session_id();
			$answer['auth'] = 'true';
			$answer['status'] = 200;
			$answer['message'] = 'no data';
			$answer['data'] = $data;
			$answer['count'] = count($data);
		}
		else {
			$answer['status'] = 200;
			$answer['sid'] = session_id();
			$answer['auth'] = 'true';
			$answer['message'] = 'ok';
			$answer['data'] = $data;
			$answer['count'] = count($data);
		}
		return $answer;
	}
	public function doQOSReport($timestamp, $param) {
		/* get our DB */
		$bigReport = array();
		/* get callid and correlation id ranges */
		$db = $this->getContainer('db');
		$db->select_db(DB_CONFIGURATION);
		$db->dbconnect();
		/* get our DB Abstract Layer */
		$layer = $this->getContainer('layer');
		$data = array();
		$lnodes = array();
		$newcorrid = array();
		if(isset($param['location'])) $lnodes = $param['location']['node'];
		$time['from'] = getVar('from', round((microtime(true) - 300) * 1000), $timestamp, 'long');
		$time['to'] = getVar('to', round(microtime(true) * 1000), $timestamp, 'long');
		$time['from_ts'] = floor($time['from']/1000);
		$time['to_ts'] = round($time['to']/1000);
		/* lets make a range */
		$time['from_ts']-=600;
		$time['to_ts']+=60;
		/* search fields */
		$node = getVar('node', NULL, $param['search'], 'string');
		$type = getVar('type', -1, $param['search'], 'int');
		$proto = getVar('proto', -1, $param['search'], 'int');
		$family = getVar('family', -1, $param['search'], 'int');
		$and_or = getVar('orand', NULL, $param['search'], 'string');
		$limit_orig = getVar('limit', 100, $param, 'int');
		$answer = array();
		$callids = getVar('callid', array(), $param['search'], 'array');
		$callwhere = array();
		$mapsCallid = array();
		$cn = count($callids);
		for($i=0; $i < $cn; $i++) {
			$mapsCallid[$callids[$i]] =  $callids[$i];
			if(BLEGCID == "b2b") {
				$length = strlen(BLEGTAIL);
				if(substr($callids[$i], -$length) == BLEGTAIL) {
					$k = substr($callids[$i], 0, -$length);
					$mapsCallid[$k] = $k;
				}
				else {
					$k = $callids[$i].BLEGTAIL;
					$mapsCallid[$k] = $k;
				}
				$s = substr($k, 0, -1);
				$mapsCallid[$s] =  $s;
			}
			$k = substr($callids[$i], 0, -1);
			$mapsCallid[$k] =  $k;
		}
		$answer = array();
		if(empty($mapsCallid)) {
			$answer['sid'] = session_id();
			$answer['auth'] = 'true';
			$answer['status'] = 200;
			$answer['message'] = 'no data';
			$answer['data'] = $data;
			$answer['count'] = count($data);
			return $answer;
		}
		$search = array();
		$search['callid'] = implode(";",  array_keys($mapsCallid));
		$nodes = array();
		if(SINGLE_NODE == 1) $nodes[] = array( "dbname" =>  DB_HOMER, "name" => "single");
		else {
			foreach($lnodes as $lnd) $nodes[] = $this->getNode($lnd['name']);
		}
		$timearray = $this->getTimeArray($time['from_ts'], $time['to_ts']);
		if(empty($callwhere)) $callwhere = generateWhere($search, $and_or, $db, 0);
		$callwhere[]="correlation_id != ''";
		$layerHelper = array();
		$layerHelper['table'] = array();
		$layerHelper['order'] = array();
		$layerHelper['where'] = array();
		$layerHelper['fields'] = array();
		$layerHelper['values'] = array();
		$layerHelper['table']['base'] = "sip_capture";
		$layerHelper['where']['type'] = $and_or ? "OR" : "AND";
		$layerHelper['where']['param'] = $callwhere;
		$layerHelper['time'] = $time;
		$layerHelper['fields']['distinct'] = "correlation_id";
		/* get all correlation_id */
		foreach($nodes as $node) {
			$db->dbconnect_node($node);
			$limit = 20;
			foreach($timearray as $tkey=>$tval) {
				if(count($mapsCallid) > $limit) break;
				$layerHelper['table']['type'] = "call";
				$layerHelper['table']['timestamp'] = $tkey;
				$layerHelper['order']['limit'] = $limit;
				$query = $layer->querySearchData($layerHelper);
				$noderows = $db->loadObjectArray($query);
				foreach($noderows as $k=>$d) {
					$mapsCallid[$d["correlation_id"]]=$d["correlation_id"];
					$kz = substr($d["correlation_id"], 0, -1);
					$mapsCallid[$kz] = $kz;
				}
			}
		}
		$search=array();
		$callids = $mapsCallid;
		/* codecs */
		list($export,$duration, $xrtpreport) =  $this->getCodecsFromMessagesForTransaction($timestamp, $param);
		$bigReport["global"] = $export;
		$bigReport["reports"] = array();
		if(count($xrtpreport)) {
			$bigReport["reports"]["xrtpstats"] = array();
			$bigReport["reports"]["xrtpstats"]["main"] = $xrtpreport;;
		}
		/* check RTCP-XR PUBLISH */
		list ($rtcpData, $statsData, $mainData) = $this->doRTCPXRServerReport($timestamp, $param, $callids);
		if(count($rtcpData)) {
			$bigReport["reports"]["rtcpxr"] = array();
			$bigReport["reports"]["rtcpxr"]["main"] = $mainData;;
			$bigReport["reports"]["rtcpxr"]["chart"] = $rtcpData;
			$bigReport["reports"]["rtcpxr"]["stats"] = $statsData;
			if(count($mainData)) {
				$mainData["duration"] = $duration;
				$bigReport["global"]["main"] = &$mainData;
			}
		}
		/* check RTP AGENT Report */
		list ($rtpAgentData, $statsData, $mainData) = $this->doRtpAgentReport($timestamp, $param, $callids);
		if(count($rtpAgentData)) {
			$bigReport["reports"]["rtpagent"] = array();
			$bigReport["reports"]["rtpagent"]["main"] = $mainData;;
			$bigReport["reports"]["rtpagent"]["chart"] = $rtpAgentData;
			$bigReport["reports"]["rtpagent"]["stats"] = $statsData;
			if(count($mainData)) {
				$mainData["duration"] = $duration;
				$bigReport["global"]["main"] = &$mainData;
			}
		}
		/* check Horaclifix Report */
		list ($horaclifixData, $statsData, $mainData) = $this->doHoraclifixReport($timestamp, $param, $callids);
		if(count($horaclifixData)) {
			$bigReport["reports"]["horaclifix"] = array();
			$bigReport["reports"]["horaclifix"]["main"] = $mainData;;
			//$bigReport["reports"]["horaclifix"]["chart"] = $horaclifixData;
			//$bigReport["reports"]["horaclifix"]["stats"] = $statsData;
			if(count($mainData)) {
				$mainData["duration"] = $duration;
				$bigReport["global"]["main"] = &$mainData;
			}
		}
		/* check RTCP */
		list ($rtcpData, $statsData, $mainData) = $this->doRTCPServerReport($timestamp, $param, $callids);
		if(count($rtcpData)) {
			$bigReport["reports"]["rtcp"] = array();
			$bigReport["reports"]["rtcp"]["main"] = $mainData;;
			$bigReport["reports"]["rtcp"]["chart"] = $rtcpData;
			$bigReport["reports"]["rtcp"]["stats"] = $statsData;
			if(count($mainData)) {
				$mainData["duration"] = $duration;
				$bigReport["global"]["main"] = &$mainData;
			}
		}
		if(!array_key_exists('main', $bigReport["global"])) {
			$mainData = array();
			$mainData["duration"] = $duration;
			$bigReport["global"]["main"] = &$mainData;
		}
		$answer['sid'] = session_id();
		$answer['auth'] = 'true';
		$answer['status'] = 200;
		$answer['message'] = 'qos report';
		$answer['data'] = $bigReport;
		$answer['count'] = count($bigReport);
		return $answer;
	}
	public function doRTCPServerReport($timestamp, $param, $callids) {
		/* get our DB */
		$db = $this->getContainer('db');
		$db->select_db(DB_CONFIGURATION);
		$db->dbconnect();
		/* get our DB Abstract Layer */
		$layer = $this->getContainer('layer');
		$data = array();
		$lnodes = array();
		$newcorrid = array();
		if(isset($param['location'])) $lnodes = $param['location']['node'];
		$time['from'] = getVar('from', round((microtime(true) - 300) * 1000), $timestamp, 'long');
		$time['to'] = getVar('to', round(microtime(true) * 1000), $timestamp, 'long');
		$time['from_ts'] = floor($time['from']/1000);
		$time['to_ts'] = round($time['to']/1000);
		/* lets make a range */
		$time['from_ts']-=600;
		$time['to_ts']+=60;
		/* search fields */
		$node = getVar('node', NULL, $param['search'], 'string');
		$type = getVar('type', -1, $param['search'], 'int');
		$proto = getVar('proto', -1, $param['search'], 'int');
		$family = getVar('family', -1, $param['search'], 'int');
		$and_or = getVar('orand', NULL, $param['search'], 'string');
		$limit_orig = getVar('limit', 100, $param, 'int');
		$callwhere = array();
		$nodes = array();
		if(SINGLE_NODE == 1) $nodes[] = array( "dbname" =>  DB_HOMER, "name" => "single");
		else {
			foreach($lnodes as $lnd) $nodes[] = $this->getNode($lnd['name']);
		}
		$timearray = $this->getTimeArray($time['from_ts'], $time['to_ts']);
		$search['correlation_id'] = implode(";", $callids);
		$callwhere = generateWhere($search, $and_or, $db, 0);
		$layerHelper = array();
		$layerHelper['table'] = array();
		$layerHelper['order'] = array();
		$layerHelper['where'] = array();
		$layerHelper['fields'] = array();
		$layerHelper['table']['base'] = "rtcp_capture";
		$layerHelper['where']['type'] = $and_or ? "OR" : "AND";
		$layerHelper['where']['param'] = $callwhere;
		$layerHelper['time'] = $time;
		foreach($nodes as $node) {
			$db->dbconnect_node($node);
			$limit = $limit_orig;
			if (defined('RTCP_TABLE_PARTITION') && RTCP_TABLE_PARTITION == 1){
				foreach($timearray as $tkey=>$tval) {
					$layerHelper['table']['type'] = "all";
					$layerHelper['table']['timestamp'] = $tkey;
				}
			}
			$layerHelper['order']['limit'] = $limit;
			$layerHelper['values'] = array();
			$layerHelper['values'][] = "*";
			$layerHelper['values'][] = "'".$node['name']."' as dbnode";
			$query = $layer->querySearchData($layerHelper);
			$noderows = $db->loadObjectArray($query);
			if(SYSLOG_ENABLE == 1) syslog(LOG_WARNING,"RTCP Query: ".$query);
			$data = array_merge($data,$noderows);
			$limit -= count($noderows);
		}
		/* sorting */
		usort($data, create_function('$a, $b', 'return $a["micro_ts"] > $b["micro_ts"] ? 1 : -1;'));
		$chartData = array();
		$mainData = array();
		$statsData = array();
		/* RTCP report fix */
		foreach ($data as $key => $field) {
			$ts = $data[$key]["micro_ts"];
			$msts = intval($ts/1000);
			$src_ip = $data[$key]["source_ip"];
			$dst_ip = $data[$key]["destination_ip"];
			if(!is_array($data[$key]["msg"])) {
				/* fix JSON if we have some wrong chracters at the end*/
				$json = $data[$key]["msg"];
				$whole_length = strlen($json);
				$right_length = (strlen(strrchr($json, "}")) - 1);
				$left_length = ($whole_length - $right_length - 1);
				$json = substr($json, 0, ($left_length + 1));
				//$json = $data[$key]["msg"];
				$data[$key]["msg"] = json_decode($json, true);
			}
			$ipkey= "RTCP[".$data[$key]["msg"]["sdes_ssrc"]."] ". $src_ip." -> ".$dst_ip;
			if(!array_key_exists($ipkey,  $chartData)) $chartData[$ipkey] = array();
			if(!array_key_exists("mos",  $chartData[$ipkey])) {
				$chartData[$ipkey]["mos"] = array();
				$chartData[$ipkey]["packets"] = array();
				$chartData[$ipkey]["jitter"] = array();
				$chartData[$ipkey]["packets_lost"] = array();
				$statsData[$ipkey] = array();
				$statsData[$ipkey]["mos_counter"] =  0;
				$statsData[$ipkey]["mos_average"] =  0;
				$statsData[$ipkey]["mos_worst"] =  5;
				$statsData[$ipkey]["packet_sent"] =  0;
				$statsData[$ipkey]["packet_recv"] =  0;
				$statsData[$ipkey]["jitter_max"] =  0;
				$statsData[$ipkey]["jitter_avg"] =  0;
				$statsData[$ipkey]["delay"] =  0;
			}
			if(array_key_exists('report_blocks', $data[$key]["msg"])) {
				$blocks = $data[$key]["msg"]["report_blocks"];
				foreach($blocks as $r => $block) {
					$tmpMos = round($this->calculateJitterMos($block["dlsr"] < 1000 ? $block["dlsr"] : 0 ,$block["ia_jitter"],$block["packets_lost"]),2);
					$statsData[$ipkey]["mos_counter"] += 1;
					$statsData[$ipkey]["mos_average"] += $tmpMos;
					$statsData[$ipkey]["jitter_avg"] += $block["ia_jitter"];
					$statsData[$ipkey]["packets_lost"] += $block["fraction_lost"];
					if($block["ia_jitter"] > $statsData[$ipkey]["jitter_max"]) $statsData[$ipkey]["jitter_max"] = $block["ia_jitter"];
					if(!array_key_exists("mos_worst", $statsData[$ipkey]) || $statsData[$ipkey]["mos_worst"] > $tmpMos) $statsData[$ipkey]["mos_worst"] = $tmpMos;
					$chartData[$ipkey]["mos"][]= array($msts, $tmpMos);
					$chartData[$ipkey]["jitter"][]=array($msts, $block["ia_jitter"]);
					$chartData[$ipkey]["packets_lost"][] = array($msts, $block["packets_lost"]);
				}
			}
			if(array_key_exists('sender_information', $data[$key]["msg"])) {
				$block = $data[$key]["msg"]["sender_information"];
				if(array_key_exists("packets", $block)) {
					$chartData[$ipkey]["packets"][] = array($msts, $block["packets"]);
					$statsData[$ipkey]["packets_sent"] += $block["packets"];
				}
			}
		}
		foreach($chartData as $key=>$value) {
			if($statsData[$key]["mos_average"] > 0) {
				$statsData[$key]["mos_average"] = round($statsData[$key]["mos_average"]/$statsData[$key]["mos_counter"],2);
				$mainData["mos_counter"]  += 1;
				$mainData["mos_average"]  += $statsData[$key]["mos_average"];
				if(!array_key_exists("mos_worst", $mainData) || $statsData[$key]["mos_worst"] < $mainData["mos_worst"])
					$mainData["mos_worst"] = $statsData[$key]["mos_worst"];
			}
			if($statsData[$key]["jitter_avg"] > 0) {
				$statsData[$key]["jitter_avg"] = round($statsData[$key]["jitter_avg"]/$statsData[$key]["mos_counter"],2);
				$mainData["jitter_avg"]   += $statsData[$key]["jitter_avg"];
				if($statsData[$key]["jitter_max"] > $mainData["jitter_max"]) $mainData["jitter_max"]= $statsData[$key]["jitter_max"];
			}
			$statsData[$key]["mos_counter"] = 1;
			$mainData["packets_lost"] += $statsData[$key]["packets_lost"];
			$mainData["packets_sent"] += $statsData[$key]["packets_sent"];
			$mainData["packets_recv"] += $statsData[$key]["packets_recv"];
		}
		/* sum of report */
		if(array_key_exists("mos_counter", $mainData) && $mainData["mos_counter"] != 0) {
			$mainData["mos_average"] = round($mainData["mos_average"]/$mainData["mos_counter"],2);
			$mainData["jitter_avg"] = round($mainData["jitter_avg"]/$mainData["mos_counter"],2);
			$mainData["mos_counter"] = 1;
		}
		return array($chartData, $statsData, $mainData);
	}
	public function doRTCPXRServerReport($timestamp, $param, $callids) {
		/* get our DB */
		$db = $this->getContainer('db');
		$db->select_db(DB_CONFIGURATION);
		$db->dbconnect();
		/* get our DB Abstract Layer */
		$layer = $this->getContainer('layer');
		$data = array();
		$lnodes = array();
		$newcorrid = array();
		if(isset($param['location'])) $lnodes = $param['location']['node'];
		$time['from'] = getVar('from', round((microtime(true) - 300) * 1000), $timestamp, 'long');
		$time['to'] = getVar('to', round(microtime(true) * 1000), $timestamp, 'long');
		$time['from_ts'] = floor($time['from']/1000);
		$time['to_ts'] = round($time['to']/1000);
		/* lets make a range */
		$time['from_ts']-=600;
		$time['to_ts']+=60;
		/* search fields */
		$node = getVar('node', NULL, $param['search'], 'string');
		$type = getVar('type', -1, $param['search'], 'int');
		$proto = getVar('proto', -1, $param['search'], 'int');
		$family = getVar('family', -1, $param['search'], 'int');
		$and_or = getVar('orand', NULL, $param['search'], 'string');
		$limit_orig = getVar('limit', 100, $param, 'int');
		$callwhere = array();
		$nodes = array();
		if(SINGLE_NODE == 1) $nodes[] = array( "dbname" =>  DB_HOMER, "name" => "single");
		else {
			foreach($lnodes as $lnd) $nodes[] = $this->getNode($lnd['name']);
		}
		$timearray = $this->getTimeArray($time['from_ts'], $time['to_ts']);
		$search['correlation_id'] = implode(";", $callids);
		$callwhere = generateWhere($search, $and_or, $db, 0);
		$callwhere[] = "type = 1";
		$layerHelper = array();
		$layerHelper['table'] = array();
		$layerHelper['order'] = array();
		$layerHelper['where'] = array();
		$layerHelper['fields'] = array();
		$layerHelper['table']['base'] = "report_capture";
		$layerHelper['where']['type'] = $and_or ? "OR" : "AND";
		$layerHelper['where']['param'] = $callwhere;
		$layerHelper['time'] = $time;
		foreach($nodes as $node) {
			$db->dbconnect_node($node);
			$limit = $limit_orig;
			if (defined('RTCP_TABLE_PARTITION') && RTCP_TABLE_PARTITION == 1){
				foreach($timearray as $tkey=>$tval) {
					$layerHelper['table']['type'] = "all";
					$layerHelper['table']['timestamp'] = $tkey;
				}
			}
			$layerHelper['order']['limit'] = $limit;
			$layerHelper['values'] = array();
			$layerHelper['values'][] = "*";
			$layerHelper['values'][] = "'".$node['name']."' as dbnode";
			$query = $layer->querySearchData($layerHelper);
			$noderows = $db->loadObjectArray($query);
			$data = array_merge($data,$noderows);
			$limit -= count($noderows);
		}
		/* sorting */
		usort($data, create_function('$a, $b', 'return $a["micro_ts"] > $b["micro_ts"] ? 1 : -1;'));
		$chartData = array();
		$mainData = array();
		$statsData = array();
		/* RTCP report fix */
		foreach ($data as $key => $field) {
			$ts = $data[$key]["micro_ts"];
			$msts = intval($ts/1000);
			list($head,$body) = explode("\r\n\r\n", $data[$key]["msg"]);
			$params = explode("\r\n", $body);
			$dataArray = array();
			foreach($params as $rhead=>$rbody) {
				list($m,$d) = explode(":",$rbody);
				if(preg_match("/=/", $d)) {
					$dataArray[$m] = array();
					$restars = explode(" ", $d);
					foreach($restars as $k1=>$v1) {
						list($k2,$v2) = explode("=",$v1);
						$dataArray[$m][$k2] = $v2;
					}
				}
				else $dataArray[$m] = $d;
			}
			//$src_ip = $data[$key]["source_ip"];
			//$dst_ip = $data[$key]["destination_ip"];
			/* exit */
			if(!array_key_exists("LocalAddr", $dataArray) && !array_key_exists("RemoteAddr", $dataArray)) {
				break;
			}
			$src_ip = $dataArray["LocalAddr"];
			$dst_ip =  $dataArray["RemoteAddr"];
			$ipkey= "RTCPXR ".$src_ip." -> ".$dst_ip;
			if(!array_key_exists($ipkey,  $chartData)) $chartData[$ipkey] = array();
			if(!array_key_exists("mos",  $chartData[$ipkey])) {
				$chartData[$ipkey]["mos"] = array();
				$chartData[$ipkey]["jitter"] = array();
				$chartData[$ipkey]["packets_lost"] = array();
				$statsData[$ipkey] = array();
				$statsData[$ipkey]["mos_counter"] =  0;
				$statsData[$ipkey]["mos_average"] =  0;
				$statsData[$ipkey]["mos_worst"] =  5;
				$statsData[$ipkey]["jitter_max"] =  0;
				$statsData[$ipkey]["jitter_avg"] =  0;
				$statsData[$ipkey]["delay"] =  0;
			}
			$tmpMos = floatval($dataArray["QualityEst"]["MOSCQ"]);
			$tmpJitter = floatval($dataArray["Delay"]["IAJ"]);
			$tmpPacketLost = floatval($dataArray["PacketLoss"]["NLR"]);
			$statsData[$ipkey]["mos_counter"] += 1;
			$statsData[$ipkey]["mos_average"] += $tmpMos;
			$statsData[$ipkey]["jitter_avg"] += $tmpJitter;
			$statsData[$ipkey]["packets_lost"] += $tmpPacketLost;
			if($tmpJitter > $statsData[$ipkey]["jitter_max"]) $statsData[$ipkey]["jitter_max"] = $tmpJitter;
			if(!array_key_exists("mos_worst", $statsData[$ipkey]) || $statsData[$ipkey]["mos_worst"] > $tmpMos) $statsData[$ipkey]["mos_worst"] = $tmpMos;
			$chartData[$ipkey]["mos"][]= array($msts, $tmpMos);
			$chartData[$ipkey]["jitter"][]=array($msts, $tmpJitter);
			$chartData[$ipkey]["packets_lost"][] = array($msts, $tmpPacketLost);
		}
		foreach($chartData as $key=>$value) {
			$statsData[$key]["mos_average"] = round($statsData[$key]["mos_average"]/$statsData[$key]["mos_counter"],2);
			$statsData[$key]["jitter_avg"] = round($statsData[$key]["jitter_avg"]/$statsData[$key]["mos_counter"],2);
			$statsData[$key]["mos_counter"] = 1;
			$mainData["mos_counter"]  += 1;
			$mainData["mos_average"]  += $statsData[$key]["mos_average"];
			$mainData["jitter_avg"]   += $statsData[$key]["jitter_avg"];
			$mainData["packets_lost"] += $statsData[$key]["packets_lost"];
			if(!array_key_exists("mos_worst", $mainData) || $statsData[$key]["mos_worst"] < $mainData["mos_worst"])
				$mainData["mos_worst"] = $statsData[$key]["mos_worst"];
			if($statsData[$key]["jitter_max"] > $mainData["jitter_max"]) $mainData["jitter_max"]= $statsData[$key]["jitter_max"];
		}
		/* sum of report */
		if(array_key_exists("mos_counter", $mainData) && $mainData["mos_counter"] != 0) {
			$mainData["mos_average"] = round($mainData["mos_average"]/$mainData["mos_counter"],2);
			$mainData["jitter_avg"] = round($mainData["jitter_avg"]/$mainData["mos_counter"],2);
			$mainData["mos_counter"] = 1;
		}
		return array($chartData, $statsData, $mainData);
	}
	public function doRtpAgentReport($timestamp, $param, $callids) {
		/* get our DB */
		$db = $this->getContainer('db');
		$db->select_db(DB_CONFIGURATION);
		$db->dbconnect();
		/* get our DB Abstract Layer */
		$layer = $this->getContainer('layer');
		$data = array();
		$lnodes = array();
		$newcorrid = array();
		if(isset($param['location'])) $lnodes = $param['location']['node'];
		$time['from'] = getVar('from', round((microtime(true) - 300) * 1000), $timestamp, 'long');
		$time['to'] = getVar('to', round(microtime(true) * 1000), $timestamp, 'long');
		$time['from_ts'] = floor($time['from']/1000);
		$time['to_ts'] = round($time['to']/1000);
		/* lets make a range */
		$time['from_ts']-=600;
		$time['to_ts']+=60;
		/* search fields */
		$node = getVar('node', NULL, $param['search'], 'string');
		$type = getVar('type', -1, $param['search'], 'int');
		$proto = getVar('proto', -1, $param['search'], 'int');
		$family = getVar('family', -1, $param['search'], 'int');
		$and_or = getVar('orand', NULL, $param['search'], 'string');
		$limit_orig = getVar('limit', 100, $param, 'int');
		$callwhere = array();
		$nodes = array();
		if(SINGLE_NODE == 1) $nodes[] = array( "dbname" =>  DB_HOMER, "name" => "single");
		else {
			foreach($lnodes as $lnd) $nodes[] = $this->getNode($lnd['name']);
		}
		$timearray = $this->getTimeArray($time['from_ts'], $time['to_ts']);
		$search['correlation_id'] = implode(";", $callids);
		$callwhere = generateWhere($search, $and_or, $db, 0);
		$callwhere[] = "(type = 2 OR type = 4)";
		$layerHelper = array();
		$layerHelper['table'] = array();
		$layerHelper['order'] = array();
		$layerHelper['where'] = array();
		$layerHelper['fields'] = array();
		$layerHelper['table']['base'] = "report_capture";
		$layerHelper['where']['type'] = $and_or ? "OR" : "AND";
		$layerHelper['where']['param'] = $callwhere;
		$layerHelper['time'] = $time;
		foreach($nodes as $node) {
			$db->dbconnect_node($node);
			$limit = $limit_orig;
			$layerHelper['order']['limit'] = $limit;
			$layerHelper['values'] = array();
			$layerHelper['values'][] = "*";
			$layerHelper['values'][] = "'".$node['name']."' as dbnode";
			$query = $layer->querySearchData($layerHelper);
			$noderows = $db->loadObjectArray($query);
			$data = array_merge($data,$noderows);
			$limit -= count($noderows);
		}
		/* sorting */
		usort($data, create_function('$a, $b', 'return $a["micro_ts"] > $b["micro_ts"] ? 1 : -1;'));
		$chartData = array();
		$mainData = array();
		$statsData = array();
		/* RTCP report fix */
		foreach ($data as $key => $field) {
			$ts = $data[$key]["micro_ts"];
			$msts = intval($ts/1000);
			if(!is_array($data[$key]["msg"])) {
				$d = json_decode($data[$key]["msg"], true);
				$data[$key]["msg"] = $d;
			}
			$dataArray = $data[$key]["msg"];
			$src_ip = $data[$key]["msg"]["SRC_IP"];
			$dst_ip = $data[$key]["msg"]["DST_IP"];
			$ipkey= "RTPAGENT[".$dataArray["CORRELATION_ID"]."] ".$src_ip." -> ".$dst_ip;
			/* final report */
			if($data[$key]["msg"]["TYPE"] == "FINAL") continue;
			if(!array_key_exists($ipkey,  $chartData)) $chartData[$ipkey] = array();
			if(!array_key_exists("mos",  $chartData[$ipkey])) {
				$chartData[$ipkey]["mos"] = array();
				$chartData[$ipkey]["packets"] = array();
				$chartData[$ipkey]["jitter"] = array();
				$chartData[$ipkey]["packets_lost"] = array();
				$chartData[$ipkey]["packets"] =  array();
				$statsData[$ipkey] = array();
				$statsData[$ipkey]["mos_counter"] =  0;
				$statsData[$ipkey]["mos_average"] =  0;
				$statsData[$ipkey]["mos_worst"] =  5;
				$statsData[$ipkey]["packet_sent"] =  0;
				$statsData[$ipkey]["packet_recv"] =  0;
				$statsData[$ipkey]["jitter_max"] =  0;
				$statsData[$ipkey]["jitter_avg"] =  0;
				$statsData[$ipkey]["delay"] =  0;
			}
			$tmpMos = floatval($dataArray["MOS"]);
			$tmpJitter = floatval($dataArray["JITTER"]);
			$tmpPacketLost = floatval($dataArray["PACKET_LOSS"]);
			if(array_key_exists("MAX_JITTER",$dataArray)) {
				$maxJitter = floatval($dataArray["MAX_JITTER"]);
			}
			else {
				$maxJitter = floatval($dataArray["JITTER"]);
			}
			if(array_key_exists("MIN_MOS",$dataArray)) {
				$minMos = floatval($dataArray["MIN_MOS"]);
			}
			else {
				$minMos = floatval($dataArray["MOS"]);
			}
			$statsData[$ipkey]["mos_counter"] += 1;
			$statsData[$ipkey]["packet_total"] += $dataArray["TOTAL_PK"];
			$statsData[$ipkey]["mos_average"] += $tmpMos;
			$statsData[$ipkey]["jitter_avg"] += $tmpJitter;
			$statsData[$ipkey]["packets_lost"] += $tmpPacketLost;
			if($maxJitter > $statsData[$ipkey]["jitter_max"]) $statsData[$ipkey]["jitter_max"] = $maxJitter;
			if(!array_key_exists("mos_worst", $statsData[$ipkey]) || $statsData[$ipkey]["mos_worst"] > $minMos) $statsData[$ipkey]["mos_worst"] = $minMos;
			$chartData[$ipkey]["mos"][]= array($msts, $tmpMos);
			$chartData[$ipkey]["jitter"][]=array($msts, $tmpJitter);
			$chartData[$ipkey]["packets"][]=array($msts, $dataArray["TOTAL_PK"]);
			$chartData[$ipkey]["packets_lost"][] = array($msts, $tmpPacketLost);
		}
		foreach($chartData as $key=>$value) {
			$statsData[$key]["mos_average"] = round($statsData[$key]["mos_average"]/$statsData[$key]["mos_counter"],2);
			$statsData[$key]["jitter_avg"] = round($statsData[$key]["jitter_avg"]/$statsData[$key]["mos_counter"],2);
			$statsData[$key]["mos_counter"] = 1;
			$mainData["mos_counter"]  += 1;
			$mainData["mos_average"]  += $statsData[$key]["mos_average"];
			$mainData["jitter_avg"]   += $statsData[$key]["jitter_avg"];
			$mainData["packets_lost"] += $statsData[$key]["packets_lost"];
			$mainData["jitter_avg"]   += $statsData[$key]["jitter_avg"];
			$mainData["total_pk"] += $statsData[$key]["packet_total"];
			if(!array_key_exists("mos_worst", $mainData) || $statsData[$key]["mos_worst"] < $mainData["mos_worst"])
				$mainData["mos_worst"] = $statsData[$key]["mos_worst"];
			if($statsData[$key]["jitter_max"] > $mainData["jitter_max"]) $mainData["jitter_max"]= $statsData[$key]["jitter_max"];
		}
		/* sum of report */
		if(array_key_exists("mos_counter", $mainData) && $mainData["mos_counter"] != 0) {
			$mainData["mos_average"] = round($mainData["mos_average"]/$mainData["mos_counter"],2);
			$mainData["jitter_avg"] = round($mainData["jitter_avg"]/$mainData["mos_counter"],2);
			$mainData["mos_counter"] = 1;
		}
		//$mainData["jitter_max"] = $dataArray["MAX_JITTER"];
		//$mainData["jitter_min"] = $dataArray["MIN_JITTER"];
		//$mainData["total_pk"] = $dataArray["TOTAL_PK"];
		//$mainData["tl_byte"] = $dataArray["TL_BYTE"];
		//$mainData["type"] = $dataArray["TOTAL_PK"];
		return array($chartData, $statsData, $mainData);
	}
	public function doHoraclifixReport($timestamp, $param, $callids) {
		/* get our DB */
		$db = $this->getContainer('db');
		$db->select_db(DB_CONFIGURATION);
		$db->dbconnect();
		/* get our DB Abstract Layer */
		$layer = $this->getContainer('layer');
		$data = array();
		$lnodes = array();
		$newcorrid = array();
		if(isset($param['location'])) $lnodes = $param['location']['node'];
		$time['from'] = getVar('from', round((microtime(true) - 300) * 1000), $timestamp, 'long');
		$time['to'] = getVar('to', round(microtime(true) * 1000), $timestamp, 'long');
		$time['from_ts'] = floor($time['from']/1000);
		$time['to_ts'] = round($time['to']/1000);
		/* lets make a range */
		$time['from_ts']-=600;
		$time['to_ts']+=60;
		/* search fields */
		$node = getVar('node', NULL, $param['search'], 'string');
		$type = getVar('type', -1, $param['search'], 'int');
		$proto = getVar('proto', -1, $param['search'], 'int');
		$family = getVar('family', -1, $param['search'], 'int');
		$and_or = getVar('orand', NULL, $param['search'], 'string');
		$limit_orig = getVar('limit', 100, $param, 'int');
		$callwhere = array();
		$nodes = array();
		if(SINGLE_NODE == 1) $nodes[] = array( "dbname" =>  DB_HOMER, "name" => "single");
		else {
			foreach($lnodes as $lnd) $nodes[] = $this->getNode($lnd['name']);
		}
		$timearray = $this->getTimeArray($time['from_ts'], $time['to_ts']);
		$search['correlation_id'] = implode(";", $callids);

		$callwhere = generateWhere($search, $and_or, $db, 0);
		$callwhere[] = "type = 38";
		$layerHelper = array();
		$layerHelper['table'] = array();
		$layerHelper['order'] = array();
		$layerHelper['where'] = array();
		$layerHelper['fields'] = array();
		$layerHelper['table']['base'] = "report_capture";
		$layerHelper['where']['type'] = $and_or ? "OR" : "AND";
		$layerHelper['where']['param'] = $callwhere;
		$layerHelper['time'] = $time;
		foreach($nodes as $node) {
				$db->dbconnect_node($node);
				$limit = $limit_orig;
				if (defined('REPORT_TABLE_PARTITION') && REPORT_TABLE_PARTITION == 1){
						foreach($timearray as $tkey=>$tval) {
								$layerHelper['table']['type'] = "all";
								$layerHelper['table']['timestamp'] = $tkey;
						}
				}
				$layerHelper['order']['limit'] = $limit;
				$layerHelper['values'] = array();
				$layerHelper['values'][] = "*";
				$layerHelper['values'][] = "'".$node['name']."' as dbnode";
				$query = $layer->querySearchData($layerHelper);
				$noderows = $db->loadObjectArray($query);
				$data = array_merge($data,$noderows);
				if(SYSLOG_ENABLE == 1) syslog(LOG_WARNING,"Horaclifix Query: ".$query);
				$limit -= count($noderows);
		}
		/* sorting */
		usort($data, create_function('$a, $b', 'return $a["micro_ts"] > $b["micro_ts"] ? 1 : -1;'));
		$chartData = array();
		$mainData = array();
		$statsData = array();
		/* RTCP report fix */
		foreach ($data as $key => $field) {
			$ts = $data[$key]["micro_ts"];
			$msts = intval($ts/1000);
			if(!is_array($data[$key]["msg"])) {
				$d = json_decode($data[$key]["msg"], true);
				$data[$key]["msg"] = $d;
			}
			$dataArray = $data[$key]["msg"];

			$caller_src_ip = $data[$key]["msg"]["CALLER_SRC_IP"];
			$caller_dst_ip = $data[$key]["msg"]["CALLER_DST_IP"];
			$callee_src_ip = $data[$key]["msg"]["CALLEE_SRC_IP"];
			$callee_dst_ip = $data[$key]["msg"]["CALLEE_DST_IP"];
			$ipkey= "HORACLIFIX[".$dataArray["INC_ID"]."] ".$caller_src_ip." -> ".$caller_dst_ip;
			//$ipkey= "Horaclifix[".$dataArray["INC_REALM"]."/".$dataArray["OUT_REALM"]."] "."IN: ".$caller_src_ip." -> ".$caller_dst_ip." OUT: ".$callee_src_ip." <- ".$callee_dst_ip;
			if(!array_key_exists($ipkey,  $chartData)) $chartData[$ipkey] = array();
		}

		// This will be column 1
		$mainData["inc_rtp_byte"] =  $dataArray["INC_RTP_BYTE"];
		$mainData["inc_rtp_pk"] =  $dataArray["INC_RTP_PK"];
		$mainData["inc_rtcp_byte"] =  $dataArray["INC_RTCP_BYTE"];
		$mainData["inc_rtcp_pk"] =  $dataArray["INC_RTCP_PK"];
		$mainData["inc_rtp_pk_loss"] =  $dataArray["INC_RTP_PK_LOSS"];
		$mainData["inc_rtcp_pk_loss"] =  $dataArray["INC_RTCP_PK_LOSS"];

		$mainData["out_rtp_byte"] =  $dataArray["OUT_RTP_BYTE"];
		$mainData["out_rtp_pk"] =  $dataArray["OUT_RTP_PK"];
		$mainData["out_rtcp_byte"] =  $dataArray["OUT_RTCP_BYTE"];
		$mainData["out_rtcp_pk"] =  $dataArray["OUT_RTCP_PK"];
		$mainData["out_rtp_pk_loss"] =  $dataArray["OUT_RTP_PK_LOSS"];
		$mainData["out_rtcp_pk_loss"] =  $dataArray["OUT_RTCP_PK_LOSS"];
		// This will be column 2
		$mainData["inc_rtp_avg_jitter"] =  $dataArray["INC_RTP_AVG_JITTER"];
		$mainData["inc_rtp_max_jitter"] =  $dataArray["INC_RTP_MAX_JITTER"];
		$mainData["inc_rtcp_avg_jitter"] =  $dataArray["INC_RTCP_AVG_JITTER"];
		$mainData["inc_rtcp_max_jitter"] =  $dataArray["INC_RTCP_MAX_JITTER"];
		$mainData["inc_rtcp_avg_lat"] =  $dataArray["INC_RTCP_AVG_LAT"];
		$mainData["inc_rtcp_max_lat"] =  $dataArray["INC_RTCP_MAX_LAT"];

		$mainData["out_rtp_avg_jitter"] =  $dataArray["OUT_RTP_AVG_JITTER"];
		$mainData["out_rtp_max_jitter"] =  $dataArray["OUT_RTP_MAX_JITTER"];
		$mainData["out_rtcp_avg_jitter"] =  $dataArray["OUT_RTCP_AVG_JITTER"];
		$mainData["out_rtcp_max_jitter"] =  $dataArray["OUT_RTCP_MAX_JITTER"];
		$mainData["out_rtcp_avg_lat"] =  $dataArray["OUT_RTCP_AVG_LAT"];
		$mainData["out_rtcp_max_lat"] =  $dataArray["OUT_RTCP_MAX_LAT"];
		// This will be column 3
		$mainData["inc_mos"] =  floatval($dataArray["INC_MOS"])/100;
		$mainData["inc_rval"] =  floatval($dataArray["INC_RVAL"])/100;
		$mainData["caller_vlan"] =  $dataArray["CALLER_VLAN"];
		$mainData["caller_src_port"] =  $dataArray["CALLER_SRC_PORT"];
		$mainData["caller_dst_port"] =  $dataArray["CALLER_DST_PORT"];

		$mainData["out_mos"] =  floatval($dataArray["OUT_MOS"])/100;
		$mainData["out_rval"] =  floatval($dataArray["OUT_RVAL"])/100;
		$mainData["callee_vlan"] =  $dataArray["CALLEE_VLAN"];
		$mainData["callee_src_port"] =  $dataArray["CALLEE_SRC_PORT"];
		$mainData["callee_dst_port"] =  $dataArray["CALLEE_DST_PORT"];
		$mainData["media_type"] =  $dataArray["MEDIA_TYPE"];

		return array($chartData, $statsData, $mainData);
	}
	public function calculateJitterMos($rtt, $jitter, $numpacketlost) {
		if($rtt == 0) $rtt = 10;
		$effective_latency = $rtt + ($jitter * 2) + 10;
		$mos_val = 0;
		$r_factor = 0;
		if ($effective_latency < 160) {
			$r_factor = 93.2 - ($effective_latency / 40);
		}
		else {
			$r_factor = 93.2 - ($effective_latency - 120) / 10;
		}
		$r_factor = $r_factor - ($numpacketlost * 2.5);
		if ($r_factor > 100) $r_factor = 100;
		else if ($r_factor < 0) $r_factor = 0;
		$mos_val = 1 + (0.035) * ($r_factor) + (0.000007) * ($r_factor) * (($r_factor) - 60) * (100 - ($r_factor));
		if ($mos_val > 4.7) $mos_val = 4.7;
		return ($mos_val);
	}
	public function getCodecsFromMessagesForTransaction($timestamp, $param) {
		/* get our DB */
		$db = $this->getContainer('db');
		$db->select_db(DB_CONFIGURATION);
		$db->dbconnect();
		/* get our DB Abstract Layer */
		$layer = $this->getContainer('layer');
		$trans = array();
		$data = array();
		$lnodes = array();
		if(isset($param['location'])) $lnodes = $param['location']['node'];
		$trans['call'] = getVar('call', false, $param['transaction'], 'bool');
		$trans['registration'] = getVar('registration', false, $param['transaction'], 'bool');
		$trans['rest'] = getVar('rest', false, $param['transaction'], 'bool');
		/* default transaction */
		if(!$trans['call'] && !$trans['registration'] && !$trans['rest']) {
			$trans['rest'] = true;
			$trans['registration'] = true;
			$trans['call'] = true;
		}
		$location = $param['location'];
		$time['from'] = getVar('from', round((microtime(true) - 300) * 1000), $timestamp, 'long');
		$time['to'] = getVar('to', round(microtime(true) * 1000), $timestamp, 'long');
		$time['from_ts'] = floor($time['from']/1000);
		$time['to_ts'] = round($time['to']/1000);
		//workaround for BYE click
		$time['from_ts'] -=600;
		$limit_orig = getVar('limit', 200, $param['search'], 'int');
		if($limit_orig <= 0) $limit_orig = 200;
		$record_id = getVar('id', 0, $param['search'], 'int');
		$callids = getVar('callid', array(), $param['search'], 'array');
		$b2b = getVar('b2b', true, $param['search'], 'bool');
		$uniq = getVar('uniq', false, $param['search'], 'bool');
		$callwhere = array();
		$utils['logic_or'] = getVar('logic', false, array_key_exists('query', $param) ? $param['query'] : array(), 'bool');
		$and_or = $utils['logic_or'] ? " OR " : " AND ";
		$search = array();
		/* make array */
		$search['callid'] = implode(";", $callids);
		//$search['content_type'] = "application/sdp";
		$callwhere = generateWhere($search, $and_or, $db, $b2b);
		$nodes = array();
		if(SINGLE_NODE == 1) $nodes[] = array( "dbname" =>  DB_HOMER, "name" => "single");
		else {
			foreach($lnodes as $lnd) $nodes[] = $this->getNode($lnd['name']);
		}
		$timearray = $this->getTimeArray($time['from_ts'], $time['to_ts']);
		$layerHelper = array();
		$layerHelper['table'] = array();
		$layerHelper['order'] = array();
		$layerHelper['where'] = array();
		$layerHelper['fields'] = array();
		$layerHelper['table']['base'] = "sip_capture";
		$layerHelper['where']['type'] = $and_or ? "OR" : "AND";
		$layerHelper['where']['param'] = $callwhere;
		$layerHelper['time'] = $time;
		$layerHelper['fields']['msg'] = true;
		$layerHelper['order']['by'] = "id";
		$layerHelper['order']['type'] = "DESC";
		foreach($nodes as $node) {
			$db->dbconnect_node($node);
			$limit = $limit_orig;
			$ts = $time['from_ts'];
			foreach($timearray as $tkey=>$tval) {
				if($trans["call"]) {
					if($limit < 1) break;
					$layerHelper['table']['type'] = "call";
					$layerHelper['table']['timestamp'] = $tkey;
					$layerHelper['order']['limit'] = $limit;
					$layerHelper['values'] = array();
					$layerHelper['values'][] = FIELDS_CAPTURE;
					if($uniq) $layerHelper['values'][] = "MD5(msg) as md5sum";
					$query = $layer->querySearchData($layerHelper);
					$noderows = $db->loadObjectArray($query);
					$data = array_merge($data,$noderows);
					$limit -= count($noderows);
				}
			}
		}
		if($uniq) {
			$message = array();
			foreach($data as $key=>$row) {
				if(isset($message[$row['md5sum']])) unset($data[$key]);
				else $message[$row['md5sum']] = $row['node'];
			}
		}
		/* sorting */
		usort($data, create_function('$a, $b', 'return $a["micro_ts"] > $b["micro_ts"] ? 1 : -1;'));
		$startTime = intval($data[0]["micro_ts"]/1000);
		$endTime = intval($data[count($data)-1]["micro_ts"]/1000);
		$duration = ($endTime - $startTime);
		if(count($data) > 0) $leg1Callid = $data[0]["callid"];
		#print "Start: $startTime, EndTime: $endTime, Duration: $duration, Callid: ". $leg1Callid."\n";
		$parseit = array();
		$rtpstats = array();
		$preset = array();
		$cseq = array();
		foreach($data as $k=>$d) {
			$callid = $d["callid"];
			if(!array_key_exists($callid,  $preset)) {
				$preset[$callid] = array();
				$preset[$callid]["aparty"] = array();
				$preset[$callid]["bparty"] = array();
				$cseq[$callid] = array();
			}
			/* normal INVITE */
			if($d["method"] == "INVITE" && $d["content_type"] == "application/sdp" && strlen($d["to_tag"]) == 0) {
				$preset[$callid]["aparty"][] = $d;
				$cseq[$callid]["invcseq"][] = $d["cseq"];
			}
			else if($d["method"] == "ACK" && $d["content_type"] == "application/sdp") {
				$preset[$callid]["aparty"][] = $d;
				$cseq[$callid]["invcseq"][] = $d["cseq"];
			}
			else if($d["method"] == "200" && preg_match("/INVITE/i", $d["cseq"]) && $d["content_type"] == "application/sdp") {
				/* check if this is our reply */
				if(in_array($d["cseq"], $cseq[$callid]["invcseq"]) || empty($cseq[$callid])) $preset[$callid]["bparty"][] = $d;
			}
			else if(preg_match("/BYE/i", $d["cseq"]) && strlen($d["rtp_stat"]) != 0) {
				$rtpstats = $this->doXRTPReport($d["rtp_stat"]);
			}
			# print "$key\n";
			# print "MSG: ".$value["msg"]."\n";
		}
		$export = array();
		$export["calls"] = array();
		/*
		$export["calls"][$leg1Callid] = array();
		$export["calls"][$leg1Callid]["aparty"] = array();
		$export["calls"][$leg1Callid]["aparty"]["metric"] = array();
		$export["calls"][$leg1Callid]["aparty"]["metric"]["start"] = $startTime;
		$export["calls"][$leg1Callid]["aparty"]["metric"]["end"] = $endTime;
		$export["calls"][$leg1Callid]["aparty"]["metric"]["duration"] = $duration;
		$export["calls"][$leg1Callid]["bparty"] = array();
		$export["calls"][$leg1Callid]["bparty"]["metric"] = array();
		$export["calls"][$leg1Callid]["bparty"]["metric"]["start"] = $startTime;
		$export["calls"][$leg1Callid]["bparty"]["metric"]["end"] = $endTime;
		$export["calls"][$leg1Callid]["bparty"]["metric"]["duration"] = $duration;
		*/
		/* set rtp stats */
		//if(count($rtpstats)) $export["calls"][$leg1Callid]["rtpstats"] = $rtpstats;
		$globalAudio = array();
		$globalVideo = array();
		$globalAudioIndex = array();
		$globalVideoIndex = array();
		$apartyAudioIndex = array();
		$apartyVideoIndex = array();
		foreach($preset as $cid=>$das) {
			/* with callid */
			foreach($das as $party=>$rec) {
				foreach($rec as $ks=>$kd) {
					$src_ip = $kd["source_ip"];
					$dst_ip = $kd["destination_ip"];
					$sipheaders = explode("\r\n",$kd["msg"]);
					$audio  = array();
					$video  = array();
					$apt = -1;
					$vpt = -1;
					$branch = "";
					foreach($sipheaders as $s=>$d) {
						if(preg_match("/^c=IN IP/i", $d)) {
							$t = explode(" ", $d);
							$audio["ip"]=$t[2];
						}
						else if($branch == "" && preg_match("/Via:(.*)branch=/i", $d)) {
							$t = explode("branch=", $d);
							if(preg_match("/;/i", $t[1])) {
								$r = explode(";", $t[1]);
								$branch = $r[0];
							}
							else {
								$branch = $t[1];
							}
						}
						else if(preg_match("/^m=audio/i", $d)) {
							$t = explode(" ", $d);
							$audio["port"] = $t[1];
							$audio["pt"] = $t[3];
							$apt = $t[3];
						}
						else if(preg_match("/^m=video/i", $d)) {
							$t = explode(" ", $d);
							$video["port"] = $t[1];
							$video["pt"] = $t[3];
							$vpt = $t[3];
							$video["ip"]=$audio["ip"];
						}
						else if(preg_match("/^a=rtpmap:/i", $d)) {
							$t = explode(" ", $d);
							if(preg_match("/telephone-event/i", $t[1])) {
								$audio["dtmf"]="rfc2833";
							}
							else if(preg_match("/^a=rtpmap:$apt /i", $d)) {
								$audio["description"]=$t[1];
							}
							else if(preg_match("/^a=rtpmap:$vpt /i", $d)) {
								$video["description"]=$t[1];
							}
						}
					}
					if(count($audio) || count($video)) {
						if(!array_key_exists($cid,  $export["calls"])) {
							$export["calls"][$cid] = array();
							$export["calls"][$cid][$party] = array();
							$export["calls"][$cid][$party]["audio"] = array();
							$export["calls"][$cid][$party]["video"] = array();
							$export["calls"][$cid][$party]["metric"] = array();
							$export["calls"][$cid][$party]["metric"]["start"] = $startTime;
							$export["calls"][$cid][$party]["metric"]["end"] = $endTime;
							$export["calls"][$cid][$party]["metric"]["duration"] = $duration;
							$globalAudioIndex[$cid] = 0;
							$globalVideoIndex[$cid] = 0;
						}
						if(count($audio)) {
							$akey = $cid.$party.$audio["ip"].":".$audio["port"]."_".$branch;
							/* prevent duplication */
							if(!array_key_exists($akey,  $globalAudio)) {
								$aIndex = 0;
								$ks = $cid."_".$branch;
								if($party == "aparty") {
									$aIndex = $globalAudioIndex[$cid];
									$apartyAudioIndex[$cid][$ks] = $aIndex;
									$globalAudioIndex[$cid]++;
								}
								else {
									$aIndex = $globalAudioIndex[$cid];
									if(array_key_exists($ks,  $apartyAudioIndex[$cid])) $aIndex =  $apartyAudioIndex[$cid][$ks];
									//print "JOPA bparty: $aIndex\n";
								}
								$audio["branch"] = $branch;
								$zd = "k".$aIndex;
								$export["calls"][$cid][$party]["audio"][$zd] = $audio;
								$globalAudio[$akey] = 1;
							}
						}
						if(count($video)) {
							$vkey = $cid.$party.$video["ip"].":".$video["port"]."_".$branch;
							if(!array_key_exists($akey,  $globalVideo)) {
								$aIndex = 0;
								$ks = $cid."_".$branch;
								if($party == "aparty") {
									$aIndex = $globalVideoIndex[$cid];
									$apartyVideoIndex[$cid][$ks] = $aIndex;
									$globalVideoIndex[$cid]++;
								}
								else {
									$aIndex = $globalVideoIndex[$cid];
									if(array_key_exists($ks,  $apartyVideoIndex[$cid])) $aIndex =  $apartyVideoIndex[$cid][$ks];
								}
								$video["branch"] = $branch;
								$zd = "k".$aIndex;
								$export["calls"][$cid][$party]["video"][$zd] = $video;
								$globalVideo[$vkey] = 1;
							}
						}
					}
				}
			}
		}
		$pt = -1;
		//print_r($export);
		//print_r($parseit);
		return array($export, $duration, $rtpstats);
	}
	public function doXRTPReport($report) {
		$answer = array();
		$datas = explode(";", $report);
		foreach ($datas as $a=>$d) {
			list($key, $value) = explode("=", $d);
			switch($key) {
				case 'CS':
						$res = 'call_setup_time';
						break;
				case 'ES':
						$res = 'expected_packets_sent';
						break;
				case 'ER':
						$res = 'expected_packets_received';
						break;
				case 'OS':
						$res = 'audio_octets_sent';
						break;
				case 'OR':
						$res = 'audio_octets_received';
						break;
				case 'EN':
						$res = 'encoders';
						break;
				case 'DE':
						$res = 'decoders';
						break;
				case 'DL':
						$res = 'rtt';
						break;
				case 'CD':
						$res = 'sec';
						break;
				case 'JI':
						$res = 'jitter_avg';
						break;
				case 'PR':
						$res = 'packets_recv';
						break;
				case 'PS':
						$res = 'packets_sent';
						break;
				case 'PL':
						$res = 'packets_lost';
						break;
				case 'PD':
						$res = 'delay';
						break;
				case 'IP':
						$res = 'media_ip_port';
						break;
				case 'EX':
						$res = 'reporter';
						break;
				default:
						$res = '';
						break;
			}
			if(strlen($res)) {
				if($res == 'jitter_avg' && preg_match("/,/i", $value)) {
					list($val1, $val2) = explode(",", $value);
					$answer[$res] = $val1;
					$answer['jitter_max'] = $val2;
				}
				else if($res == 'rtt' && preg_match("/,/i", $value)) {
					list($val1, $val2, $val3) = explode(",", $value);
					$answer['rtt_mean'] = $val1;
					$answer['rtt_min'] = $val2;
					$answer['rtt_max'] = $val3;
				}
				else if($res == 'packets_lost' && preg_match("/,/i", $value)) {
					list($val1, $val2) = explode(",", $value);
					$answer['packets_lost_sent'] = $val1;
					$answer['packets_lost_recv'] = $val2;
					$answer['packets_lost'] = $val1 + $val2;
				}
				else $answer[$res] = $value;
			}
		}
		if(!array_key_exists('mos_avg', $answer) && array_key_exists('packets_lost', $answer)) {
			$mos = $this->calculateJitterMos($answer['rtt_mean'], $answer['jitter_avg'], $answer['packets_lost']);
			$answer['mos_avg'] = $mos;
			$answer['mos_worst'] = $mos;
		}
		return $answer;
	}
	public function doLogReport($timestamp, $param) {
		/* get our DB */
		$db = $this->getContainer('db');
		$db->select_db(DB_CONFIGURATION);
		$db->dbconnect();
		/* get our DB Abstract Layer */
		$layer = $this->getContainer('layer');
		$data = array();
		$search = array();
		$lnodes = array();
		$answer = array();
		$callwhere = array();
		//if(array_key_exists('node', $param)) $lnodes = $param['node'];
		if(isset($param['location'])) $lnodes = $param['location']['node'];
		$time['from'] = getVar('from', round((microtime(true) - 300) * 1000), $timestamp, 'long');
		$time['to'] = getVar('to', round(microtime(true) * 1000), $timestamp, 'long');
		$time['from_ts'] = floor($time['from']/1000);
		$time['to_ts'] = round($time['to']/1000);
		$time['from_ts']-=600;
		$time['to_ts']+=60;
		/* search fields */
		$type = getVar('uniq', -1, $param['search'], 'int');
		$node = getVar('node', NULL, $param['search'], 'string');
		$proto = getVar('proto', -1, $param['search'], 'int');
		$family = getVar('family', -1, $param['search'], 'int');
		$and_or = getVar('orand', NULL, $param['search'], 'string');
		$limit_orig = getVar('limit', 100, $param, 'int');
		$callids = getVar('callid', array(), $param['search'], 'array');
		$mapsCallid = array();
		$cn = count($callids);
		for($i=0; $i < $cn; $i++) {
			$mapsCallid[$callids[$i]] =  $callids[$i];
			if(BLEGCID == "b2b") {
				$length = strlen(BLEGTAIL);
				if(substr($callids[$i], -$length) == BLEGTAIL) {
					$k = substr($callids[$i], 0, -$length);
					$mapsCallid[$k] = $k;
				}
				else {
					$k = $callids[$i].BLEGTAIL;
					$mapsCallid[$k] = $k;
				}
				$s = substr($k, 0, -1);
				$mapsCallid[$s] =  $s;
			}
			$k = substr($callids[$i], 0, -1);
			$mapsCallid[$k] =  $k;
		}
		$answer = array();
		if(empty($mapsCallid)) {
			$answer['sid'] = session_id();
			$answer['auth'] = 'true';
			$answer['status'] = 200;
			$answer['message'] = 'no data';
			$answer['data'] = $data;
			$answer['count'] = count($data);
			return $answer;
		}
		$search['correlation_id'] = implode(";",  array_keys($mapsCallid));
		$nodes = array();
		if(SINGLE_NODE == 1) $nodes[] = array( "dbname" =>  DB_HOMER, "name" => "single");
		else {
			foreach($lnodes as $lnd) $nodes[] = $this->getNode($lnd['name']);
		}
		if(empty($callwhere)) $callwhere = generateWhere($search, $and_or, $db, 0);
		$layerHelper = array();
		$layerHelper['table'] = array();
		$layerHelper['order'] = array();
		$layerHelper['where'] = array();
		$layerHelper['fields'] = array();
		$layerHelper['table']['base'] = "logs_capture";
		$layerHelper['where']['type'] = $and_or ? "OR" : "AND";
		$layerHelper['where']['param'] = $callwhere;
		$layerHelper['time'] = $time;
		foreach($nodes as $node) {
			$db->dbconnect_node($node);
			$limit = $limit_orig;
			$layerHelper['order']['limit'] = $limit;
			$layerHelper['values'] = array();
			$layerHelper['values'][] = "*";
			$layerHelper['values'][] = "'".$node['name']."' as dbnode";
			$query = $layer->querySearchData($layerHelper);
			$noderows = $db->loadObjectArray($query);
			$data = array_merge($data,$noderows);
			$limit -= count($noderows);
		}
		/* sorting */
		usort($data, create_function('$a, $b', 'return $a["micro_ts"] > $b["micro_ts"] ? 1 : -1;'));
		if(empty($data)) {
			$answer['sid'] = session_id();
			$answer['auth'] = 'true';
			$answer['status'] = 200;
			$answer['message'] = 'no data';
			$answer['data'] = $data;
			$answer['count'] = count($data);
		}
		else {
			$answer['status'] = 200;
			$answer['sid'] = session_id();
			$answer['auth'] = 'true';
			$answer['message'] = 'ok';
			$answer['data'] = $data;
			$answer['count'] = count($data);
		}
		return $answer;
	}
	public function doRtcReport($timestamp, $param) {
		/* get our DB */
		$db = $this->getContainer('db');
		$db->select_db(DB_CONFIGURATION);
		$db->dbconnect();
		/* get our DB Abstract Layer */
		$layer = $this->getContainer('layer');
		$data = array();
		$search = array();
		$lnodes = array();
		$answer = array();
		$callwhere = array();
		//if(array_key_exists('node', $param)) $lnodes = $param['node'];
		if(isset($param['location'])) $lnodes = $param['location']['node'];
		$time['from'] = getVar('from', round((microtime(true) - 300) * 1000), $timestamp, 'long');
		$time['to'] = getVar('to', round(microtime(true) * 1000), $timestamp, 'long');
		$time['from_ts'] = floor($time['from']/1000);
		$time['to_ts'] = round($time['to']/1000);
		$time['from_ts']-=600;
		$time['to_ts']+=60;
		/* search fields */
		$type = getVar('uniq', -1, $param['search'], 'int');
		$node = getVar('node', NULL, $param['search'], 'string');
		$proto = getVar('proto', -1, $param['search'], 'int');
		$family = getVar('family', -1, $param['search'], 'int');
		$and_or = getVar('orand', NULL, $param['search'], 'string');
		$limit_orig = getVar('limit', 100, $param, 'int');
		$callids = getVar('callid', array(), $param['search'], 'array');
		$mapsCallid = array();
		$cn = count($callids);
		for($i=0; $i < $cn; $i++) {
			$mapsCallid[$callids[$i]] =  $callids[$i];
			if(BLEGCID == "b2b") {
				$length = strlen(BLEGTAIL);
				if(substr($callids[$i], -$length) == BLEGTAIL) {
					$k = substr($callids[$i], 0, -$length);
					$mapsCallid[$k] = $k;
				}
				else {
					$k = $callids[$i].BLEGTAIL;
					$mapsCallid[$k] = $k;
				}
				$s = substr($k, 0, -1);
				$mapsCallid[$s] =  $s;
			}
			$k = substr($callids[$i], 0, -1);
			$mapsCallid[$k] =  $k;
		}
		$answer = array();
		if(empty($mapsCallid)) {
			$answer['sid'] = session_id();
			$answer['auth'] = 'true';
			$answer['status'] = 200;
			$answer['message'] = 'no data';
			$answer['data'] = $data;
			$answer['count'] = count($data);
			return $answer;
		}
		$search['correlation_id'] = implode(";",  array_keys($mapsCallid));
		$nodes = array();
		if(SINGLE_NODE == 1) $nodes[] = array( "dbname" =>  DB_HOMER, "name" => "single");
		else {
			foreach($lnodes as $lnd) $nodes[] = $this->getNode($lnd['name']);
		}
		if(empty($callwhere)) $callwhere = generateWhere($search, $and_or, $db, 0);
		$layerHelper = array();
		$layerHelper['table'] = array();
		$layerHelper['order'] = array();
		$layerHelper['where'] = array();
		$layerHelper['fields'] = array();
		$layerHelper['table']['base'] = "webrtc_capture";
		$layerHelper['where']['type'] = $and_or ? "OR" : "AND";
		$layerHelper['where']['param'] = $callwhere;
		$layerHelper['time'] = $time;
		foreach($nodes as $node) {
			$db->dbconnect_node($node);
			$limit = $limit_orig;
			$layerHelper['order']['limit'] = $limit;
			$layerHelper['values'] = array();
			$layerHelper['values'][] = "*";
			$layerHelper['values'][] = "'".$node['name']."' as dbnode";
			$query = $layer->querySearchData($layerHelper);
			$noderows = $db->loadObjectArray($query);
			$data = array_merge($data,$noderows);
			$limit -= count($noderows);
		}
		/* sorting */
		usort($data, create_function('$a, $b', 'return $a["micro_ts"] > $b["micro_ts"] ? 1 : -1;'));
		if(empty($data)) {
			$answer['sid'] = session_id();
			$answer['auth'] = 'true';
			$answer['status'] = 200;
			$answer['message'] = 'no data';
			$answer['data'] = $data;
			$answer['count'] = count($data);
		}
		else {
			$answer['status'] = 200;
			$answer['sid'] = session_id();
			$answer['auth'] = 'true';
			$answer['message'] = 'ok';
			$answer['data'] = $data;
			$answer['count'] = count($data);
		}
		return $answer;
	}
	public function doRemoteLog($timestamp, $param) {
		$data = array();
		$search = array();
		$lnodes = array();
		$answer = array();
		$callwhere = array();
		if(REMOTE_LOG == 0) {
			$answer['sid'] = session_id();
			$answer['auth'] = 'true';
			$answer['status'] = 404;
			$answer['message'] = 'Not enabled';
			$answer['data'] = array();
			return $answer;
		}
		/* get our DB */
		$db = $this->getContainer('db');
		//if(array_key_exists('node', $param)) $lnodes = $param['node'];
		if(isset($param['location'])) $lnodes = $param['location']['node'];
		$time['from'] = getVar('from', round((microtime(true) - 300) * 1000), $timestamp, 'long');
		$time['to'] = getVar('to', round(microtime(true) * 1000), $timestamp, 'long');
		$time['from_ts'] = floor($time['from']/1000);
		$time['to_ts'] = round($time['to']/1000);
		$time['from_ts']-=600;
		$time['to_ts']+=60;
		/* search fields */
		$type = getVar('uniq', -1, $param['search'], 'int');
		$node = getVar('node', NULL, $param['search'], 'string');
		$proto = getVar('proto', -1, $param['search'], 'int');
		$family = getVar('family', -1, $param['search'], 'int');
		$and_or = getVar('orand', NULL, $param['search'], 'string');
		$limit_orig = getVar('limit', 100, $param, 'int');
		$callids = getVar('callid', array(), $param['search'], 'array');
		$mapsCallid = array();
		$cn = count($callids);
		for($i=0; $i < $cn; $i++) {
			$mapsCallid[$callids[$i]] =  $callids[$i];
			if(BLEGCID == "b2b") {
				$length = strlen(BLEGTAIL);
				if(substr($callids[$i], -$length) == BLEGTAIL) {
					$k = substr($callids[$i], 0, -$length);
					$mapsCallid[$k] = $k;
				}
				else {
					$k = $callids[$i].BLEGTAIL;
					$mapsCallid[$k] = $k;
				}
				$s = substr($k, 0, -1);
				$mapsCallid[$s] =  $s;
			}
			$k = substr($callids[$i], 0, -1);
			$mapsCallid[$k] =  $k;
		}
		$answer = array();
		if(empty($mapsCallid)) {
			$answer['sid'] = session_id();
			$answer['auth'] = 'true';
			$answer['status'] = 200;
			$answer['message'] = 'no data';
			$answer['data'] = $data;
			$answer['count'] = count($data);
			return $answer;
		}
		$search['correlation_id'] = implode(";",  array_keys($mapsCallid));
		/* remote log */
		$method = "GET";
		$queryData = array('q' => 'other','from' => 0,'size'=> 100, 'sort' => 'postDate:desc' ) ;
		//$url = REMOTE_LOG_URL.'/'.REMOTE_LOG_INDEX.'/'.REMOTE_LOG_DOC_TYPE.'/_search?'.http_build_query($queryData) ;
		$url = REMOTE_LOG_URL.'/'.REMOTE_LOG_INDEX.'/_search';
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_PORT, 9200);
		curl_setopt($ch, CURLOPT_HEADER, 0);
		curl_setopt($ch, CURLOPT_USERPWD, REMOTE_LOG_USERNAME . ":" . REMOTE_LOG_PASSWORD);
		curl_setopt($ch, CURLOPT_TIMEOUT, 30);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_CUSTOMREQUEST, strtoupper($method));
		$result = curl_exec($ch);
		curl_close($ch);
		$data = json_decode($result);
		if(empty($data)) {
			$answer['sid'] = session_id();
			$answer['auth'] = 'true';
			$answer['status'] = 200;
			$answer['message'] = 'no data';
			$answer['data'] = $data;
			$answer['count'] = count($data);
		}
		else {
			$answer['status'] = 200;
			$answer['sid'] = session_id();
			$answer['auth'] = 'true';
			$answer['message'] = 'ok';
			$answer['data'] = $data;
			$answer['count'] = count($data);
		}
		return $answer;
	}
	public function doQualityReport($id, $timestamp, $param) {
		/* get our DB */
		$db = $this->getContainer('db');
		$db->select_db(DB_CONFIGURATION);
		$db->dbconnect();
		/* get our DB Abstract Layer */
		$layer = $this->getContainer('layer');
		$data = array();
		$search = array();
		$lnodes = array();
		$callwhere = array();
		//if(array_key_exists('node', $param)) $lnodes = $param['node'];
		if(isset($param['location'])) $lnodes = $param['location']['node'];
		$time['from'] = getVar('from', round((microtime(true) - 300) * 1000), $timestamp, 'long');
		$time['to'] = getVar('to', round(microtime(true) * 1000), $timestamp, 'long');
		$time['from_ts'] = floor($time['from']/1000);
		$time['to_ts'] = round($time['to']/1000);
		$time['from_ts']-=600;
		$time['to_ts']+=60;
		/* search fields */
		$node = getVar('node', NULL, $param['search'], 'string');
		$type = getVar('type', -1, $param['search'], 'int');
		$proto = getVar('proto', -1, $param['search'], 'int');
		$family = getVar('family', -1, $param['search'], 'int');
		$and_or = getVar('orand', NULL, $param['search'], 'string');
		$limit_orig = getVar('limit', 100, $param, 'int');
		$callids = getVar('callid', array(), $param['search'], 'array');
		$search['correlation_id'] = implode(";", $callids);
		$answer = array();
		if(empty($callids)) {
			$answer['sid'] = session_id();
			$answer['auth'] = 'true';
			$answer['status'] = 200;
			$answer['message'] = 'no data';
			$answer['data'] = $data;
			$answer['count'] = count($data);
			return $answer;
		}
		$nodes = array();
		if(SINGLE_NODE == 1) $nodes[] = array( "dbname" =>  DB_HOMER, "name" => "single");
		else {
			foreach($lnodes as $lnd) $nodes[] = $this->getNode($lnd['name']);
		}
		$search[] = "type=1";
		if(empty($callwhere)) $callwhere = generateWhere($search, $and_or, $db, 0);
		$layerHelper = array();
		$layerHelper['table'] = array();
		$layerHelper['order'] = array();
		$layerHelper['where'] = array();
		$layerHelper['fields'] = array();
		$layerHelper['table']['base'] = "report_capture";
		$layerHelper['where']['type'] = $and_or ? "OR" : "AND";
		$layerHelper['where']['param'] = $callwhere;
		$layerHelper['time'] = $time;
		foreach($nodes as $node) {
			$db->dbconnect_node($node);
			$limit = $limit_orig;
			if(empty($callwhere)) $callwhere = generateWhere($search, $and_or, $db, 0);
			$layerHelper['order']['limit'] = $limit;
			$layerHelper['values'] = array();
			$layerHelper['values'][] = "*";
			$layerHelper['values'][] = "'".$node['name']."' as dbnode";
			$query = $layer->querySearchData($layerHelper);
			$noderows = $db->loadObjectArray($query);
			$data = array_merge($data,$noderows);
			$limit -= count($noderows);
		}
		/* sorting */
		usort($data, create_function('$a, $b', 'return $a["micro_ts"] > $b["micro_ts"] ? 1 : -1;'));
		$allowreport = array("LocalAddr", "RemoteAddr", "PacketLoss", "Delay", "QualityEst");
		foreach($data as $key=>$row) {
			if($row['type'] == 1 && $id != "raw") {
				$ldata = array();
				$mas = preg_split("/\r\n\r\n/", $row['msg']);
				$data[$key]['msg'] = $mas[1];
				$drs = preg_split("/\r\n/", $mas[1]);
				foreach($drs as $k=>$d) {
					$v = preg_split("/:/", $d);
					$a = explode(' ', $v[1]);
					/* short report */
					if($id == "short" && !in_array($v[0], $allowreport)) continue;
					$dval = array();
					foreach ($a as $are) {
						$b = explode('=', $are);
						if(!empty($b[0])) {
							if($b[1] == null) $b[1] = $b[0];
							$dval[$b[0]] = $b[1];
						}
					}
					if(!empty($v[0])) $ldata[$v[0]] = $dval;
				}
				$data[$key]['msg'] = $ldata;
			}
		}
		if(empty($data)) {
			$answer['sid'] = session_id();
			$answer['auth'] = 'true';
			$answer['status'] = 200;
			$answer['message'] = 'no data';
			$answer['data'] = $data;
			$answer['count'] = count($data);
		}
		else {
			$answer['status'] = 200;
			$answer['sid'] = session_id();
			$answer['auth'] = 'true';
			$answer['message'] = 'ok';
			$answer['data'] = $data;
			$answer['count'] = count($data);
		}
		return $answer;
	}
	public function getRtpAgentReport($raw_get_data) {
		$id = $raw_get_data['id'];
		$timestamp = $raw_get_data['timestamp'];
		$param = $raw_get_data['param'];
		return doRtpAgentReport($id, $timestamp, $param);
	}
	public function getHoraclifixReport($raw_get_data) {
		$id = $raw_get_data['id'];
		$timestamp = $raw_get_data['timestamp'];
		$param = $raw_get_data['param'];
		return doHoraclifixReport($id, $timestamp, $param);
	}
	/*share */
	public function doLogReportById($param) {
		$data = array();
		$db = $this->getContainer('db');
		$db->select_db(DB_CONFIGURATION);
		$db->dbconnect();
		$uuid = getVar('transaction_id', "", $param, 'string');
		$query = "SELECT data FROM link_share WHERE uuid='?' limit 1";
		$query = $db->makeQuery($query, $uuid );
		$json = $db->loadObjectArray($query);
		if(!empty($json)) {
			$djson = json_decode($json[0]['data'], true);
			$timestamp = $djson['timestamp'];
			$param = $djson['param'];
			$data =  $this->doLogReport($timestamp, $param);
		}
		if(empty($data)) {
			$answer['sid'] = session_id();
			$answer['auth'] = 'true';
			$answer['status'] = 200;
			$answer['message'] = 'no data';
			$answer['data'] = $data;
			$answer['count'] = count($data);
			return $answer;
		}
		else {
			return $data;
		}
	}
	/*share */
	public function doRtcReportById($param) {
		$data = array();
		$db = $this->getContainer('db');
		$db->select_db(DB_CONFIGURATION);
		$db->dbconnect();
		$uuid = getVar('transaction_id', "", $param, 'string');
		$query = "SELECT data FROM link_share WHERE uuid='?' limit 1";
		$query = $db->makeQuery($query, $uuid );
		$json = $db->loadObjectArray($query);
		if(!empty($json)) {
			$djson = json_decode($json[0]['data'], true);
			$timestamp = $djson['timestamp'];
			$param = $djson['param'];
			$data =  $this->doRtcReport($timestamp, $param);
		}
		if(empty($data)) {
			$answer['sid'] = session_id();
			$answer['auth'] = 'true';
			$answer['status'] = 200;
			$answer['message'] = 'no data';
			$answer['data'] = $data;
			$answer['count'] = count($data);
			return $answer;
		}
		else {
			return $data;
		}
	}
	/*share */
	public function doRTCPReportById($param) {
		$data = array();
		$db = $this->getContainer('db');
		$db->select_db(DB_CONFIGURATION);
		$db->dbconnect();
		$uuid = getVar('transaction_id', "", $param, 'string');
		$query = "SELECT data FROM link_share WHERE uuid='?' limit 1";
		$query = $db->makeQuery($query, $uuid );
		$json = $db->loadObjectArray($query);
		if(!empty($json)) {
			$djson = json_decode($json[0]['data'], true);
			$timestamp = $djson['timestamp'];
			$param = $djson['param'];
			$data =  $this->doRTCPReport($timestamp, $param);
		}
		if(empty($data)) {
			$answer['sid'] = session_id();
			$answer['auth'] = 'true';
			$answer['status'] = 200;
			$answer['message'] = 'no data';
			$answer['data'] = $data;
			$answer['count'] = count($data);
			return $answer;
		}
		else {
			return $data;
		}
	}
	public function doQOSReportById($param) {
		$data = array();
		$db = $this->getContainer('db');
		$db->select_db(DB_CONFIGURATION);
		$db->dbconnect();
		$uuid = getVar('transaction_id', "", $param, 'string');
		$query = "SELECT data FROM link_share WHERE uuid='?' limit 1";
		$query = $db->makeQuery($query, $uuid );
		$json = $db->loadObjectArray($query);
		if(!empty($json)) {
			$djson = json_decode($json[0]['data'], true);
			$timestamp = $djson['timestamp'];
			$param = $djson['param'];
			$data =  $this->doQOSReport($timestamp, $param);
		}
		if(empty($data)) {
			$answer['sid'] = session_id();
			$answer['auth'] = 'true';
			$answer['status'] = 200;
			$answer['message'] = 'no data';
			$answer['data'] = $data;
			$answer['count'] = count($data);
			return $answer;
		}
		else {
			return $data;
		}
	}
	/*share */
	public function doQualityReportById($param) {
		$data = array();
		$db = $this->getContainer('db');
		$db->select_db(DB_CONFIGURATION);
		$db->dbconnect();
		$uuid = getVar('transaction_id', "", $param, 'string');
		$query = "SELECT data FROM link_share WHERE uuid='?' limit 1";
		$query = $db->makeQuery($query, $uuid );
		$json = $db->loadObjectArray($query);
		if(!empty($json)) {
			$djson = json_decode($json[0]['data'], true);
			$timestamp = $djson['timestamp'];
			$param = $djson['param'];
			$id =  "short";
			$data =  $this->doQualityReport($id, $timestamp, $param);
		}
		if(empty($data)) {
			$answer['sid'] = session_id();
			$answer['auth'] = 'true';
			$answer['status'] = 200;
			$answer['message'] = 'no data';
			$answer['data'] = $data;
			$answer['count'] = count($data);
			return $answer;
		}
		else {
			return $data;
		}
	}
	/*share */
	public function doRtpAgentReportById($param) {
		$data = array();
		$db = $this->getContainer('db');
		$db->select_db(DB_CONFIGURATION);
		$db->dbconnect();
		$uuid = getVar('transaction_id', "", $param, 'string');
		$query = "SELECT data FROM link_share WHERE uuid='?' limit 1";
		$query = $db->makeQuery($query, $uuid );
		$json = $db->loadObjectArray($query);
		if(!empty($json)) {
			$djson = json_decode($json[0]['data'], true);
			$timestamp = $djson['timestamp'];
			$param = $djson['param'];
			$id =  "short";
			$data =  $this->doRtpAgentReport($id, $timestamp, $param);
		}
		if(empty($data)) {
			$answer['sid'] = session_id();
			$answer['auth'] = 'true';
			$answer['status'] = 200;
			$answer['message'] = 'no data';
			$answer['data'] = $data;
			$answer['count'] = count($data);
			return $answer;
		}
		else {
			return $data;
		}
	}
	public function doHoraclifixReportById($param) {
		$data = array();
		$db = $this->getContainer('db');
		$db->select_db(DB_CONFIGURATION);
		$db->dbconnect();
		$uuid = getVar('transaction_id', "", $param, 'string');
		$query = "SELECT data FROM link_share WHERE uuid='?' limit 1";
		$query = $db->makeQuery($query, $uuid );
		$json = $db->loadObjectArray($query);
		if(!empty($json)) {
			$djson = json_decode($json[0]['data'], true);
			$timestamp = $djson['timestamp'];
			$param = $djson['param'];
			$id =  "short";
			$data =  $this->doHoraclifixReport($id, $timestamp, $param);
		}
		if(empty($data)) {
			$answer['sid'] = session_id();
			$answer['auth'] = 'true';
			$answer['status'] = 200;
			$answer['message'] = 'no data';
			$answer['data'] = $data;
			$answer['count'] = count($data);
			return $answer;
		}
		else {
			return $data;
		}
	}
	public function getNode($name) {
		$db = $this->getContainer('db');
		$db->select_db(DB_CONFIGURATION);
		$db->dbconnect();
		$table = "node";
		$query = "SELECT * FROM ".$table." WHERE name='?' AND status = 1 LIMIT 1";
		$query  = $db->makeQuery($query, $name);
		$data = $db->loadObjectArray($query);
		if(empty($data)) return array();
		return $data[0];
	}
	public function getContainer($name) {
		if (!$this->_instance || !isset($this->_instance[$name]) || $this->_instance[$name] === null) {
			//$config = \Config::factory('configs/config.ini', APPLICATION_ENV, 'auth');
			if($name == "auth") $containerClass = sprintf("Authentication\\".AUTHENTICATION);
			else if($name == "layer") $containerClass = sprintf("Database\\Layer\\".DATABASE_DRIVER);
			else if($name == "db") $containerClass = sprintf("Database\\".DATABASE_CONNECTOR);
			$this->_instance[$name] = new $containerClass();
		}
		return $this->_instance[$name];
	}
	/**
	 * @param string $server
	 * @url stats/([0-9]+)
	 * @url stats
	 * @return string
	 */
	public function getStats($server = '1') {
		return $this->getServerStats($server);
	}
	public function pcapCheckSum($data) {
		if( strlen($data)%2 ) $data .= "\x00";
		$bit = unpack('n*', $data);
		$sum = array_sum($bit);
		while ($sum >> 16) $sum = ($sum >> 16) + ($sum & 0xffff);
		$sum = ~$sum;
		$sum = $sum & 0xffff;
		return $sum;
	}
	function getTimeArray($from_ts, $to_ts) {
		$timearray = array();
		$tkey = gmdate("Ymd", $to_ts);
		$timearray[$tkey]=$tkey;
		for($ts = $from_ts; $ts <= $to_ts; $ts+=86400) {
			$tkey = gmdate("Ymd", $ts);
			$timearray[$tkey]=$tkey;
		}
		return $timearray;
	}
}
?>