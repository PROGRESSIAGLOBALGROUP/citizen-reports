module.exports = {
  apps: [
    {
      name: 'webhook-auto-deploy',
      script: './server/webhook-github-auto-deploy.js',
      cwd: '/root/citizen-reports',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      error_file: '/var/log/citizen-reports/webhook-error.log',
      out_file: '/var/log/citizen-reports/webhook-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        GITHUB_WEBHOOK_SECRET: 'change-me-in-github-settings',
        WEBHOOK_PORT: '3000',
        DEPLOY_REPO_PATH: '/root/citizen-reports',
        STACK_NAME: 'citizen-reports',
        LOG_DIR: '/var/log/citizen-reports'
      }
    }
  ]
};
