<?php

namespace ChefOS\Storage;

use Exception;

class NextcloudService {
    private $url;
    private $username;
    private $password;
    private $baseFolder;
    private $webdavPath;
    
    public function __construct() {
        $this->url = getenv('NEXTCLOUD_URL');
        $this->username = getenv('NEXTCLOUD_USERNAME');
        $this->password = getenv('NEXTCLOUD_PASSWORD');
        $this->baseFolder = getenv('NEXTCLOUD_BASE_FOLDER') ?: '/ChefOS';
        $this->webdavPath = getenv('NEXTCLOUD_WEBDAV_PATH') ?: '/remote.php/dav/files';
        
        if (!$this->url || !$this->username || !$this->password) {
            throw new Exception('Nextcloud credentials not properly configured');
        }
        
        // Ensure URL ends with /
        $this->url = rtrim($this->url, '/') . '/';
        
        // Ensure base folder exists
        $this->ensureFolder($this->baseFolder);
    }
    
    /**
     * Ensure that a folder path exists, creating parent directories as needed
     */
    private function ensureFolder($path) {
        // Remove leading slash and split path into parts
        $path = ltrim($path, '/');
        $parts = explode('/', $path);
        
        $currentPath = '';
        foreach ($parts as $part) {
            if (empty($part)) continue;
            
            $currentPath .= '/' . $part;
            
            // Check if this directory exists by trying to list it
            $encodedUsername = rawurlencode($this->username);
            $url = $this->url . ltrim($this->webdavPath, '/') . '/' . $encodedUsername . $currentPath;
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Basic ' . base64_encode($this->username . ':' . $this->password)
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            curl_setopt($ch, CURLOPT_NOBODY, true); // HEAD request only
            
            curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            // If directory doesn't exist (404), create it
            if ($httpCode == 404) {
                $this->createDirectory($currentPath);
            }
        }
    }

    /**
     * Upload a file to Nextcloud
     */
    public function uploadFile($localFilePath, $remotePath, $content = null) {
        // Ensure the folder path exists before uploading
        $folderPath = dirname($remotePath);
        if ($folderPath !== '.') {
            $this->ensureFolder($this->baseFolder . '/' . $folderPath);
        }
        
        $remotePath = $this->baseFolder . '/' . ltrim($remotePath, '/');
        $encodedUsername = rawurlencode($this->username);
        $url = $this->url . ltrim($this->webdavPath, '/') . '/' . $encodedUsername . $remotePath;
        
        $headers = [
            'Authorization: Basic ' . base64_encode($this->username . ':' . $this->password),
            'Content-Type: application/octet-stream'
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_PUT, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);
        curl_setopt($ch, CURLOPT_VERBOSE, false);
        
        if ($content !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $content);
        } else {
            curl_setopt($ch, CURLOPT_INFILE, fopen($localFilePath, 'r'));
            curl_setopt($ch, CURLOPT_INFILESIZE, filesize($localFilePath));
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new Exception('cURL error: ' . $error);
        }
        
        if ($httpCode >= 200 && $httpCode < 300) {
            return [
                'success' => true,
                'url' => $url,
                'path' => $remotePath
            ];
        }
        
        throw new Exception('Failed to upload file to Nextcloud: HTTP ' . $httpCode);
    }
    
    /**
     * Download a file from Nextcloud
     */
    public function downloadFile($remotePath) {
        $remotePath = $this->baseFolder . '/' . ltrim($remotePath, '/');
        $encodedUsername = rawurlencode($this->username);
        $url = $this->url . ltrim($this->webdavPath, '/') . '/' . $encodedUsername . $remotePath;
        
        $headers = [
            'Authorization: Basic ' . base64_encode($this->username . ':' . $this->password)
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $content = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode >= 200 && $httpCode < 300) {
            return $content;
        }
        
        throw new Exception('Failed to download file from Nextcloud: HTTP ' . $httpCode);
    }
    
    /**
     * Delete a file from Nextcloud
     */
    public function deleteFile($remotePath) {
        $remotePath = $this->baseFolder . '/' . ltrim($remotePath, '/');
        $encodedUsername = rawurlencode($this->username);
        $url = $this->url . ltrim($this->webdavPath, '/') . '/' . $encodedUsername . $remotePath;
        
        $headers = [
            'Authorization: Basic ' . base64_encode($this->username . ':' . $this->password)
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode >= 200 && $httpCode < 300) {
            return ['success' => true];
        }
        
        throw new Exception('Failed to delete file from Nextcloud: HTTP ' . $httpCode);
    }
    
    /**
     * List files in a directory
     */
    public function listFiles($remotePath = '') {
        $remotePath = $this->baseFolder . '/' . ltrim($remotePath, '/');
        $encodedUsername = rawurlencode($this->username);
        $url = $this->url . ltrim($this->webdavPath, '/') . '/' . $encodedUsername . $remotePath;
        
        $headers = [
            'Authorization: Basic ' . base64_encode($this->username . ':' . $this->password),
            'Depth: 1'
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PROPFIND');
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode >= 200 && $httpCode < 300) {
            // Parse XML response to extract file list
            $files = [];
            $xml = simplexml_load_string($response);
            if ($xml) {
                foreach ($xml->xpath('//d:response') as $response) {
                    $href = (string)$response->xpath('d:href')[0];
                    $displayName = (string)$response->xpath('d:propstat/d:prop/d:displayname')[0];
                    $contentLength = (string)$response->xpath('d:propstat/d:prop/d:getcontentlength')[0];
                    $contentType = (string)$response->xpath('d:propstat/d:prop/d:getcontenttype')[0];
                    
                    if ($displayName && $displayName !== '') {
                        $files[] = [
                            'name' => $displayName,
                            'path' => $href,
                            'size' => $contentLength,
                            'type' => $contentType
                        ];
                    }
                }
            }
            return $files;
        }
        
        throw new Exception('Failed to list files from Nextcloud: HTTP ' . $httpCode);
    }
    
    /**
     * Create a directory
     */
    public function createDirectory($remotePath) {
        // Ensure parent directories exist first
        $parentPath = dirname($remotePath);
        if ($parentPath !== '.' && $parentPath !== '/') {
            $this->ensureFolder($this->baseFolder . '/' . $parentPath);
        }
        
        $remotePath = $this->baseFolder . '/' . ltrim($remotePath, '/');
        $encodedUsername = rawurlencode($this->username);
        $url = $this->url . ltrim($this->webdavPath, '/') . '/' . $encodedUsername . $remotePath;
        
        $headers = [
            'Authorization: Basic ' . base64_encode($this->username . ':' . $this->password)
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'MKCOL');
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode >= 200 && $httpCode < 300) {
            return ['success' => true];
        }
        
        throw new Exception('Failed to create directory in Nextcloud: HTTP ' . $httpCode);
    }
}
