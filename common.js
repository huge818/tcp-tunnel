var net=require('net');
var fs=require('fs');
var toolkit={};
/**
 * [readMixBuffer 解析混合数据流]
 * @param  {[buffer]} buf [混合数据流]
 * @return {[object]}     [解析之后的数据格式object]
 */
toolkit.readMixBuffer=function(buf){
	var mix=buf.slice(0,3);
	var mixbuf = new Buffer("mix");
	if(!mix.equals(mixbuf)){
		return {mix:false};
	}
	var L=buf.length;
	var index=buf.slice(3,5).readUInt16BE(0);
	var id=buf.slice(5,13).toString();
	var data=buf.slice(13);
	var portstr=index+"";
	if(typeof(index)!=="number"){
		return {mix:false};
	}
	if(index>65535){
		return {mix:false};
	}
	if(!id.match(/\d{8}/g)){
		return {mix:false};
	}
	return {
		mix:true,
		index:index,
		id:id,
		data:data
	};
}

/**
 * [removeBuffer 移除子buffer]
 * @param  {[buffer]} buf    [main buffer]
 * @param  {[buffer]} subuff [sub buffer]
 * @return {[buffer]}        [result buffer]
 */
toolkit.removeBuffer=function(buf,subuff){
	var pos=buf.indexOf(subuff);
	var L=subuff.length;
	var A=buf.slice(0,pos);
	var B=buf.slice(pos+L);
	var data= Buffer.concat([A,B]);
	return data;
}

/**
 * [writeMixBuffer 组装混合流的数据包]
 * @param  {[number]} index [混合流之前数据的端口]
 * @param  {[string]} id   [唯一标识符]
 * @param  {[buffer]} buf  [混合之前的buffer数据]
 * @return {[buffer]}      [混合之后的buffer]
 */
toolkit.writeMixBuffer=function(index, id, buf){
	var mix= new Buffer("mix");
	var bufindex= new Buffer(2);
	bufindex.writeUInt16BE(index,0);
	var bufid = new Buffer(id);
	var data= Buffer.concat([mix,bufindex,bufid,buf]);
	return data;
}

/**
 * [checkreadBuffer 检查混合包是否有误]
 * @param  {[buffer]} data [description]
 * @param  {[string]} log  [description]
 * @return {[buffer]}      [description]
 */
toolkit.checkreadBuffer=function(data,log){
	var mixObj = toolkit.readMixBuffer(data);
	console.log("==========="+log+"==============");
	if(!mixObj.mix){
		return false;
	}
	if(typeof(mixObj.index)!=="number"){
		console.log("数据异常!index");
		return false;
	}
	if(mixObj.id.length!==8){
		console.log("数据异常!id");
		return false;
	}
	if(mixObj.data.length!==data.length-13){
		console.log("数据异常!data");
		console.log(mixObj.data.length,data.length);
		console.log("id="+mixObj.id+"\n");
		console.log("index="+mixObj.index+"\n");
		console.log("data=",data);
		return false;
	}
	return true;
}

/**
 * [uuid 唯一id，8位字符串，待优化]
 * @return {[string]} [字符串id]
 */
toolkit.uuid=function(){
	var str=parseInt(Math.random()*100000000)+"";
	var L=str.length;
	if(L==8){
		return str;
	}
	var M=8-L;
	for(var i=1;i<=8-L;i++){
		str=str+"0";
	}
	if(str.length!==8){
		console.log("error str.length!==8");
	}
	return str;
}

/**
 * [clientServer 客户端即时创建客户端tcpserver,提供给客户端自己使用127.0.0.1来调用]
 * @param  {[number]}   port      [客户端本地端口]
 * @param  {[socket]}   mixClient [混合数据流句柄]
 * @param  {Function}   callback  [回调]
 */
toolkit.clientServer=function(index, config, ws){
	var self=this;
	var port=config.localport[index];
	var tcpServer = net.createServer(function(socket){
		var id=toolkit.uuid();
		self.socketList[index+""][id]=socket;
		//收到浏览器或其他客户端发来的数据
		socket.on("data",function(data){
			var buf=toolkit.writeMixBuffer(index,id,data);
			toolkit.checkreadBuffer(buf,"client server "+port);
			var mixObj = toolkit.readMixBuffer(buf);
			if(!mixObj.mix){
				console.log("toolkit.clientServer 数据异常!mix");
				return false;
			}
			ws.send(buf);
		});

		socket.on('timeout', function(){
			console.log("socket timeout");
		});

		var fn=function(error){
			console.log(error);	
			setTimeout(function(){
				delete self.socketList[index+""][id];
			},1000);
		}
		socket.on("end",fn);
		socket.on("error",fn);
		socket.on("close",fn);
	});

	tcpServer.on('error', function(err){
		  throw err;
	});

	tcpServer.listen(port);
}

/**
 * [clientConnect 服务器端client连接到各个提供服务器的host:port
 * 暂时只提供服务器本地host
 * mixserver发送给singclient的是解析后的直接流
 * singleclient发送给mixserver的是加头之后的混合流
 * ]
 * @param  {[string]}   id        [socket唯一标识符]
 * @param  {[number]}   index     [序号]
 * @param  {[socket]}   mixSocket [服务器端主服务器socket句柄]
 * @param  {Function}   fn        [连接成功回调]
 * @return {[object]}             [client连接句柄]
 */
toolkit.clientConnect=function(id,index,address,ws,fn){
	var singleClient = net.createConnection(address, function(){
		console.log("connect ok");
		console.log();
		if(!toolkit.socketList[index+""]){
			toolkit.socketList[index+""]={};
		}
		toolkit.socketList[index+""][id]=singleClient;
		fn&&fn(singleClient);
	});

	singleClient.on('data', function(buf){
		var data=toolkit.writeMixBuffer(index,id,buf);
		toolkit.checkreadBuffer(data,"singleClient发送给mixServer");
		ws.send(data);
	});

	singleClient.on('end', function(){
		console.log("end");
		setTimeout(function(){
			delete toolkit.socketList[index+""][id];
		},1000);
	});

	singleClient.on('timeout', function(){
		console.log(" singleClient timeout");
	});

	return singleClient;
}

/**
 * [readConfig 读取配置]
 * @param  {[type]}   path [配置文件路径]
 * @param  {Function} fn   [回调]
 */
toolkit.readConfig=function(path,fn){
	var flag=fs.existsSync(path);
	if(!flag){
		fn&&fn("file not exist");
		return;
	}
	var data=fs.readFileSync(path,"utf-8");
	try{
		var config=JSON.parse(data);
	} 
	catch(e){
		fn&&fn("JSON.parse error");
		console.log("JSON.parse error");
		return;
	}
	fn&&fn(null,config);
	return config;
}

toolkit.socketList={};

module.exports = toolkit;

