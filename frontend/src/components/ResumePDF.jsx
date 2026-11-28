import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';

// Use standard Helvetica which is built into react-pdf and ATS-friendly
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    color: '#000000',
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
  name: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
    color: '#000000',
  },
  headline: {
    fontSize: 11,
    color: '#333333',
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    fontSize: 9,
    color: '#555555',
  },
  link: {
    color: '#0056b3',
    textDecoration: 'none',
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: '#000000',
    marginBottom: 6,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  aboutText: {
    fontSize: 9.5,
    color: '#222222',
  },
  item: {
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },
  itemSubtitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  itemSubtitle: {
    fontSize: 9.5,
    color: '#333333',
    fontFamily: 'Helvetica-Oblique',
  },
  itemDate: {
    fontSize: 9,
    color: '#555555',
  },
  itemDesc: {
    fontSize: 9.5,
    color: '#333333',
    marginTop: 2,
  },
  techText: {
    fontSize: 8.5,
    color: '#555555',
    marginTop: 2,
    fontFamily: 'Helvetica-Oblique',
  },
  projectLinks: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
    fontSize: 8.5,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  skillText: {
    fontSize: 9.5,
    color: '#222222',
  }
});

export const ResumePDF = ({ sections = [] }) => {
  // Extract data from sections
  const hero = sections.find(s => s.section_type === 'hero')?.content_data || {};
  const about = sections.find(s => s.section_type === 'about')?.content_data || {};
  const education = sections.find(s => s.section_type === 'education')?.content_data || {};
  const skills = sections.find(s => s.section_type === 'skills')?.content_data || {};
  const projects = sections.find(s => s.section_type === 'projects_grid')?.content_data || {};
  const experience = sections.find(s => s.section_type === 'experience')?.content_data || {};
  const contact = sections.find(s => s.section_type === 'contact')?.content_data || {};
  const certifications = sections.find(s => s.section_type === 'certifications')?.content_data || {};
  const achievements = sections.find(s => s.section_type === 'achievements')?.content_data || {};

  const emailVal = hero.email || contact.email;
  const phoneVal = hero.phone || contact.phone;
  const linkedinVal = hero.linkedin || contact.linkedin;
  const githubVal = hero.github || contact.github;

  // Safely join skills
  const skillsArray = Array.isArray(skills.items) ? skills.items : [];
  const skillsList = skillsArray.filter(s => s?.name).map(s => s.name).join(' • ');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{hero.heading || 'Professional Resume'}</Text>
          {hero.subheading && <Text style={styles.headline}>{hero.subheading}</Text>}
          
          <View style={styles.contactRow}>
            {emailVal && <Text>{emailVal}</Text>}
            {phoneVal && <Text>{phoneVal}</Text>}
            {hero.location && <Text>{hero.location}</Text>}
            
            {linkedinVal && (
              <Link style={styles.link} src={linkedinVal}>
                LinkedIn
              </Link>
            )}
            {githubVal && (
              <Link style={styles.link} src={githubVal}>
                GitHub
              </Link>
            )}
            {hero.liveUrl && (
              <Link style={styles.link} src={hero.liveUrl}>
                Portfolio
              </Link>
            )}
          </View>
        </View>

        {/* Professional Summary (About) */}
        {about.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.aboutText}>{about.bio}</Text>
          </View>
        )}

        {/* Experience */}
        {experience.items && experience.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {experience.items.map((exp, i) => {
              const roleTitle = exp.title || exp.role || '';
              const companyName = exp.company || '';
              const dateRange = exp.dates || exp.duration || '';
              return (
                <View key={`exp-${i}`} style={styles.item}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{roleTitle || companyName}</Text>
                    {dateRange && <Text style={styles.itemDate}>{dateRange}</Text>}
                  </View>
                  {roleTitle && companyName && <Text style={styles.itemSubtitle}>{companyName}</Text>}
                  {exp.description && <Text style={styles.itemDesc}>{exp.description}</Text>}
                </View>
              );
            })}
          </View>
        )}

        {/* Projects */}
        {projects.projects && projects.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.projects.map((proj, i) => {
              if (!proj.title) return null; // Skip empty
              
              return (
                <View key={`proj-${i}`} style={styles.item}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{proj.title}</Text>
                  </View>
                  
                  {proj.desc && <Text style={styles.itemDesc}>{proj.desc}</Text>}
                  
                  {proj.tags && proj.tags.length > 0 && (
                    <Text style={styles.techText}>
                      Technologies: {proj.tags.join(', ')}
                    </Text>
                  )}
                  
                  <View style={styles.projectLinks}>
                    {proj.githubUrl && (
                      <Link style={styles.link} src={proj.githubUrl}>
                        GitHub
                      </Link>
                    )}
                    {proj.projectUrl && (
                      <Link style={styles.link} src={proj.projectUrl}>
                        Live Demo
                      </Link>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Education */}
        {education.schools && education.schools.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.schools.map((edu, i) => (
              <View key={`edu-${i}`} style={styles.item}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{edu.institution}</Text>
                  {(edu.years || edu.dates) && <Text style={styles.itemDate}>{edu.years || edu.dates}</Text>}
                </View>
                <View style={styles.itemSubtitleRow}>
                  {edu.degree && <Text style={styles.itemSubtitle}>{edu.degree}</Text>}
                  {edu.score && <Text style={styles.itemDate}> | {edu.score}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skillsList && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.skillText}>{skillsList}</Text>
          </View>
        )}

        {/* Certifications */}
        {certifications.items && certifications.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {certifications.items.map((cert, i) => (
              <View key={`cert-${i}`} style={styles.item}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{cert.name || cert.title}</Text>
                  {cert.date && <Text style={styles.itemDate}>{cert.date}</Text>}
                </View>
                {cert.issuer && <Text style={styles.itemSubtitle}>{cert.issuer}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Achievements */}
        {achievements.items && achievements.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achievements & Honors</Text>
            {achievements.items.map((ach, i) => (
              <View key={`ach-${i}`} style={styles.item}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{ach.title || ach.name}</Text>
                  {ach.date && <Text style={styles.itemDate}>{ach.date}</Text>}
                </View>
                {ach.issuer && <Text style={styles.itemSubtitle}>{ach.issuer}</Text>}
                {ach.description && <Text style={styles.itemDesc}>{ach.description}</Text>}
              </View>
            ))}
          </View>
        )}

      </Page>
    </Document>
  );
};
