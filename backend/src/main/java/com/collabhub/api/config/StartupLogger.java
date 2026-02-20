package com.collabhub.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Connection;

@Configuration
public class StartupLogger {

    private static final Logger logger = LoggerFactory.getLogger(StartupLogger.class);

    @Bean
    public ApplicationRunner logDatabaseConnection(DataSource dataSource) {
        return args -> {
            try (Connection connection = dataSource.getConnection()) {
                if (connection.isValid(2)) {
                    logger.info("✅ Database connection established successfully!");
                    logger.info("Connected to: {}", connection.getMetaData().getURL());
                }
            } catch (Exception e) {
                logger.error("❌ Failed to connect to the database", e);
            }
        };
    }
}
