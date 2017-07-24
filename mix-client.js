var net=require('net');
var toolkit=require('./common');

var websocket = require('ws');
var ws = new websocket('ws://172.16.41.1:9099');

ws.on('open', function(){
	console.log("connect ok");
});
 
ws.on('message', function(buf) {
	var mixObj=toolkit.readMixBuffer(buf);
	toolkit.checkreadBuffer(buf,"mixClient收到数据解析readMixBuffer");
	if(!mixObj.mix){
		console.log("mixClient回来非mix");
		return;
	}
	var port=mixObj.port;
	var id=mixObj.id;
	var data=mixObj.data;
	var socketHandle=toolkit.socketList[id];
	if(socketHandle){
		socketHandle.write(data);
	} else{
		console.log("找不到句柄id="+id);
	}
});

toolkit.socketList={};

toolkit.clientServer(82,ws);
