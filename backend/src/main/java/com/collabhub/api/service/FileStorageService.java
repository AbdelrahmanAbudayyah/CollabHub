package com.collabhub.api.service;

import com.collabhub.api.exception.BadRequestException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

/**
 * Handles storing uploaded files to the local filesystem.
 *
 * For MVP, files go to an `uploads/` directory on the server.
 * In production you'd swap this for S3 or similar cloud storage.
 *
 * @Value reads from application.yml:
 *   app:
 *     upload:
 *       dir: uploads
 *
 * Spring injects the value "uploads" into the uploadDir field.
 */
@Service
public class FileStorageService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    private Path uploadPath;

    // Allowed image types — anything else gets rejected
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );

    /**
     * @PostConstruct runs ONCE after the bean is created and
     * all @Value fields are injected. We use it to create the
     * uploads directory if it doesn't exist yet.
     *
     * Without this, the first upload would fail with
     * "NoSuchFileException" because the directory doesn't exist.
     */
    @PostConstruct
    public void init() {
        uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    /**
     * Stores an uploaded file and returns the URL path to access it.
     *
     * Steps:
     * 1. Validate: check file isn't empty, is an allowed image type
     * 2. Generate a unique filename using UUID (prevents name collisions
     *    if two users upload "photo.jpg")
     * 3. Copy the file bytes to disk
     * 4. Return the URL path like "/uploads/a1b2c3d4.jpg"
     *
     * @param file The uploaded file from the HTTP request
     * @param subfolder A subdirectory like "profile-pics" to organize files
     * @return URL path to access the file (e.g. "/uploads/profile-pics/uuid.jpg")
     */
    public String storeFile(MultipartFile file, String subfolder) {
        // Validate the file
        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new BadRequestException("Only JPEG, PNG, and WebP images are allowed");
        }

        // Extract file extension from original filename
        // "photo.jpg" → ".jpg"
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // Generate unique filename: "a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg"
        // UUID guarantees no collisions even with millions of uploads
        String uniqueFilename = UUID.randomUUID() + extension;

        try {
            // Create subfolder if needed (e.g. uploads/profile-pics/)
            Path targetDir = uploadPath.resolve(subfolder);
            Files.createDirectories(targetDir);

            // Copy file bytes to disk, overwriting if file somehow exists
            Path targetPath = targetDir.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            // Return the URL path (not filesystem path)
            // This is what gets stored in the DB and sent to the frontend
            return "/uploads/" + subfolder + "/" + uniqueFilename;

        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }
}
