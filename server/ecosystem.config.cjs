module.exports = {
    apps: [{
        name: 'werently-server',
        script: './dist/index.js',
        env_production: {
            NODE_ENV: 'production',
            PORT: 3005 // Force 3005
        },
        env_development: {
            NODE_ENV: 'development',
            PORT: 3005 // Force 3005
        },
        // Error handling
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss',
        merge_logs: true,
        // Restart policy
        max_restarts: 10,
        min_uptime: '10s',
        restart_delay: 4000
    }]
};
