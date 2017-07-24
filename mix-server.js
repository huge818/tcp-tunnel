var net=require('net');
var toolkit=require('./common');

toolkit.socketList={
};

var ws = require('ws');
var wss = new ws.Server({port:9099});
wss.on('connection', function(ws) {
	ws.on('message', function(data) {
		var mixObj = toolkit.readMixBuffer(data);
		toolkit.checkreadBuffer(data,"主服务器接受到mix数据解析");
		if(!mixObj.mix){
			console.log("服务器收到非mix数据");
			return;
		}
		var id=mixObj.id;
		var port=mixObj.port;
		var buf=mixObj.data;
		var socketHandle=toolkit.socketList[id];
		if(socketHandle){
			socketHandle.write(buf);
		}
		else{
			var fn=function(singleClient){
				singleClient.write(buf);
			};
			var address={
				host:"172.16.41.1",
				port:port
			};
			toolkit.clientConnect(id,address,ws,fn);
		}
	});
});


