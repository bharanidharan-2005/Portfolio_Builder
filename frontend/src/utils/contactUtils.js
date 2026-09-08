/**
 * Contact Form Utility
 * Securely routes portfolio contact form submissions through the Django backend API.
 * 
 * Usage: import { sendContactForm, previewEmailContent } from '@/utils/contactUtils'
 */
import { API } from '../api';

export async function sendContactForm(formData) {
    // Basic frontend validation before hitting the server
    if (!formData.name || !formData.email || !formData.message) {
        return { success: false, error: "Name, email, and message are required." };
    }

    try {
        // Sends data to Django backend ContactMessageView
        const response = await API.post('contact-message/', {
            name: formData.name,
            email: formData.email,
            message: formData.message,
        });
        
        return { success: true, data: response.data };
    } catch (error) {
        console.error("Contact form submission error:", error);
        return { 
            success: false, 
            error: error.response?.data?.error || "Failed to send message. Please try again." 
        };
    }
}

export async function previewEmailContent(formData) {
    return {
        subject: formData.subject || "Portfolio Contact Inquiry",
        preview: `
From: ${formData.name || "Visitor"} (${formData.email})

Message:
${formData.message}
        `.trim(),
    };
}