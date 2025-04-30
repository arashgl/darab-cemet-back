module.exports = {
  apps: [
    {
      name: 'darab-cement-api',
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3100,
      },
      cwd: '/home/darab-cemet-back',
      error_file: '/home/darab-cemet-back/logs/error.log',
      out_file: '/home/darab-cemet-back/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};
