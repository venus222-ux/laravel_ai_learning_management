<?php

return [
    'namespace' => '<NAMESPACE>',

    'redis' => [
        'host' => env('REDIS_HOST', '<REDIS_CONTAINER_NAME>'),
        'port' => (int) env('REDIS_PORT', 6379),
        'timeout' => 1.0,
        'read_timeout' => '10',
        'persistent_connections' => false,
        'database' => (int) env('REDIS_METRICS_DB', 2), // opțional: DB separat, ca să nu se amestece cu cache-ul
    ],
];