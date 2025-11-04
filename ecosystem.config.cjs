module.exports = {
  apps: [
    {
      name: 'citizen-reports-app',
      script: './server/server.js',
      exec_mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        DB_PATH: '/root/citizen-reports/data.db'
      },
      error_file: '/root/logs/app-error.log',
      out_file: '/root/logs/app-output.log',
      log_file: '/root/logs/app-combined.log',
      time: true,
      max_memory_restart: '500M',
      watch: false,
      max_restarts: 5,
      min_uptime: '10s'
    },
    {
      name: 'webhook-server',
      script: '/root/webhook-server.js',
      exec_mode: 'fork',
      instances: 1,
      env: {
        PORT: 3000,
        GITHUB_WEBHOOK_SECRET: 'your-webhook-secret-change-this'
      },
      error_file: '/root/logs/webhook-error.log',
      out_file: '/root/logs/webhook-output.log',
      log_file: '/root/logs/webhook-combined.log',
      time: true,
      max_memory_restart: '200M',
      watch: false,
      max_restarts: 5,
      min_uptime: '10s'
    }
  ]
};
