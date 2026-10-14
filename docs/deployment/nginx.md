# Jinyu Planet 部署与 Nginx 反向代理

Jinyu Planet 的生产容器在 Docker `web` 网络中监听 `3000` 端口，Nginx 通过容器名 `jinyu-planet:3000` 转发请求。对外站点使用：

- 域名：`www.jinyulab.com`
- Nginx 配置：`E:\\LJYcc\\stack\\nginx\\conf.d\\default.conf`
- 应用 Compose：`E:\\LJYcc\\stack\\jinyu-planet\\docker-compose.yml`

## 部署后检查

1. 确认 DNS 的 `www.jinyulab.com` A 记录指向服务器公网 IP。
2. 验证并热重载 Nginx：

   ```bash
   docker compose -f /opt/stack/nginx/docker-compose.yml up -d nginx
   docker compose -f /opt/stack/nginx/docker-compose.yml exec -T nginx nginx -t
   docker compose -f /opt/stack/nginx/docker-compose.yml exec -T nginx nginx -s reload
   ```

3. 验证返回头和页面：

   ```bash
   curl -I http://www.jinyulab.com/
   ```

4. 目前配置为 HTTP 反向代理。接入 TLS 证书后，再增加 `listen 443 ssl` 和 HTTP 跳转 HTTPS 配置，并将证书路径以只读方式挂载到 Nginx 容器。

HTTPS 证书上线并验证通过后，可再删除 Compose 中的 `3000:3000` 映射，防止绕过 Nginx；在此之前保留它作为临时回退入口。
