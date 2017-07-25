var net=require('net');
var toolkit=require('./common');
var websocket = require('ws');
var config=toolkit.readConfig("./config-client.json");
if(!config){
	process.exit();
}

var ws = new websocket("ws://"+config.tunnelhost+":"+config.tunnelport);

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
	var index=mixObj.index;
	var id=mixObj.id;
	var data=mixObj.data;
	var socketHandle=toolkit.socketList[index+""][id];
	if(socketHandle){
		socketHandle.write(data);
	} else{
		console.log("找不到句柄id="+id);
	}
});

if(config.type=="custom"){
	var str=JSON.stringify(config.remoteproxy);
	var data= new Buffer(str);
	var buf=toolkit.writeMixBuffer(65535,"00000000",data);
	ws.send(buf);
}

toolkit.socketList={};

//fixed,custom,all
var L=config.localport.length;
for(var i=0;i<=L-1;i++){
	toolkit.socketList[i+""]={};
	toolkit.clientServer(i, config, ws);
}
