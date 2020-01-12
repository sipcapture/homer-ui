module.exports = {
  apps : [{
    name: 'Homer-App',
    script: 'ng',
    args: 'serve --host 0.0.0.0 --port 8081 --source-map=false --vendorChunk=false --aot=true --disableHostCheck',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }],

  deploy : {
  }
};
