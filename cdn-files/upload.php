<?php
/**
 * Sanaa Thrumylens — CDN Upload + Management Endpoint
 * Location: cdn.sanaathrumylens.co.ke/upload.php
 *
 * Operations:
 *   GET  (no params)     → health check
 *   GET  ?list=true      → list all images (flat, newest first)
 *   GET  ?list=true&q=x  → list images matching filename "x"
 *   POST (multipart)     → upload a new image
 *   DELETE ?path=YYYY/MM/file.jpg → delete an image
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
    header('Access-Control-Allow-Methods: POST, GET, DELETE, OPTIONS');
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
    return $_GET['key'] ?? '';
}

function check_auth(): void
{
    $token = get_bearer_token();
    if (!$token || !hash_equals(API_KEY, $token)) {
        send_json(401, ['ok' => false, 'error' => 'Unauthorized. Invalid or missing API key.']);
    }
}

function generate_filename(string $originalName, string $ext): string
{
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

/**
 * Recursively scan the images directory and return all image files.
 * Returns flat list with: path, url, size, modified (ISO date), filename
 */
function list_images(string $dir, string $baseDir): array
{
    $images = [];
    if (!is_dir($dir)) {
        return $images;
    }

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'];

    foreach ($iterator as $file) {
        if (!$file->isFile()) continue;
        $ext = strtolower($file->getExtension());
        if (!in_array($ext, $allowedExtensions, true)) continue;

        $fullPath = $file->getPathname();
        $relativePath = ltrim(str_replace($baseDir, '', $fullPath), '/\\');
        // Normalize to forward slashes (for URLs)
        $relativePath = str_replace('\\', '/', $relativePath);

        $images[] = [
            'path' => $relativePath,
            'url' => PUBLIC_BASE_URL . '/images/' . $relativePath,
            'filename' => $file->getFilename(),
            'size' => $file->getSize(),
            'modified' => date('c', $file->getMtime()),
            'extension' => $ext,
        ];
    }

    return $images;
}

/**
 * Safely resolve a requested path and verify it's within the upload directory.
 * Returns the absolute path or null if invalid.
 */
function resolve_safe_path(string $relativePath): ?string
{
    $relativePath = str_replace('\\', '/', $relativePath);
    // Remove any leading slashes and normalize
    $relativePath = ltrim($relativePath, '/');

    // Block path traversal
    if (strpos($relativePath, '..') !== false || strpos($relativePath, "\0") !== false) {
        return null;
    }

    $fullPath = realpath(UPLOAD_DIR . '/' . $relativePath);
    if ($fullPath === false) {
        return null;
    }

    // Verify the resolved path is within UPLOAD_DIR
    $realUploadDir = realpath(UPLOAD_DIR);
    if ($realUploadDir === false || strpos($fullPath, $realUploadDir) !== 0) {
        return null;
    }

    return $fullPath;
}

// ─── GET: health check, or list images ────────────────────────────────────
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    if (isset($_GET['list'])) {
        // List images — requires auth
        check_auth();

        $images = list_images(UPLOAD_DIR, UPLOAD_DIR);

        // Filter by search query if provided
        $query = trim($_GET['q'] ?? '');
        if ($query !== '') {
            $queryLower = strtolower($query);
            $images = array_values(array_filter($images, function ($img) use ($queryLower) {
                return stripos($img['filename'], $queryLower) !== false
                    || stripos($img['path'], $queryLower) !== false;
            }));
        }

        // Sort by modified date (newest first)
        usort($images, function ($a, $b) {
            return strcmp($b['modified'], $a['modified']);
        });

        // Pagination
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(100, max(1, (int)($_GET['per_page'] ?? 50)));
        $total = count($images);
        $offset = ($page - 1) * $perPage;
        $pageImages = array_slice($images, $offset, $perPage);

        send_json(200, [
            'ok' => true,
            'images' => $pageImages,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => (int)ceil($total / $perPage),
        ]);
    }

    // Health check (no auth)
    send_json(200, [
        'ok' => true,
        'service' => 'sanaa-thrumylens-cdn',
        'methods' => [
            'GET ?list=true' => 'list all images',
            'POST' => 'upload image (multipart/form-data, field name: file)',
            'DELETE ?path=YYYY/MM/file.jpg' => 'delete an image',
        ],
        'auth' => 'Bearer token required for all operations',
    ]);
}

// ─── DELETE: delete an image ─────────────────────────────────────────────
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'DELETE') {
    check_auth();

    $path = trim($_GET['path'] ?? '');
    if ($path === '') {
        send_json(400, ['ok' => false, 'error' => 'Path parameter is required. Use ?path=YYYY/MM/file.jpg']);
    }

    $fullPath = resolve_safe_path($path);
    if ($fullPath === null || !file_exists($fullPath)) {
        send_json(404, ['ok' => false, 'error' => 'File not found.']);
    }

    if (!unlink($fullPath)) {
        send_json(500, ['ok' => false, 'error' => 'Failed to delete file.']);
    }

    $relativePath = str_replace('\\', '/', ltrim(str_replace(realpath(UPLOAD_DIR), '', $fullPath), '/\\'));

    send_json(200, [
        'ok' => true,
        'deleted' => $relativePath,
    ]);
}

// ─── POST: handle upload ─────────────────────────────────────────────────
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    send_json(405, ['ok' => false, 'error' => 'Method not allowed. Use POST, GET, or DELETE.']);
}

check_auth();

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
