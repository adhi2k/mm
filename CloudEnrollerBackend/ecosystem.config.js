module.exports = {
  apps: [{
    name: "cloud-enroller",
    script: "./index.js",
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production",
    },
    error_file: "./logs/pm2-error.log",
    out_file: "./logs/pm2-out.log",
    time: true
  }]
}
