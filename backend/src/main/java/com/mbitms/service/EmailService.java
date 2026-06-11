package com.mbitms.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            message.setFrom("noreply@mbitms.com");
            mailSender.send(message);
        } catch (Exception e) {
            System.out.println("Email sending failed: " + e.getMessage());
        }
    }

    public void sendTransferCreated(String managerEmail, String itemName,
                                     Double quantity, String fromBranch,
                                     String toBranch, String requester) {
        String subject = "MBITMS: New Transfer Request Needs Approval";
        String body = String.format(
            "Dear Manager,\n\n" +
            "A new stock transfer request has been submitted and requires your approval.\n\n" +
            "Details:\n" +
            "- Item: %s\n" +
            "- Quantity: %s\n" +
            "- From Branch: %s\n" +
            "- To Branch: %s\n" +
            "- Requested By: %s\n\n" +
            "Please login to MBITMS to review and approve or reject this request.\n\n" +
            "Best regards,\n" +
            "MBITMS System",
            itemName, quantity, fromBranch, toBranch, requester
        );
        sendEmail(managerEmail, subject, body);
    }

    public void sendTransferApproved(String requesterEmail, String itemName,
                                      Double quantity, String decision) {
        String subject = "MBITMS: Transfer Request " + decision;
        String body = String.format(
            "Dear Requester,\n\n" +
            "Your stock transfer request has been %s.\n\n" +
            "Details:\n" +
            "- Item: %s\n" +
            "- Quantity: %s\n" +
            "- Decision: %s\n\n" +
            "Please login to MBITMS for more details.\n\n" +
            "Best regards,\n" +
            "MBITMS System",
            decision.toLowerCase(), itemName, quantity, decision
        );
        sendEmail(requesterEmail, subject, body);
    }
}