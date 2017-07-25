# tcp-tunnel
Mixing multiple port data into one port channel

```混合多个端口的数据，走一个端口通道。
场景：当服务器的防火墙封闭了几乎所有的端口，只开放了3000端口，我们如何访问其他端口的服务呢，只需要服务器端安装mix-server服务
在客户端装一个 mix-client服务，客户端通过访问127.0.0.1+port 来访问远程服务器的所有端口服务。端口3000可以走所有数据。
```