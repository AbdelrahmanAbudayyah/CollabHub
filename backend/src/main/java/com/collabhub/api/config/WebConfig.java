package com.collabhub.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * Configures Spring MVC to serve uploaded files as static resources.
 *
 * Problem: When a user uploads a profile pic, it gets saved to the
 * `uploads/` directory on disk. But by default, Spring only serves
 * files from src/main/resources/static/. The browser can't access
 * files in `uploads/` unless we explicitly tell Spring to serve them.
 *
 * Solution: We map the URL path "/uploads/**" to the filesystem
 * directory "uploads/". So when the browser requests:
 *   GET /uploads/profile-pics/abc123.jpg
 * Spring looks for the file at:
 *   ./uploads/profile-pics/abc123.jpg
 *
 * WebMvcConfigurer is a Spring interface that lets you customize
 * the default MVC configuration. By implementing addResourceHandlers,
 * we add our own static file mapping without losing the defaults.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Convert relative path "uploads" to absolute "file:///Users/.../uploads/"
        // The "file:" prefix tells Spring this is a filesystem path, not a classpath
        String absolutePath = Paths.get(uploadDir).toAbsolutePath().normalize().toUri().toString();

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(absolutePath);
    }
}
