var net=require('net');
var toolkit=require('./common');
var ws = require('ws');

var config=toolkit.readConfig("./config-server.json");
if(!config){
	process.exit();
}

toolkit.socketList={};

var wss = new ws.Server({port:config.tunnelport});
wss.on('connection', function(ws) {
	ws.on('message', function(data) {
		var mixObj = toolkit.readMixBuffer(data);
		toolkit.checkreadBuffer(data,"主服务器接受到mix数据解析");
		if(!mixObj.mix){
			console.log("服务器收到非mix数据");
			return;
		}
		var id=mixObj.id;
		var index=mixObj.index;
		var buf=mixObj.data;
		if(id==="00000000"&&index===65535){
			var str=mixObj.data.toString();
			var proxy=JSON.parse(str);
			config.proxy=proxy;
			return;
		}
		var socketGroup=toolkit.socketList[index+""];
		if(socketGroup&&socketGroup[id]){
			socketGroup[id].write(buf);
		}
		else{
			var fn=function(singleClient){
				singleClient.write(buf);
			};
			var address=config.proxy[index];
			toolkit.clientConnect(id,index,address,ws,fn);
		}
	});
});

console.log("server id running");
