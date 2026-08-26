<?php
/**
 * CDN configuration. Copy this file to config.php and fill in your values.
 *
 * IMPORTANT: Keep config.php out of version control. It contains your API key.
 */

return [
    // Generate a strong API key (e.g. from https://passwordsgenerator.net)
    // Use at least 32 random characters.
    'api_key' => 'CHANGE_ME_TO_A_LONG_RANDOM_STRING_32_CHARS_PLUS',

    // Where uploaded files are stored (absolute or relative to this file).
    // Default: an "images" folder next to upload.php
    'upload_dir' => __DIR__ . '/images',

    // The public base URL of your CDN subdomain
    'public_base_url' => 'https://cdn.sanaathrumylens.co.ke',

    // Max upload size in MB
    'max_file_size_mb' => 10,

    // Domains allowed to upload via CORS (your blog frontend)
    'allowed_origins' => [
        'https://www.saaathrumylens.co.ke',
        'https://saaathrumylens.co.ke',
        // Add localhost during development if needed:
        // 'http://localhost:3000',
    ],
];
