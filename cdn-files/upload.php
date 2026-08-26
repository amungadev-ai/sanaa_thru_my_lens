<?php
/**
 * Sanaa Thrumylens — CDN Upload Endpoint
 * Location: cdn.sanaathrumylens.co.ke/upload.php
 *
 * Accepts authenticated POST requests with image files,
 * stores them with unique names, and returns the public URL.
 *
 * Authentication: Bearer token via Authorization header or ?key= query param.
 * The API key is defined in config.php (see config.example.php).
 */

declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

// --- Bootstrap -------------------------------------------------------------
$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'CDN not configured. Create config.php from config.example.php']);
    exit;
}
$config = require $configPath;

define('API_KEY', $config['api_key'] ?? '');
define('UPLOAD_DIR', rtrim($config['upload_dir'] ?? __DIR__ . '/images', '/'));
define('PUBLIC_BASE_URL', rtrim($config['public_base_url'] ?? 'https://cdn.sanaathrumylens.co.ke', '/'));
define('MAX_FILE_SIZE', ($config['max_file_size_mb'] ?? 10) * 1024 * 1024);
define('ALLOWED_ORIGINS', $config['allowed_origins'] ?? [
    'https://www.saaathrumylens.co.ke',
    'https://saaathrumylens.co.ke',
]);

// --- CORS ------------------------------------------------------------------
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ALLOWED_ORIGINS, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Vary: Origin');
}
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// --- Helpers ---------------------------------------------------------------
function send_json(int $code, array $data): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function get_bearer_token(): string
{
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(.+)/i', $auth, $m)) {
        return trim($m[1]);
    }
    // Apache may strip Authorization; fall back to query param
    return $_GET['key'] ?? '';
}

function generate_filename(string $originalName, string $ext): string
{
    // Use original slugified name + short unique suffix to keep names readable
    $base = pathinfo($originalName, PATHINFO_FILENAME);
    $base = preg_replace('/[^a-zA-Z0-9-_]/', '-', $base);
    $base = preg_replace('/-+/', '-', $base);
    $base = trim($base, '-');
    if ($base === '' || strlen($base) > 60) {
        $base = 'image-' . date('Ymd');
    }
    $suffix = bin2hex(random_bytes(4));
    $datePrefix = date('Y/m');
    return "{$datePrefix}/{$base}-{$suffix}.{$ext}";
}

// --- GET: health check -----------------------------------------------------
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    send_json(200, [
        'ok' => true,
        'service' => 'sanaa-thrumylens-cdn',
        'methods' => ['POST' => 'upload image (multipart/form-data, field name: file)'],
        'auth' => 'Bearer token required',
    ]);
}

// --- POST: handle upload ---------------------------------------------------
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    send_json(405, ['ok' => false, 'error' => 'Method not allowed. Use POST.']);
}

// Auth check
$token = get_bearer_token();
if (!$token || !hash_equals(API_KEY, $token)) {
    send_json(401, ['ok' => false, 'error' => 'Unauthorized. Invalid or missing API key.']);
}

// File check
if (!isset($_FILES['file']) || $_FILES['file']['error'] === UPLOAD_ERR_NO_FILE) {
    send_json(400, ['ok' => false, 'error' => 'No file uploaded. Use field name "file".']);
}

$file = $_FILES['file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    $messages = [
        UPLOAD_ERR_INI_SIZE => 'File exceeds server upload_max_filesize.',
        UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE form value.',
        UPLOAD_ERR_PARTIAL => 'File was only partially uploaded.',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder.',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
        UPLOAD_ERR_EXTENSION => 'Upload blocked by PHP extension.',
    ];
    send_json(400, ['ok' => false, 'error' => $messages[$file['error']] ?? 'Unknown upload error.']);
}

// Size check
if ($file['size'] > MAX_FILE_SIZE) {
    send_json(413, [
        'ok' => false,
        'error' => 'File too large. Maximum size is ' . (MAX_FILE_SIZE / 1024 / 1024) . 'MB.',
    ]);
}

// Type check — verify actual MIME, not just extension
$allowed = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/gif' => 'gif',
    'image/webp' => 'webp',
    'image/svg+xml' => 'svg',
    'image/avif' => 'avif',
];

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']);

if (!isset($allowed[$mime])) {
    send_json(415, [
        'ok' => false,
        'error' => 'Unsupported file type: ' . $mime . '. Allowed: ' . implode(', ', array_keys($allowed)),
    ]);
}

$ext = $allowed[$mime];
$relativePath = generate_filename($file['name'], $ext);
$fullPath = UPLOAD_DIR . '/' . $relativePath;

// Ensure directory exists
$dir = dirname($fullPath);
if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
    send_json(500, ['ok' => false, 'error' => 'Failed to create upload directory.']);
}

// Move the uploaded file
if (!move_uploaded_file($file['tmp_name'], $fullPath)) {
    send_json(500, ['ok' => false, 'error' => 'Failed to save uploaded file.']);
}

// Set permissive read permissions
chmod($fullPath, 0644);

// Build the public URL
$publicUrl = PUBLIC_BASE_URL . '/images/' . $relativePath;

// Get image dimensions if possible
$dimensions = ['width' => null, 'height' => null];
if ($mime !== 'image/svg+xml') {
    $info = @getimagesize($fullPath);
    if ($info !== false) {
        $dimensions['width'] = $info[0];
        $dimensions['height'] = $info[1];
    }
}

send_json(201, [
    'ok' => true,
    'url' => $publicUrl,
    'file' => [
        'name' => basename($relativePath),
        'path' => $relativePath,
        'mime' => $mime,
        'size' => $file['size'],
        'width' => $dimensions['width'],
        'height' => $dimensions['height'],
    ],
]);
