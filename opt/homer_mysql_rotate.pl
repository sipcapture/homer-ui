#!/usr/bin/env perl
#
# new_table - perl script for mySQL partition rotation
#
# Copyright (C) 2011-2016 Alexandr Dubovikov (alexandr.dubovikov@gmail.com)
#
# This file is part of webhomer, a free capture server.
#
# partrotate_unixtimestamp is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 3 of the License, or
# (at your option) any later version
#
# partrotate_unixtimestamp is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

use 5.010;
use strict;
use warnings;
use DBI;
use POSIX;

my $version = "1.0.3";
$| =1;

# Determine path and set default rotation.ini location
my $script_location = `dirname $0`;
$script_location =~ s/^\s+|\s+$//g;
my $default_ini = $script_location."/rotation.ini";

my $conf_file = $ARGV[0] // $default_ini;

my @stepsvalues = (86400, 3600, 1800, 900);
my $msgsize = 1400;
our $CONFIG = read_config($conf_file);

# Optionally load override configuration. perl format
my $rc = "/etc/sysconfig/partrotaterc";
if (-e $rc) {
	do $rc;
}

my $newtables = $CONFIG->{"MYSQL"}{"newtables"};

if($CONFIG->{"SYSTEM"}{"debug"} == 1) {
	#Debug only
	foreach my $section (sort keys %{$CONFIG}) {
		foreach my $value (keys %{ $CONFIG->{$section} }) {
			say "$section, $value: $CONFIG->{$section}{$value}";
		}
	}
}

my $ORIGINAL_DATA_TABLE=<<END;
CREATE TABLE IF NOT EXISTS `[TRANSACTION]_[TIMESTAMP]` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `micro_ts` bigint(18) NOT NULL DEFAULT '0',
  `method` varchar(50) NOT NULL DEFAULT '',
  `reply_reason` varchar(100) NOT NULL DEFAULT '',
  `ruri` varchar(200) NOT NULL DEFAULT '',
  `ruri_user` varchar(100) NOT NULL DEFAULT '',
  `ruri_domain` varchar(150) NOT NULL DEFAULT '',
  `from_user` varchar(100) NOT NULL DEFAULT '',
  `from_domain` varchar(150) NOT NULL DEFAULT '',
  `from_tag` varchar(64) NOT NULL DEFAULT '',
  `to_user` varchar(100) NOT NULL DEFAULT '',
  `to_domain` varchar(150) NOT NULL DEFAULT '',
  `to_tag` varchar(64) NOT NULL DEFAULT '',
  `pid_user` varchar(100) NOT NULL DEFAULT '',
  `contact_user` varchar(120) NOT NULL DEFAULT '',
  `auth_user` varchar(120) NOT NULL DEFAULT '',
  `callid` varchar(120) NOT NULL DEFAULT '',
  `callid_aleg` varchar(120) NOT NULL DEFAULT '',
  `via_1` varchar(256) NOT NULL DEFAULT '',
  `via_1_branch` varchar(80) NOT NULL DEFAULT '',
  `cseq` varchar(25) NOT NULL DEFAULT '',
  `diversion` varchar(256) NOT NULL DEFAULT '',
  `reason` varchar(200) NOT NULL DEFAULT '',
  `content_type` varchar(256) NOT NULL DEFAULT '',
  `auth` varchar(256) NOT NULL DEFAULT '',
  `user_agent` varchar(256) NOT NULL DEFAULT '',
  `source_ip` varchar(60) NOT NULL DEFAULT '',
  `source_port` int(10) NOT NULL DEFAULT 0,
  `destination_ip` varchar(60) NOT NULL DEFAULT '',
  `destination_port` int(10) NOT NULL DEFAULT 0,
  `contact_ip` varchar(60) NOT NULL DEFAULT '',
  `contact_port` int(10) NOT NULL DEFAULT 0,
  `originator_ip` varchar(60) NOT NULL DEFAULT '',
  `originator_port` int(10) NOT NULL DEFAULT 0,
  `expires` int(5) NOT NULL DEFAULT '-1',
  `correlation_id` varchar(256) NOT NULL DEFAULT '',
  `custom_field1` varchar(120) NOT NULL DEFAULT '',
  `custom_field2` varchar(120) NOT NULL DEFAULT '',
  `custom_field3` varchar(120) NOT NULL DEFAULT '',
  `proto` int(5) NOT NULL DEFAULT 0,
  `family` int(1) DEFAULT NULL,
  `rtp_stat` varchar(256) NOT NULL DEFAULT '',
  `type` int(2) NOT NULL DEFAULT 0,
  `node` varchar(125) NOT NULL DEFAULT '',
  `msg` varchar([MSG_SIZE]) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`,`date`),
  KEY `ruri_user` (`ruri_user`),
  KEY `from_user` (`from_user`),
  KEY `to_user` (`to_user`),
  KEY `pid_user` (`pid_user`),
  KEY `auth_user` (`auth_user`),
  KEY `callid_aleg` (`callid_aleg`),
  KEY `date` (`date`),
  KEY `callid` (`callid`),
  KEY `method` (`method`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPRESSED KEY_BLOCK_SIZE=8 COMMENT='[TIMESTAMP]'
/*!50100 PARTITION BY RANGE ( UNIX_TIMESTAMP(`date`))
([PARTITIONS]
PARTITION pmax VALUES LESS THAN MAXVALUE ENGINE = InnoDB) */ ;
END

my $ISUP_DATA_TABLE=<<END;
CREATE TABLE IF NOT EXISTS `[TRANSACTION]_[TIMESTAMP]` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `micro_ts` bigint(18) NOT NULL DEFAULT '0',
  `method` varchar(4) NOT NULL DEFAULT '',
  `correlation_id` varchar(256) NOT NULL DEFAULT '',
  `opc` int(10) NOT NULL DEFAULT 0,
  `dpc` int(10) NOT NULL DEFAULT 0,
  `cic` int(10) NOT NULL DEFAULT 0,
  `called_number` varchar(16)  DEFAULT '',
  `called_ton` int(10)  DEFAULT 0,
  `called_npi` int(10)  DEFAULT 0,
  `called_inn` int(10)  DEFAULT 0,
  `calling_number` varchar(16)  DEFAULT '',
  `calling_ton` int(10)  DEFAULT 0,
  `calling_npi` int(10)  DEFAULT 0,
  `calling_ni` int(10)  DEFAULT 0,
  `calling_restrict` int(10)  DEFAULT 0,
  `calling_screened` int(10)  DEFAULT 0,
  `calling_category` int(10)  DEFAULT 0,
  `cause_standard` int(10)  DEFAULT 0,
  `cause_location` int(10)  DEFAULT 0,
  `cause_itu_class` int(10)  DEFAULT 0,
  `cause_itu_cause` int(10)  DEFAULT 0,
  `event_num` int(10)  DEFAULT 0,
  `hop_counter` int(10)  DEFAULT 0,
  `nci_satellite` int(10)  DEFAULT 0,
  `nci_continuity_check` int(10)  DEFAULT 0,
  `nci_echo_device` int(10)  DEFAULT 0,
  `fwc_nic` int(10)  DEFAULT 0,
  `fwc_etem` int(10)  DEFAULT 0,
  `fwc_iw` int(10)  DEFAULT 0,
  `fwc_etei` int(10)  DEFAULT 0,
  `fwc_isup` int(10)  DEFAULT 0,
  `fwc_isup_pref` int(10)  DEFAULT 0,
  `fwc_ia` int(10)  DEFAULT 0,
  `fwc_sccpm` int(10)  DEFAULT 0,
  `transmission_medium` int(10)  DEFAULT 0,
  `user_coding_standard` int(10)  DEFAULT 0,
  `user_transfer_cap` int(10)  DEFAULT 0,
  `user_transfer_mode` int(10)  DEFAULT 0,
  `user_transfer_rate` int(10)  DEFAULT 0,
  `user_layer1_ident` int(10)  DEFAULT 0,
  `user_layer1_proto` int(10)  DEFAULT 0,
  `source_ip` varchar(60) NOT NULL DEFAULT '',
  `source_port` int(10) NOT NULL DEFAULT 0,
  `destination_ip` varchar(60) NOT NULL DEFAULT '',
  `destination_port` int(10) NOT NULL DEFAULT 0,
  `proto` int(5) NOT NULL DEFAULT 0,
  `family` int(1) DEFAULT NULL,
  `type` int(5) NOT NULL DEFAULT 0,
  `node` varchar(125) NOT NULL DEFAULT '',
  `msg` varchar([MSG_SIZE]) NOT NULL DEFAULT '',
  `expires` int(5) NOT NULL DEFAULT '-1',
  PRIMARY KEY (`id`,`date`),
  KEY `date` (`date`),
  KEY `called_number` (`called_number`),
  KEY `calling_number` (`calling_number`),
  KEY `correlationid` (`correlation_id`(255))
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 ROW_FORMAT=COMPRESSED KEY_BLOCK_SIZE=8 COMMENT='[TIMESTAMP]'
/*!50100 PARTITION BY RANGE ( UNIX_TIMESTAMP(`date`))
([PARTITIONS]
PARTITION pmax VALUES LESS THAN MAXVALUE ENGINE = InnoDB) */ ;
END

my $WEBRTC_DATA_TABLE=<<END;
CREATE TABLE IF NOT EXISTS `[TRANSACTION]_[TIMESTAMP]` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,  
  `micro_ts` bigint(18) NOT NULL DEFAULT '0',
  `method` varchar(100) NOT NULL DEFAULT '',
  `caller` varchar(250) NOT NULL DEFAULT '',
  `callee` varchar(250) NOT NULL DEFAULT '',
  `session_id` varchar(256) NOT NULL DEFAULT '',
  `correlation_id` varchar(256) NOT NULL DEFAULT '',
  `source_ip` varchar(60) NOT NULL DEFAULT '',
  `source_port` int(10) NOT NULL DEFAULT 0,
  `destination_ip` varchar(60) NOT NULL DEFAULT '',
  `destination_port` int(10) NOT NULL DEFAULT 0,
  `proto` int(5) NOT NULL DEFAULT 0,
  `family` int(1) DEFAULT NULL,
  `type` int(5) NOT NULL DEFAULT 0,
  `node` varchar(125) NOT NULL DEFAULT '',
  `msg` varchar([MSG_SIZE]) NOT NULL DEFAULT '',    
  PRIMARY KEY (`id`,`date`),
  KEY `date` (`date`),
  KEY `sessionid` (`session_id`),
  KEY `correlationid` (`correlation_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 ROW_FORMAT=COMPRESSED KEY_BLOCK_SIZE=8 COMMENT='[TIMESTAMP]'
/*!50100 PARTITION BY RANGE ( UNIX_TIMESTAMP(`date`))
([PARTITIONS]
PARTITION pmax VALUES LESS THAN MAXVALUE ENGINE = InnoDB) */ ;
END

my $RTCP_DATA_TABLE=<<END;
CREATE TABLE IF NOT EXISTS `[TRANSACTION]_[TIMESTAMP]` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `micro_ts` bigint(18) NOT NULL DEFAULT '0',
  `correlation_id` varchar(256) NOT NULL DEFAULT '',
  `source_ip` varchar(60) NOT NULL DEFAULT '',
  `source_port` int(10) NOT NULL DEFAULT 0,
  `destination_ip` varchar(60) NOT NULL DEFAULT '',
  `destination_port` int(10) NOT NULL DEFAULT 0,
  `proto` int(5) NOT NULL DEFAULT 0,
  `family` int(1) DEFAULT NULL,
  `type` int(5) NOT NULL DEFAULT 0,
  `node` varchar(125) NOT NULL DEFAULT '',
  `msg` varchar([MSG_SIZE]) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`,`date`),
  KEY `date` (`date`),
  KEY `correlationid` (`correlation_id`(255))
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 ROW_FORMAT=COMPRESSED KEY_BLOCK_SIZE=8 COMMENT='[TIMESTAMP]'
/*!50100 PARTITION BY RANGE ( UNIX_TIMESTAMP(`date`))
([PARTITIONS]
PARTITION pmax VALUES LESS THAN MAXVALUE ENGINE = InnoDB) */ ;
END

my $REPORT_DATA_TABLE=<<END;
CREATE TABLE IF NOT EXISTS `[TRANSACTION]_[TIMESTAMP]` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `micro_ts` bigint(18) NOT NULL DEFAULT '0',
  `correlation_id` varchar(256) NOT NULL DEFAULT '',
  `source_ip` varchar(60) NOT NULL DEFAULT '',
  `source_port` int(10) NOT NULL DEFAULT 0,
  `destination_ip` varchar(60) NOT NULL DEFAULT '',
  `destination_port` int(10) NOT NULL DEFAULT 0,
  `proto` int(5) NOT NULL DEFAULT 0,
  `family` int(1) DEFAULT NULL,
  `type` int(5) NOT NULL DEFAULT 0,
  `node` varchar(125) NOT NULL DEFAULT '',
  `msg` varchar(1500) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`,`date`),
  KEY `date` (`date`),
  KEY `correlationid` (`correlation_id`(255))
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 ROW_FORMAT=COMPRESSED KEY_BLOCK_SIZE=8 COMMENT='[TIMESTAMP]'
/*!50100 PARTITION BY RANGE ( UNIX_TIMESTAMP(`date`))
([PARTITIONS]
PARTITION pmax VALUES LESS THAN MAXVALUE ENGINE = InnoDB) */ ;
END

#Check DATA tables
my $db = db_connect($CONFIG, "db_data");
my $maxparts = 1;
my $newparts = 1;

foreach my $table (keys %{ $CONFIG->{"DATA_TABLE_ROTATION"} }) {
	my $rotate = $CONFIG->{'DATA_TABLE_ROTATION'}{$table};
	my $partstep = $CONFIG->{'DATA_TABLE_STEP'}{$table};
	$newparts = $CONFIG->{'MYSQL'}{'newtables'};
	$maxparts = $CONFIG->{'DATA_TABLE_ROTATION'}{$table} + $newparts;

	$partstep = 0 if(!defined $stepsvalues[$partstep]);
	my $mystep = $stepsvalues[$partstep];

	if(defined $CONFIG->{'DATA_TABLE_TYPE_TIMESTAMP'}{$table}) {
		my $table_type = $CONFIG->{'DATA_TABLE_TYPE_TIMESTAMP'}{$table};
		my $curtstamp;
		for(my $y=0; $y<($newtables+1); $y++) {
			my $data_table = $ORIGINAL_DATA_TABLE;
			if($table_type=~/^isup/) { $data_table =  $ISUP_DATA_TABLE;}
			elsif($table_type=~/^webrtc/) { $data_table =  $WEBRTC_DATA_TABLE;}
			elsif($table_type=~/^rtcp/) { $data_table =  $RTCP_DATA_TABLE;}
			elsif($table_type=~/^report/) { $data_table =  $REPORT_DATA_TABLE;};

			$curtstamp = time()+(86400*$y);
			new_data_table($curtstamp, $mystep, $partstep, $data_table, $table);
		}

		#And remove
		say "Now removing old tables" if($CONFIG->{"SYSTEM"}{"debug"} == 1);
		my $rotation_horizon = $CONFIG->{"DATA_TABLE_ROTATION"}{$table};
		my $query = sprintf("SHOW TABLES LIKE '%s_%%';",$table);
		my $sth = $db->prepare($query);
		$sth->execute();
		my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = gmtime(time() - 86400*$rotation_horizon);
		my $oldest = sprintf("%04d%02d%02d",($year+=1900),(++$mon),$mday);
		$oldest+=0;
		while(my @ref = $sth->fetchrow_array()) {
			my $table_name = $ref[0];
			my($proto, $cap, $type, $ts) = split(/_/, $table_name, 4);
			# RTCP has only 3 underscores 
			$ts = $type if($table eq "rtcp_capture");
		
			$ts+=0;
			if($ts < $oldest) {
				say "Removing table: $table_name" if($CONFIG->{"SYSTEM"}{"debug"} == 1);
				my $drop = "DROP TABLE $table_name;";
				my $drh = $db->prepare($drop);
				$drh->execute();
			} else {
				say "Table $table_name is too young, leaving." if($CONFIG->{"SYSTEM"}{"debug"} == 1);
			}
		}
	}
	#Rtcp, Logs, Reports tables
	else {
		my $coof = int(86400/$mystep);
		#How much partitions
		$maxparts *= $coof;
		$newparts *= $coof;
		#Now
		new_partition_table($db, $CONFIG->{"MYSQL"}{"db_data"}, $table, $mystep, $partstep, $maxparts, $newparts);
	}
}

#Check STATS tables
$db = db_connect($CONFIG, "db_stats");

$maxparts = 1;
$newparts = 1;
foreach my $table (keys %{ $CONFIG->{"STATS_TABLE_ROTATION"} }) {

	$newparts = $CONFIG->{'MYSQL'}{'newtables'};
	$maxparts = $CONFIG->{'STATS_TABLE_ROTATION'}{$table} + $newparts;
	my $partstep = $CONFIG->{'STATS_TABLE_STEP'}{$table};

	#Check it
	$partstep = 0 unless(defined $stepsvalues[$partstep]);
	#Mystep
	my $mystep = $stepsvalues[$partstep];

	my $coof=int(86400/$mystep);
	#How much partitions
	$maxparts*=$coof;
	$newparts*=$coof;
	#$totalparts = ($maxparts+$newparts);

	new_partition_table($db, $CONFIG->{"MYSQL"}{"db_stats"}, $table, $mystep, $partstep, $maxparts, $newparts);
}

exit;

sub db_connect {
	my $CONFIG  = shift;
	my $db_name = shift;
	my $dbistring = "";
	if($CONFIG->{"MYSQL"}{"usesocket"}) {
		$dbistring = "DBI:mysql:database=".$CONFIG->{"MYSQL"}{$db_name}.";mysql_socket=".$CONFIG->{"MYSQL"}{"socket"}
	} else {
		$dbistring = "DBI:mysql:".$CONFIG->{"MYSQL"}{$db_name}.":".$CONFIG->{"MYSQL"}{"host"}.":".$CONFIG->{"MYSQL"}{"port"}
	}
	my $db = DBI->connect($dbistring, $CONFIG->{"MYSQL"}{"user"}, $CONFIG->{"MYSQL"}{"password"});
	return $db;
}

sub calculate_gmt_offset {
	my $timestamp = shift;
	my @utc = gmtime($timestamp);
	my @local = localtime($timestamp);
	my $timezone_offset = mktime(@local) - mktime(@utc);
	return $timezone_offset;
}

sub new_data_table {
	my $cstamp = shift;
	my $mystep = shift;
	my $partstep = shift;
	my $sqltable = shift;
	my $table = shift;

	my $newparts=int(86400/$mystep);

	my @partsadd;
	my $tz_offset = calculate_gmt_offset($cstamp);
	my ($sec, $min, $hour, $mday, $mon, $year, $wday, $yday, $isdst) = gmtime($cstamp);
	# mktime generates timestamp based on local timestamps, so we have to add our timezone offset
	my $kstamp = mktime (0+$tz_offset, 0, 0, $mday, $mon, $year, $wday, $yday, $isdst);

	my $table_timestamp = sprintf("%04d%02d%02d",($year+=1900),(++$mon),$mday);
	$sqltable=~s/\[TIMESTAMP\]/$table_timestamp/ig;

	#msg size dynamicly
	my $newmsgsize;
	if(!exists $CONFIG->{'MSG_TABLE_SIZE'} || !exists $CONFIG->{'MSG_TABLE_SIZE'}{$table}) {
		$newmsgsize = $msgsize;
	}
	else {
		$newmsgsize = $CONFIG->{'MSG_TABLE_SIZE'}{$table};
	}
	$sqltable=~s/\[MSG_SIZE\]/$newmsgsize/ig;

	# < condition
	for(my $i=0; $i<$newparts; $i++) {
		my $oldstamp = $kstamp;
		$kstamp+=$mystep;
		my ($sec, $min, $hour, $mday, $mon, $year, $wday, $yday, $isdst) = gmtime($oldstamp);

		my $newpartname = sprintf("p%04d%02d%02d%02d",($year+=1900),(++$mon),$mday,$hour);
		$newpartname.= sprintf("%02d", $min) if($partstep > 1);
		my $query = "PARTITION ".$newpartname." VALUES LESS THAN (".$kstamp.")";
		push(@partsadd,$query);
	}

	my $parts_count=scalar @partsadd;
	if($parts_count > 0) {
		my $val = join(','."\n", @partsadd).",";
		$sqltable=~s/\[PARTITIONS\]/$val/ig;
		$sqltable=~s/\[TRANSACTION\]/$table/ig;
		$db->do($sqltable) or printf(STDERR "Failed to execute query [%s] with error: %s", ,$db->errstr) if($CONFIG->{"SYSTEM"}{"exec"} == 1);
		say "create data table: $sqltable" if($CONFIG->{"SYSTEM"}{"debug"} == 1);
		#print "$sqltable\n";
	}
}

sub new_partition_table {
	my $db       = shift;
	my $db_name  = shift;
	my $table    = shift;
	my $mystep   = shift;
	my $partstep = shift;
	my $maxparts = shift;
	my $newparts = shift;

	my $part_key = "date";
	#Name of part key
	if( $table =~/alarm_/) {
		$part_key = "create_date";
	}
	elsif( $table =~/stats_/) {
		$part_key = "from_date";
	}

	#check if the table has partitions. If not, create one
	##my $query = "SHOW TABLE STATUS FROM ".$CONFIG{"MYSQL"}{"db_stats"}. " WHERE Name='".$table."'";
	my $query="SELECT create_options FROM information_schema.tables WHERE table_schema = '".$db_name."' and table_name = '".$table."'";
	say "Debug: $query" if($CONFIG->{"SYSTEM"}{"debug"} == 1);
	my $sth = $db->prepare($query);
	$sth->execute();
	my ($tstatus) = $sth->fetchrow_array();
	#my $tstatus = $sth->fetchrow_hashref()->{Create_options};
	if ($tstatus !~ /partitioned/) {
		my $query = "ALTER TABLE ".$table. " PARTITION BY RANGE ( UNIX_TIMESTAMP(`".$part_key."`)) (PARTITION pmax VALUES LESS THAN MAXVALUE)";
		print "Table is not partitioned..[$table]" if($CONFIG->{"SYSTEM"}{"debug"} == 1);
		my $sth = $db->prepare($query);
		$sth->execute();
	}

	my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = gmtime();
	my $curtstamp = time() - $sec - 60 * $min - 3600 * $hour;
	my $todaytstamp+=0;

	my %PARTS;
	#Geting all partitions
	$query = "SELECT PARTITION_NAME, PARTITION_DESCRIPTION"
			 ."\n FROM INFORMATION_SCHEMA.PARTITIONS WHERE TABLE_NAME='".$table."'"
			 ."\n AND TABLE_SCHEMA='".$db_name."' ORDER BY PARTITION_DESCRIPTION ASC;";
	$sth = $db->prepare($query);
	$sth->execute();
	my @oldparts;
	my @partsremove;
	my @partsadd;

	while(my @ref = $sth->fetchrow_array()) {
		 my $minpart = $ref[0];
		 my $todaytstamp = $ref[1];
		 next if($minpart eq "pmax");

		 if($curtstamp <= $todaytstamp) {
			 $PARTS{$minpart."_".$todaytstamp} = 1;
		}
		else {
			push(@oldparts, \@ref);
		}
	}

	my $partcount = $#oldparts;
	my $minpart;
	if($partcount > $maxparts) {
		foreach my $ref (@oldparts) {
			$minpart = $ref->[0];
			$todaytstamp = $ref->[1];
			push(@partsremove, $minpart);
			$partcount--;
			last if($partcount <= $maxparts);
		}
	}

	#Delete all partitions
	if($#partsremove > 0) {
		my $query = "ALTER TABLE ".$table." DROP PARTITION ".join(',', @partsremove);
		say "DROP Partition: [$query]" if($CONFIG->{"SYSTEM"}{"debug"} == 1);
		$db->do($query) or printf(STDERR "Failed to execute query [%s] with error: %s\n", ,$db->errstr) if($CONFIG->{"SYSTEM"}{"exec"} == 1);
		if (!$db->{Executed}) {
			say "Couldn't drop partition: $minpart";
			break;
		}
	}

	say "Newparts: $newparts" if($CONFIG->{"SYSTEM"}{"debug"} == 1);

	# < condition
	$curtstamp+=(86400);
	my $stopstamp = time() + (86400*$newtables);

	for(my $i=0; $i<$newparts; $i++) {
		my $oldstamp = $curtstamp;
		$curtstamp+=$mystep;
		my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = gmtime($oldstamp);
		my $newpartname = sprintf("p%04d%02d%02d%02d",($year+=1900),(++$mon),$mday,$hour);
		$newpartname.= sprintf("%02d", $min) if($partstep > 1);
		if(!defined $PARTS{$newpartname."_".$curtstamp}) {
			$query = "\nPARTITION ".$newpartname." VALUES LESS THAN (".$curtstamp.")";
			push(@partsadd,$query);
		}
		if($curtstamp >= $stopstamp) {
			print "Stop partition: [$curtstamp] > [$stopstamp]. Last partition: [$newpartname]\n" if($CONFIG->{"SYSTEM"}{"debug"} == 1);
			last;
		}
	}

	my $parts_count=scalar @partsadd;
	if($parts_count > 0) {
		# Fix MAXVALUE. Thanks Dorn B. <djbinter@gmail.com> for report and fix.
		my $query = "ALTER TABLE ".$table." REORGANIZE PARTITION pmax INTO (".join(',', @partsadd) ."\n, PARTITION pmax VALUES LESS THAN MAXVALUE)";
		say "Alter partition: [$query]" if($CONFIG->{"SYSTEM"}{"debug"} == 1);
		$db->do($query) or printf(STDERR "Failed to execute query [%s] with error: %s\n", $query, $db->errstr) if($CONFIG->{"SYSTEM"}{"exec"} == 1);
		if (!$db->{Executed}) {
			print "Couldn't drop partition: $minpart\n";
			break;
		}
	}
}

sub read_config {
	my $ini = shift;

	open (INI, "$ini") || die "Can't open $ini: $!\n";
	my $section;
	my $CONFIG;
	while (<INI>) {
		chomp;
		if (/^\s*\[(\w+)\].*/) {
			$section = $1;
		}
		if ((/^(.*)=(.*)$/)) {
			my ($keyword, $value) = split(/=/, $_, 2);
			$keyword =~ s/^\s+|\s+$//g;
			$value =~ s/(#.*)$//;
			$value =~ s/^\s+//;
			$value =~ s/\s+$//;
			#Debug
			#print "V: [$value]\n";
			$CONFIG->{$section}{$keyword} = $value;
		}
	}
	close(INI);
	return $CONFIG;
}
1;