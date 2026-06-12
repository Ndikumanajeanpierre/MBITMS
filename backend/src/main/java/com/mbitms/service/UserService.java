package com.mbitms.service;

import com.mbitms.entity.User;
import com.mbitms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updateUser(Long id, User updated, String performedByEmail) {
        User user = getUserById(id);
        user.setName(updated.getName());
        user.setRole(updated.getRole());
        user.setBranch(updated.getBranch());

        // ✅ Update email if provided and different from current
        if (updated.getEmail() != null && !updated.getEmail().isBlank()
                && !updated.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(updated.getEmail())) {
                throw new RuntimeException("Email already in use by another user");
            }
            user.setEmail(updated.getEmail());
        }

        User saved = userRepository.save(user);

        auditLogService.log(
            performedByEmail,
            "UPDATE",
            "User",
            saved.getId().toString(),
            "User updated: " + saved.getName() + " — role: " + saved.getRole()
                + " — email: " + saved.getEmail()
        );

        return saved;
    }

    public void deactivateUser(Long id, String performedByEmail) {
        User user = getUserById(id);
        user.setActive(false);
        userRepository.save(user);

        auditLogService.log(
            performedByEmail,
            "DELETE",
            "User",
            user.getId().toString(),
            "User deactivated: " + user.getName() + " (" + user.getEmail() + ")"
        );
    }

    public void reactivateUser(Long id, String performedByEmail) {
        User user = getUserById(id);
        user.setActive(true);
        userRepository.save(user);

        auditLogService.log(
            performedByEmail,
            "UPDATE",
            "User",
            user.getId().toString(),
            "User reactivated: " + user.getName() + " (" + user.getEmail() + ")"
        );
    }
}