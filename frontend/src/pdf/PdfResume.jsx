import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

// Premium, clean ATS-friendly resume layout.
// Uses a single text column, optimal line-heights, and clear hierarchical 
// spacing — perfect for automated parsers but beautiful for human readers.
const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 10,
        lineHeight: 1.5,
        padding: 40,
        backgroundColor: '#ffffff',
        color: '#334155', // slate-700
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0', // slate-200
        paddingBottom: 12,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a', // slate-900
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    headline: {
        fontSize: 12,
        color: '#2563eb', // blue-600 (subtle brand accent)
        marginBottom: 8,
        fontWeight: 'medium',
    },
    contactRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        fontSize: 9,
        color: '#64748b', // slate-500
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0f172a', // slate-900
        textTransform: 'uppercase',
        letterSpacing: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9', // slate-100
        paddingBottom: 4,
        marginBottom: 8,
    },
    body: {
        fontSize: 10,
        color: '#334155',
        lineHeight: 1.6,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    bulletDot: {
        width: 10,
        fontSize: 10,
        color: '#94a3b8', // slate-400
        lineHeight: 1.6,
    },
    bulletText: {
        flex: 1,
        fontSize: 10,
        color: '#334155',
        lineHeight: 1.6,
    }
});

// Collapse a section's content into plain bullet strings an ATS parser can read.
const sectionToLines = (section) => {
    const d = section.content_data || {};
    switch ((section.section_type || '').toLowerCase().trim()) {
        case 'hero':
            return [d.heading, d.subheading].filter(Boolean);
        case 'about':
            return [d.bio].filter(Boolean);
        case 'education':
            return (d.schools || []).map(
                (s) => [s.institution, s.degree, s.years, s.score && `Score: ${s.score}`].filter(Boolean).join(' | '),
            );
        case 'skills':
            return (d.items || []).map((s) => `${s.name || ''} — ${s.level || 50}%`);
        case 'projects_grid':
            return (d.projects || []).map(
                (p) => [p.title, p.desc, p.projectUrl].filter(Boolean).join(' — '),
            );
        case 'contact':
            return [d.text, d.email, d.phone, d.linkedin, d.github].filter(Boolean);
        default:
            return [];
    }
};

const SECTION_TITLES = {
    hero: 'Profile',
    about: 'Professional Summary',
    education: 'Education',
    skills: 'Technical Skills',
    projects_grid: 'Selected Projects',
    contact: 'Contact Information',
};

export default function PdfResume({ pages, activePage, userData }) {
    const active = pages.find((p) => p.name === activePage) || pages[0];
    const sections = active ? .sections || [];

    const hero = sections.find((s) => (s.section_type || '').toLowerCase() === 'hero');
    const contact = sections.find((s) => (s.section_type || '').toLowerCase() === 'contact');

    const heroData = hero ? .content_data || {};
    const contactData = contact ? .content_data || {};

    const contactItems = [
        contactData.email,
        contactData.phone,
        contactData.linkedin,
        contactData.github,
    ].filter(Boolean).join('   •   ');

    return ( <
            Document >
            <
            Page size = "A4"
            style = { styles.page } >

            { /* Header Section */ } <
            View style = { styles.header } >
            <
            Text style = { styles.name } > { userData.name || heroData.heading || 'Your Name' } < /Text> {
                heroData.subheading && < Text style = { styles.headline } > { heroData.subheading } < /Text>} {
                    contactItems && < Text style = { styles.contactRow } > { contactItems } < /Text>} <
                        /View>

                    { /* Dynamic Content Sections */ } {
                        sections.map((section) => {
                            const type = (section.section_type || '').toLowerCase().trim();
                            // Skip hero and contact as they are merged into the header
                            if (type === 'hero' || type === 'contact') return null;

                            const title = SECTION_TITLES[type] || type;
                            const lines = sectionToLines(section);

                            if (lines.length === 0) return null;

                            return ( <
                                View key = { section.id }
                                style = { styles.section } >
                                <
                                Text style = { styles.sectionTitle } > { title } < /Text> {
                                    lines.map((line, i) => ( <
                                        View key = { i }
                                        style = { styles.bulletRow } >
                                        <
                                        Text style = { styles.bulletDot } > • < /Text> <
                                        Text style = { styles.bulletText } > { line } < /Text> <
                                        /View>
                                    ))
                                } <
                                /View>
                            );
                        })
                    } <
                    /Page> <
                    /Document>
                );
            }