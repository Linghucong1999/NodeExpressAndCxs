module.exports = {
  apps: [{
    name: "FreshGoServer",
    script: "./index.js",
    watch: true,   //启动热更新
    log_date_format: "YYYY-MM-DD HH:mm Z",  //日志时间格式
    error_file: "./logs/FreshGoServer-err.log",  //错误日志路径
    out_file: "./logs/FreshGoServer-out.log",  //输出日志路径
    max_restarts: 10,  //最大重启数
    restart_delay: 4000,  //延时重启时间
    autorestart: true,  //自动重启
    ignore_watch: [                           // 不用监听的文件
      "node_modules",
      "logs"
    ],
    windowsHide: true,
  }]
}
