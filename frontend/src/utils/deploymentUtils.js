/**
 * Deployment Integration Utility
 * Handles compilation and secure deployment via the Django backend.
 */
import { API } from '../api';
import { buildPortfolioHtml } from './exportWebsiteHtml';

export async function deployAnimatedSite(portfolioData) {
    try {
        // 1. Compile the active canvas into a standalone HTML string
        const html_content = buildPortfolioHtml(portfolioData);

        if (!html_content) {
            throw new Error("Failed to generate HTML structure.");
        }

        // 2. Send the payload to the Django DeploymentView safely
        const response = await API.post('deploy/', { 
            html_content: html_content 
        });
        
        return {
            success: true,
            data: {
                projectUrl: response.data.url 
            },
            error: null
        };
    } catch (error) {
        console.error("Secure Vercel deployment error:", error);
        return {
            success: false,
            error: error.response?.data?.error || error.message,
            deploymentUrl: null
        };
    }
}