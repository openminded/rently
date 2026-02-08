module.exports = {
    apps: [{
        name: 'werently-prod',
        script: './dist/index.js',
        env_production: {
            NODE_ENV: 'production',
            PORT: 3006 // Port for werently.com (Process ID: werently-prod)
        },
        // Error handling
        error_file: './logs/prod_err.log',
        out_file: './logs/prod_out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss',
        merge_logs: true,
        // Restart policy
        max_restarts: 10,
        min_uptime: '10s',
        restart_delay: 4000
    }]
};
