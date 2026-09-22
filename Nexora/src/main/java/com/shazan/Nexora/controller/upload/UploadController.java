package com.shazan.Nexora.controller.upload;

import com.shazan.Nexora.common.ApiResponse;
import com.shazan.Nexora.common.exception.ApiException;
import com.shazan.Nexora.dto.upload.UploadedFileResponse;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/uploads")
public class UploadController {

    private final Path uploadDir = Paths.get("uploads", "certificates").toAbsolutePath().normalize();

    public UploadController() {
        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    @PostMapping(value = "/certificate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<UploadedFileResponse> uploadCertificate(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("FILE_EMPTY", "File cannot be empty");
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "certificate";
        }
        // Sanitize filename to prevent directory traversal or unusual characters
        String safeName = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        String storedName = UUID.randomUUID() + "_" + safeName;

        try {
            Path targetLocation = uploadDir.resolve(storedName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw ApiException.internal("UPLOAD_FAILED", "Failed to store file: " + ex.getMessage());
        }

        String fileUrl = "/api/v1/uploads/certificates/" + storedName;
        return ApiResponse.ok(new UploadedFileResponse(fileUrl, originalFilename, file.getContentType(), file.getSize()));
    }

    @GetMapping("/certificates/{filename:.+}")
    public ResponseEntity<Resource> serveCertificate(@PathVariable String filename) {
        try {
            Path filePath = uploadDir.resolve(filename).normalize();
            if (!filePath.startsWith(uploadDir)) {
                return ResponseEntity.badRequest().build();
            }
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (MalformedURLException ex) {
            return ResponseEntity.badRequest().build();
        } catch (IOException ex) {
            return ResponseEntity.internalServerError().build();
        }
    }
}

