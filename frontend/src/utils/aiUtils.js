/**
 * AI Content & Resume Utility
 * Connects workspace AI triggers and file parsing directly to Django REST endpoints.
 */
import { API } from '../api';

/**
 * Sends a section refinement prompt to the backend AI engine.
 */
export async function refineSectionWithAI({ sectionId, sectionType, currentContent, prompt, page }) {
    try {
        const response = await API.post('ai-refine/', {
            section_id: sectionId,
            section_type: sectionType,
            current_content: currentContent,
            prompt,
            page,
        });
        return response.data;
    } catch (error) {
        console.error('AI refinement error:', error);
        throw error.response?.data || { error: 'Failed to connect to AI refinement service.' };
    }
}

/**
 * Generates an AI template and theme structure based on user industry/prompt.
 */
export async function generateAITemplate(prompt, category = '') {
    try {
        const response = await API.post('ai-generate-template/', {
            prompt,
            category,
        });
        return response.data;
    } catch (error) {
        console.error('Template generation error:', error);
        throw error.response?.data || { error: 'Failed to generate template.' };
    }
}

/**
 * Triggers backend Imagen/Gemini model to generate custom section background graphics.
 */
export async function generateAIImage(prompt) {
    try {
        const response = await API.post('generate-image/', { prompt });
        return response.data; // Returns { success: true, image_url: '...' }
    } catch (error) {
        console.error('Image generation error:', error);
        throw error.response?.data || { error: 'Image generation request failed.' };
    }
}

/**
 * Uploads a resume file (.pdf, .docx, .txt) and parses extracted data into structured sections.
 * Pass previewOnly=true so user can inspect and edit extracted fields before saving.
 */
export async function uploadAndParseResume(file, pageName = 'Home', { previewOnly = true, portfolioId = null } = {}) {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('page', pageName);
    if (previewOnly) {
        formData.append('preview_only', 'true');
    }
    if (portfolioId) {
        formData.append('portfolio_id', String(portfolioId));
    }

    try {
        const response = await API.post('upload-resume/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 70000,
        });
        return response.data;
    } catch (error) {
        console.error('Resume upload error:', error);
        throw error.response?.data || { error: 'Resume parsing failed.' };
    }
}

/**
 * Invokes structured AI Assistant actions (summary, project desc, skills, JD match, quality check, outreach pitch).
 */
export async function runAIAssistantAction(action, payload = {}, sections = []) {
    try {
        const response = await API.post('ai-assistant-action/', {
            action,
            sections,
            payload,
        });
        return response.data;
    } catch (error) {
        console.error(`AI assistant action '${action}' failed:`, error);
        throw error.response?.data || { error: 'AI service request failed.' };
    }
}