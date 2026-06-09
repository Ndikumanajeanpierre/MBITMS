package com.mbitms.controller;

import com.mbitms.entity.User;
import com.mbitms.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id,
                                            @RequestBody User updated,
                                            Authentication auth) {
        return ResponseEntity.ok(userService.updateUser(id, updated, auth.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateUser(@PathVariable Long id,
                                                Authentication auth) {
        userService.deactivateUser(id, auth.getName());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/reactivate")
    public ResponseEntity<Void> reactivateUser(@PathVariable Long id,
                                                Authentication auth) {
        userService.reactivateUser(id, auth.getName());
        return ResponseEntity.ok().build();
    }
}