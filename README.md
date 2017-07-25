# tcp-tunnel
Mixing multiple port data into one port channel

混合多个端口的数据，走一个端口通道。

例如：当服务器（IP：172.16.41.1）的防火墙封闭了几乎所有的端口，只开放了1088端口，

我们如何访问服务器的其他端口（80,82,9000）的服务呢? 

只需要

在服务器端执行
```javascript
node mix-server
```

在客户端执行

```javascript
node mix-client
```

客户端通过访问

127.0.0.1:5080

127.0.0.1:5081

127.0.0.1:5022

这样通过本地IP访问远程服务器的一些端口的服务。
端口1088可以走所有协议数据，称之为隧道端口。

配置文件说明

config-client.json

```javascript
{
	"tunnelhost":"172.16.41.1", //远程服务器IP
	"tunnelport":1088, //远程服务器隧道端口，可以不改
	"type":"fixed",    //连接模式，和服务器提供的保持一致，有fixed和custom两个值，
	//fixed模式表示服务端代理host+port服务，custom模式表示客户端来指定服务代理哪些host+port，custom模式比较危险，慎用
	"userinfo":{       //用户认证账号，以后支持
		"username":"user1", 
		"password":"123456"
	},
	"localport": [5080,5081,5022], //本地提供服务的三个端口
	"remoteproxy":[] //type为custom的时候可配置此属性格式为多个对象 example：{"host":"xx.xx.xx.xx","port":80}
}
```

config-server.json

```javascript
{
	"tunnelhost":"172.16.41.1", //本机IP地址，可以不写
	"tunnelport":1088, //本机监听端口，隧道端口
	"type":"fixed",  //连接模式，和服务器提供的保持一致，有fixed和custom两个值，
	//fixed模式表示服务端代理host+port服务，custom模式表示客户端来指定服务代理哪些host+port，custom模式比较危险，慎用
	"users":[  //用户认证账号列表，以后支持
		{
			"username":"user1",
			"password":"123456",
			"status":"up"
		},
		{
			"username":"user2",
			"password":"123456",
			"status":"down"
		}
	],
	"proxy":[ //指定代理哪些服务，ip可是本地的127.0.0.1，这个用得比较多，也就可以配置其他局域网IP和外网IP
		{
			"host":"127.0.0.1",
			"port":82
		},
		{
			"host":"127.0.0.1",
			"port":9000
		},
		{
			"host":"172.16.203.254",
			"port":80
		}
	]
}
```