web:    SCHEDULER=false \
        MIN_TASK_PROCESSORS=0 \
        MAX_TASK_PROCESSORS=0 \
        ENABLE_WEB_SERVER=true  \
        ENABLE_SOCKET_SERVER=true  \
        ENABLE_WEBSOCKET_SERVER=true  \
        ./node_modules/.bin/actionhero start

worker: SCHEDULER=true  \
        MIN_TASK_PROCESSORS=5 \
        MAX_TASK_PROCESSORS=5 \
        ENABLE_WEB_SERVER=false \
        ENABLE_SOCKET_SERVER=false \
        ENABLE_WEBSOCKET_SERVER=false \
        ./node_modules/.bin/actionhero start
