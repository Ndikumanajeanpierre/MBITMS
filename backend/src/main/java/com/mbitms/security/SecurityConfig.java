package com.mbitms.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // ✅ Static files — FIRST, before everything else
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()

                .requestMatchers("/api/users/**").hasAuthority("ROLE_ADMIN")

                .requestMatchers("/api/audit-logs/**").hasAnyAuthority(
                    "ROLE_ADMIN", "ROLE_HEAD_OFFICE_ADMIN")

                .requestMatchers(HttpMethod.GET, "/api/branches/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/branches/**").hasAnyAuthority(
                    "ROLE_ADMIN", "ROLE_HEAD_OFFICE_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/branches/**").hasAnyAuthority(
                    "ROLE_ADMIN", "ROLE_HEAD_OFFICE_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/branches/**").hasAuthority(
                    "ROLE_ADMIN")

                .requestMatchers(HttpMethod.GET, "/api/items/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/items/**").hasAnyAuthority(
                    "ROLE_ADMIN", "ROLE_HEAD_OFFICE_ADMIN", "ROLE_BRANCH_MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/items/**").hasAnyAuthority(
                    "ROLE_ADMIN", "ROLE_HEAD_OFFICE_ADMIN", "ROLE_BRANCH_MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/api/items/**").hasAnyAuthority(
                    "ROLE_ADMIN", "ROLE_HEAD_OFFICE_ADMIN")

                .requestMatchers(HttpMethod.GET, "/api/suppliers/**").hasAnyAuthority(
                    "ROLE_ADMIN", "ROLE_HEAD_OFFICE_ADMIN", "ROLE_ACCOUNTANT")
                .requestMatchers(HttpMethod.POST, "/api/suppliers/**").hasAnyAuthority(
                    "ROLE_ADMIN", "ROLE_HEAD_OFFICE_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/suppliers/**").hasAnyAuthority(
                    "ROLE_ADMIN", "ROLE_HEAD_OFFICE_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/suppliers/**").hasAnyAuthority(
                    "ROLE_ADMIN", "ROLE_HEAD_OFFICE_ADMIN")

                .requestMatchers(HttpMethod.GET, "/api/purchase-orders/**").hasAnyAuthority(
                    "ROLE_ADMIN", "ROLE_HEAD_OFFICE_ADMIN", "ROLE_ACCOUNTANT")
                .requestMatchers(HttpMethod.POST, "/api/purchase-orders/**").hasAnyAuthority(
                    "ROLE_ADMIN", "ROLE_HEAD_OFFICE_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/purchase-orders/**").hasAnyAuthority(
                    "ROLE_ADMIN", "ROLE_HEAD_OFFICE_ADMIN")

                .requestMatchers(HttpMethod.GET, "/api/transfers/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/transfers").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/transfers/*/approve").hasAnyAuthority(
                    "ROLE_ADMIN", "ROLE_HEAD_OFFICE_ADMIN", "ROLE_BRANCH_MANAGER")
                .requestMatchers(HttpMethod.POST, "/api/transfers/*/approve/l2").hasAnyAuthority(
                    "ROLE_ADMIN", "ROLE_HEAD_OFFICE_ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/transfers/*/transit").hasAnyAuthority(
                    "ROLE_ADMIN", "ROLE_HEAD_OFFICE_ADMIN", "ROLE_BRANCH_MANAGER")
                .requestMatchers(HttpMethod.POST, "/api/transfers/*/receive").hasAnyAuthority(
                    "ROLE_ADMIN", "ROLE_HEAD_OFFICE_ADMIN", "ROLE_BRANCH_MANAGER")

                .requestMatchers("/api/analytics/**").hasAnyAuthority(
                    "ROLE_ADMIN", "ROLE_HEAD_OFFICE_ADMIN", "ROLE_ACCOUNTANT")

                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        CorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        ((UrlBasedCorsConfigurationSource) source).registerCorsConfiguration("/**", config);
        return source;
    }
}