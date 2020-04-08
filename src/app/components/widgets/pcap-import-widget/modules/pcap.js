/*********************************************************************
  Purpose: Parse PCAP-SIP and convert to HEP binary format
  Author: Lorenzo Mangani
  Date: 30.03.2020
*********************************************************************/
/*********************************************************************
  Purpose: File containing all of the code to parse a PCAP file
  and display it using D3 to create a ladder diagram.
  Author: Nick Knight
  Date: 23.05.2017
*********************************************************************/
var connection = new WebSocket('ws://' + window.location.hostname + ':8060');

var HEP = require('hep-js');
var SIP = require('sipcore');

connection.onopen = function () {
  connection.binaryType = 'arraybuffer';
};

/* HEP3 Socket OUT */
var sendHEP3 = function(msg, rcinfo){
	var sipmsg = SIP.parse(msg);
	//console.log('sendHEP3',rcinfo,msg,sipmsg);
	if (rcinfo && sipmsg) {
		try {
			var hep_message = HEP.encapsulate(msg,rcinfo);
			if (hep_message) {
				var packet = Buffer.from(hep_message)
				connection.send(packet);
				//console.log('sending hep packet',rcinfo,msg);
			}
		}
		catch (e) {
			console.log('HEP3 Error sending to WS!',e);
		}
	}
}

var processPacket = function(message){
    // here it sends to the connection!!!
    // process packet should be with sendHEP , both require the HEP import
	try { var decoded = JSON.parse(message) } catch { var decoded = message; };
	//console.log('processing packet',decoded,message);
        var hep_proto = { "type": "HEP", "version": 3, "payload_type": "SIP", "captureId": 9999, "ip_family": 2, "capturePass": "wss" };
	/* TCP DECODE */
	if (decoded && decoded.ipv4 && decoded.ipv4.tcp){
		var payload = String.fromCharCode(...Object.values(decoded.ipv4.tcp.data));
        	// Build HEP3
		hep_proto.ip_family = 2;
        	hep_proto.protocol = 6;
		hep_proto.proto_type = 1;
	        hep_proto.srcIp = decoded.ipv4.src;
	        hep_proto.dstIp = decoded.ipv4.dst;
        	hep_proto.srcPort = decoded.ipv4.tcp.srcport;
        	hep_proto.dstPort = decoded.ipv4.tcp.dstport;
		hep_proto.time_sec = parseInt(decoded.ts_sec),
		hep_proto.time_usec = parseInt(decoded.ts_sec.toString().split('.')[1]) | 000 ;
		sendHEP3(payload,hep_proto);

	}
	/* UDP DECODE */
	if (decoded && decoded.ipv4 && decoded.ipv4.udp){
		var payload = String.fromCharCode(...Object.values(decoded.ipv4.udp.data));
	        // Build HEP3
		hep_proto.ip_family = 2;
	        hep_proto.protocol = 17;
		hep_proto.proto_type = 1;
	        hep_proto.srcIp = decoded.ipv4.src;
	        hep_proto.dstIp = decoded.ipv4.dst;
	        hep_proto.srcPort = decoded.ipv4.udp.srcport;
	        hep_proto.dstPort = decoded.ipv4.udp.dstport;
		hep_proto.time_sec = parseInt(decoded.ts_sec),
		hep_proto.time_usec = parseInt(decoded.ts_sec.toString().split('.')[1]) | 000 ;
		sendHEP3(payload,hep_proto);
	}
}

// $( document ).ready( function ()
document.addEventListener("DOMContentLoaded", function(event)
{
  /*********************************************************************
    Function: drawGraph
    Purpose: Render the graph
    Author: Nick Knight
    Date: 23.05.2017
  *********************************************************************/
 // this function should add with the handleFileSelect

  function drawGraph( etherframes, ipv4hosts )
  {
      /* TODO: change the viz-frames and viz-hosts props in the root class */ 
      // this.vizFrames = this.etherdframes.length
      // this.vizHosts = ipv4hosts.length
      // this.framesCount = etherframes.length
      // TODO: read / list the ipv4 hosts
      // TODO read / list the etherframes for log
      // this method is just for logging the results
      let frames = etherframes.length;

      let ipv4Hosts = ipv4hosts.length

    document.getElementById('viz-frames').innerHTML = '<p>Parsed '+frames+' IP frames</p>';
    document.getElementById('viz-hosts').innerHTML = '<p>Parsed '+ipv4Hosts+' hosts ('+ipv4hosts.join(",")+')</p>';
   
    console.log('parsed '+frames + 'frames');
    // next method will send the etherframes to proxy 
    processFrames(etherframes);

    document.getElementById("upload").disabled = false;
    document.getElementById("files").style.visibility = 'hidden';
    return;
  }

  // this method will be the service and will take the frames directly from handleFileSelect
  function processFrames(frames){
    document.getElementById("uplaod").onclick = function(){
      console.log('processing frames');
      frames.forEach(function(frame){
          // processPackets sends the frames to sendHEP3()
        processPacket(frame)
      })
    }
    }
  
  /*********************************************************************
    Purpose: The next section is here to parse the contents of a PCAP
    file. This first method needs improving. As when reading a large file
    , for the purpose of a ladder diagram, we don't need to look at all
    the parts of each packet. The format of PCAP can be Found
    https://wiki.wireshark.org/Development/LibpcapFileFormat
    Author: Nick Knight
    Date: 23.05.2017
  *********************************************************************/

  function abortRead()
  {
    reader.abort();
  }
    // error handler to go on the main class
  function errorHandler( evt )
  {
    switch ( evt.target.error.code )
    {
    case evt.target.error.NOT_FOUND_ERR:
      alert( 'File Not Found!' );
      break;
    case evt.target.error.NOT_READABLE_ERR:
      alert( 'File is not readable' );
      break;
    case evt.target.error.ABORT_ERR:
      break; // noop
    default:
      alert( 'An error occurred reading this file.' );
    };
  }

  /*********************************************************************
    Function: updateProgress
    Purpose: TODO: tie this function to something actually on the page
    to indicate we are loading the PCAP file.
    Author: Nick Knight
    Date: 23.05.2017
  *********************************************************************/

 /* updateprogress method as in angular
  function updateProgress( evt )
  {
    // evt is an ProgressEvent.
    if ( evt.lengthComputable )
    {
      var percentLoaded = Math.round( ( evt.loaded / evt.total ) * 100 );
      // Increase the progress bar length.
      if ( percentLoaded < 100 )
      {
        progress.style.width = percentLoaded + '%';
        progress.textContent = percentLoaded + '%';
      }
    }
  }
  */ 

  /*********************************************************************
    Function: toHex
    Purpose: Little helper function to convert value into a hex value.
    Author: Nick Knight
    Date: 23.05.2017
  *********************************************************************/

  // It could go into the root component to "help" handleFileSelect

  function toHex( d )
  {
    return ( "0" + ( Number( d ).toString( 16 ) ) ).slice( -2 ).toUpperCase()
  }

  if ( window.File && window.FileReader && window.FileList && window.Blob )
  {
    // Great success! All the File APIs are supported.

    /*********************************************************************
      Function: handleFileSelect
      Purpose: This is the workhorse. User has selected a file and we can
      now parse it.
      Author: Nick Knight
      Date: 23.05.2017
    *********************************************************************/
    function handleFileSelect( evt )
    {
      var files = evt.target.files; // FileList object
      var file;
      var state = 0;
      var fileposition = 0;
      var reader = new FileReader();
      reader.onerror = errorHandler;
      //reader.onprogress = updateProgress;
      reader.onabort = function ( e )
      {
        alert( 'File read cancelled' );
      };

      /* here goes the loader UI
      reader.onloadstart = function ( e )
      {
        //document.getElementById('progress_bar').className = 'loading';
      };
      */
      var ts_sec = 0;
      var ts_usec = 0;
      var ts_firstether = -1;
      var frame = 0;
      var ipv4hosts = [];
      var etherframes = [];
      var logMsg = [];
      var msg = ''
      // fileProcess function
      reader.onload = function ( e )
      {
        var data = e.currentTarget.result;
  
        switch ( state )
        {
        case 0:
          var uint32array = new Uint32Array( data );
         // var int32array = new Int32Array( data );
          // Do we need version info for now?
          //var uint16array = new Uint16Array(data);
          /* Magic number */
          //  TODO: try to switch this messages on log */

          if ( 2712847316 == uint32array[ 0 ] )
          {
            /* Native byte order */
            let msg = "Native byte order"
            logMsg.push(msg)
            console.log( msg );
          }
          else if ( 3569595041 == uint32array[ 0 ] )
          {
            /* Swapped byte order */
            let msg = "Swapped byte order"
            logMsg.push(msg)
            console.log( msg );
            console.log( "Swapped byte order" );
          }
          else if ( 2712812621 == uint32array[ 0 ] )
          {
            /* Native byte order nano second timing */
            console.log( "Native byte order nano second timing" );
          }
          else if ( 1295823521 == uint32array[ 0 ] )
          {
            /* Swapped byte order nano second timing */
            console.log( "Swapped byte order nano second timing" );
          }
          /* http://www.tcpdump.org/linktypes.html */
          if ( 1 != uint32array[ 5 ] )
          {
            console.log( "Link layer type not supported" );
            return;
          }
          console.log( "LINKTYPE_ETHERNET" );
          /* Read our first packet header */
          var blob = file.slice( fileposition, fileposition + 16 );
          fileposition += 16;
          reader.readAsArrayBuffer( blob );
          state = 1;
          break;
        case 1:
          var uint32array = new Uint32Array( data );
          ts_sec = uint32array[ 0 ];
          ts_usec = uint32array[ 1 ];
          var incl_len = uint32array[ 2 ];
          var orig_len = uint32array[ 3 ];
          if ( 0 == incl_len )
          {
            var blob = file.slice( fileposition, fileposition + 16 );
            fileposition += 16;
            reader.readAsArrayBuffer( blob );
            break;
          }
          var blob = file.slice( fileposition, fileposition + incl_len );
          fileposition += incl_len;
          reader.readAsArrayBuffer( blob );
          state = 2;
          break;
        case 2:
          var uint8array = new Uint8Array( data );
          var etherpacket = {};
          etherpacket.frame = frame;
          frame++;
          etherpacket.ts_sec = ts_sec + ( ts_usec / 1000000 );
          if ( -1 == ts_firstether )
          {
            ts_firstether = etherpacket.ts_sec;
          }
          etherpacket.ts_sec_offset = ( ts_sec + ( ts_usec / 1000000 ) ) - ts_firstether;
          //etherpacket.ts_usec = ts_usec;
          etherpacket.src = "" + toHex( uint8array[ 0 ] ) + ":" + toHex( uint8array[ 1 ] ) + ":" + toHex( uint8array[ 2 ] ) + ":" + toHex( uint8array[ 3 ] ) + ":" + toHex( uint8array[ 4 ] ) + ":" + toHex( uint8array[ 5 ] );
          etherpacket.dst = "" + toHex( uint8array[ 6 ] ) + ":" + toHex( uint8array[ 7 ] ) + ":" + toHex( uint8array[ 8 ] ) + ":" + toHex( uint8array[ 9 ] ) + ":" + toHex( uint8array[ 10 ] ) + ":" + toHex( uint8array[ 11 ] );
          etherpacket.ethertype = "" + toHex( uint8array[ 12 ] ) + toHex( uint8array[ 13 ] );
          if ( parseInt( etherpacket.ethertype, 16 ) > 1536 )
          {
            // Ref: https://en.wikipedia.org/wiki/EtherType
            switch ( etherpacket.ethertype )
            {
            case "0800":
              /* IPV4 */
              etherpacket.ipv4 = {};
              etherpacket.ipv4.data = uint8array.slice( 14, uint8array.length );
              etherpacket.ipv4.version = parseInt( toHex( ( etherpacket.ipv4.data[ 0 ] >> 4 ) & 0xf ), 16 );
              etherpacket.ipv4.ihl = parseInt( toHex( etherpacket.ipv4.data[ 0 ] & 0xf ), 16 );
              etherpacket.ipv4.dscp = toHex( ( etherpacket.ipv4.data[ 1 ] >> 2 ) & 0x3f );
              etherpacket.ipv4.ecn = toHex( etherpacket.ipv4.data[ 1 ] & 0x3 );
              etherpacket.ipv4.totallength = parseInt( toHex( etherpacket.ipv4.data[ 2 ] ) + toHex( etherpacket.ipv4.data[ 3 ] ), 16 );
              etherpacket.ipv4.identification = parseInt( toHex( etherpacket.ipv4.data[ 4 ] ) + toHex( etherpacket.ipv4.data[ 5 ] ), 16 );
              etherpacket.ipv4.flags = toHex( ( etherpacket.ipv4.data[ 6 ] >> 5 ) & 7 );
              etherpacket.ipv4.fragmentoffset = "" + toHex( etherpacket.ipv4.data[ 6 ] & 0x1f ) + toHex( etherpacket.ipv4.data[ 7 ] );
              etherpacket.ipv4.ttl = etherpacket.ipv4.data[ 8 ];
              etherpacket.ipv4.protocol = etherpacket.ipv4.data[ 9 ];
              etherpacket.ipv4.checksum = "" + toHex( etherpacket.ipv4.data[ 10 ] ) + toHex( etherpacket.ipv4.data[ 11 ] );
              etherpacket.ipv4.src = "" + etherpacket.ipv4.data[ 12 ] + "." + etherpacket.ipv4.data[ 13 ] + "." + etherpacket.ipv4.data[ 14 ] + "." + etherpacket.ipv4.data[ 15 ];
              etherpacket.ipv4.dst = "" + etherpacket.ipv4.data[ 16 ] + "." + etherpacket.ipv4.data[ 17 ] + "." + etherpacket.ipv4.data[ 18 ] + "." + etherpacket.ipv4.data[ 19 ];
              var hostid = -1;
              if ( -1 == ( hostid = ipv4hosts.indexOf( etherpacket.ipv4.src ) ) )
              {
                etherpacket.ipv4.srchostid = ipv4hosts.length;
                ipv4hosts.push( etherpacket.ipv4.src );
              }
              else
              {
                etherpacket.ipv4.srchostid = hostid;
              }
              if ( -1 == ( hostid = ipv4hosts.indexOf( etherpacket.ipv4.dst ) ) )
              {
                etherpacket.ipv4.dsthostid = ipv4hosts.length;
                ipv4hosts.push( etherpacket.ipv4.dst );
              }
              else
              {
                etherpacket.ipv4.dsthostid = hostid;
              }
              switch ( etherpacket.ipv4.protocol )
              {
              case 17:
                /* UDP */
                etherpacket.ipv4.udp = {};
                etherpacket.ipv4.udp.srcport = parseInt( toHex( etherpacket.ipv4.data[ 20 ] ) + toHex( etherpacket.ipv4.data[ 21 ] ), 16 );
                etherpacket.ipv4.udp.dstport = parseInt( toHex( etherpacket.ipv4.data[ 22 ] ) + toHex( etherpacket.ipv4.data[ 23 ] ), 16 );
                etherpacket.ipv4.udp.length = parseInt( toHex( etherpacket.ipv4.data[ 24 ] ) + toHex( etherpacket.ipv4.data[ 25 ] ), 16 );
                etherpacket.ipv4.udp.checksum = parseInt( toHex( etherpacket.ipv4.data[ 26 ] ) + toHex( etherpacket.ipv4.data[ 27 ] ), 16 );
                etherpacket.ipv4.udp.data = etherpacket.ipv4.data.slice( 28, etherpacket.ipv4.data.length );
                break;
              case 6:
                /* TCP */
                etherpacket.ipv4.tcp = {};
                etherpacket.ipv4.tcp.srcport = parseInt( toHex( etherpacket.ipv4.data[ 20 ] ) + toHex( etherpacket.ipv4.data[ 21 ] ), 16 );
                etherpacket.ipv4.tcp.dstport = parseInt( toHex( etherpacket.ipv4.data[ 22 ] ) + toHex( etherpacket.ipv4.data[ 23 ] ), 16 );
                etherpacket.ipv4.tcp.sequencenumber = parseInt( toHex( etherpacket.ipv4.data[ 24 ] ) + toHex( etherpacket.ipv4.data[ 25 ] ) + toHex( etherpacket.ipv4.data[ 26 ] ) + toHex( etherpacket.ipv4.data[ 27 ] ), 16 );
                etherpacket.ipv4.tcp.acknowledgmentnumber = parseInt( toHex( etherpacket.ipv4.data[ 28 ] ) + toHex( etherpacket.ipv4.data[ 29 ] ) + toHex( etherpacket.ipv4.data[ 30 ] ) + toHex( etherpacket.ipv4.data[ 31 ] ), 16 );
                etherpacket.ipv4.tcp.dataoffset = ( etherpacket.ipv4.data[ 32 ] >> 4 ) & 0xf;
                etherpacket.ipv4.tcp.flags = {};
                etherpacket.ipv4.tcp.flags.ns = etherpacket.ipv4.data[ 32 ] & 1;
                etherpacket.ipv4.tcp.flags.cwr = ( etherpacket.ipv4.data[ 33 ] >> 7 ) & 1;
                etherpacket.ipv4.tcp.flags.ece = ( etherpacket.ipv4.data[ 33 ] >> 6 ) & 1;
                etherpacket.ipv4.tcp.flags.urg = ( etherpacket.ipv4.data[ 33 ] >> 5 ) & 1;
                etherpacket.ipv4.tcp.flags.ack = ( etherpacket.ipv4.data[ 33 ] >> 4 ) & 1;
                etherpacket.ipv4.tcp.flags.psh = ( etherpacket.ipv4.data[ 33 ] >> 3 ) & 1;
                etherpacket.ipv4.tcp.flags.rst = ( etherpacket.ipv4.data[ 33 ] >> 2 ) & 1;
                etherpacket.ipv4.tcp.flags.syn = ( etherpacket.ipv4.data[ 33 ] >> 1 ) & 1;
                etherpacket.ipv4.tcp.flags.fin = etherpacket.ipv4.data[ 33 ] & 1;
                etherpacket.ipv4.tcp.windowsize = parseInt( toHex( etherpacket.ipv4.data[ 34 ] ) + toHex( etherpacket.ipv4.data[ 35 ] ), 16 );
                etherpacket.ipv4.tcp.checksum = parseInt( toHex( etherpacket.ipv4.data[ 36 ] ) + toHex( etherpacket.ipv4.data[ 37 ] ), 16 );
                etherpacket.ipv4.tcp.urgentpointer = parseInt( toHex( etherpacket.ipv4.data[ 38 ] ) + toHex( etherpacket.ipv4.data[ 39 ] ), 16 );
                etherpacket.ipv4.tcp.data = etherpacket.ipv4.data.slice( 20 + ( etherpacket.ipv4.tcp.dataoffset * 4 ), etherpacket.ipv4.data.length );
                break;
              }
              break;
            case "86DD":
              /* IPV6 */
              break;
            case "0806":
              /* ARP */
              break;
            case "9100":
              /* VLAN tagged */
              break;
            }
          }
          else
          {
            // We probbaly won't need this as is raw length.
          }
          // here can return the etherframes to push
          etherframes.push( etherpacket );
          if ( etherframes.length > 100 )
          {
            drawGraph( etherframes, ipv4hosts );
            return;
          }
          var blob = file.slice( fileposition, fileposition + 16 );
          fileposition += 16;
          if ( fileposition > file.size )
          {
            drawGraph( etherframes, ipv4hosts );
            return;
          }
          reader.readAsArrayBuffer( blob );
          state = 1;
          break;
        }
      }
      file = files[ 0 ];
      var blob = file.slice( fileposition, fileposition + 24 );
      fileposition += 24;
      reader.readAsArrayBuffer( blob );
    }
    document.getElementById( 'files' ).addEventListener( 'change', handleFileSelect, false );
  }
  else
  {
    alert( 'The File APIs are not fully supported in this browser.' );
  }
} );
