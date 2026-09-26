package com.rahul.insurance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@SpringBootApplication
public class InsuranceManagementSystemApplication {

	public static void main(String[] args) {
		loadDotEnv();
		SpringApplication.run(InsuranceManagementSystemApplication.class, args);
	}

	private static void loadDotEnv() {
		// Automatically check current directory and parent directory for .env file
		List<Path> candidates = List.of(Path.of(".env"), Path.of("../.env"));
		for (Path p : candidates) {
			if (Files.exists(p)) {
				try {
					List<String> lines = Files.readAllLines(p);
					for (String line : lines) {
						line = line.trim();
						if (line.isEmpty() || line.startsWith("#")) continue;
						int idx = line.indexOf('=');
						if (idx > 0) {
							String key = line.substring(0, idx).trim();
							String val = line.substring(idx + 1).trim();
							if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
								val = val.substring(1, val.length() - 1);
							}
							if (System.getProperty(key) == null && System.getenv(key) == null) {
								System.setProperty(key, val);
							}
						}
					}
					System.out.println("✅ Automatically loaded environment from " + p.toAbsolutePath().normalize());
					break;
				} catch (IOException ignored) {}
			}
		}
	}
}
