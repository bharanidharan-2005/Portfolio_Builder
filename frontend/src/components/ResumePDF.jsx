import React from 'react';
import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    color: '#333333',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
    paddingBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#111111',
  },
  headline: {
    fontSize: 12,
    color: '#555555',
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 10,
    fontSize: 10,
    color: '#666666',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111111',
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingBottom: 4,
  },
  item: {
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#222222',
  },
  itemDate: {
    fontSize: 10,
    color: '#666666',
  },
  itemSubtitle: {
    fontSize: 11,
    color: '#444444',
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#555555',
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  skillBadge: {
    fontSize: 9,
    backgroundColor: '#f4f4f5',
    padding: '3 6',
    borderRadius: 4,
  }
});

export const ResumePDF = ({ sections = [] }) => {
  // Extract data from sections
  const hero = sections.find(s => s.section_type === 'hero')?.content_data || {};
  const about = sections.find(s => s.section_type === 'about')?.content_data || {};
  const education = sections.find(s => s.section_type === 'education')?.content_data || {};
  const skills = sections.find(s => s.section_type === 'skills')?.content_data || {};
  const projects = sections.find(s => s.section_type === 'projects_grid')?.content_data || {};
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{hero.heading || 'Your Name'}</Text>
          <Text style={styles.headline}>{hero.subheading || 'Professional Headline'}</Text>
          <View style={styles.contactRow}>
            {hero.email && <Text>{hero.email}</Text>}
            {hero.linkedin && <Link src={hero.linkedin}>LinkedIn</Link>}
            {hero.github && <Link src={hero.github}>GitHub</Link>}
            {hero.liveUrl && <Link src={hero.liveUrl}>Website</Link>}
          </View>
        </View>

        {/* About */}
        {about.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.itemDesc}>{about.bio}</Text>
          </View>
        )}

        {/* Experience / Projects (mapped to Projects for now as it's the primary content) */}
        {projects.projects && projects.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects & Experience</Text>
            {projects.projects.map((proj, i) => (
              <View key={i} style={styles.item}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{proj.title}</Text>
                </View>
                <Text style={styles.itemDesc}>{proj.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {education.schools && education.schools.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.schools.map((edu, i) => (
              <View key={i} style={styles.item}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{edu.institution}</Text>
                  <Text style={styles.itemDate}>{edu.years}</Text>
                </View>
                <Text style={styles.itemSubtitle}>{edu.degree} {edu.score ? `| ${edu.score}` : ''}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skills.items && skills.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skills}>
              {skills.items.map((skill, i) => (
                <Text key={i} style={styles.skillBadge}>{skill.name}</Text>
              ))}
            </View>
          </View>
        )}

      </Page>
    </Document>
  );
};
