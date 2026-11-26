import io
import logging

import pdfplumber
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import AISessionLog, PortfolioPage, PortfolioSection
from ..serializers import PortfolioSectionSerializer
from .ai import (
    AICreditThrottle,
    AIKeyMissingError,
    extract_clean_json_payload,
    generate_text_with_fallback,
)
from .utils import (
    MAX_RESUME_BYTES,
    ensure_user_workspace,
    get_or_create_user_portfolio,
)

logger = logging.getLogger(__name__)

ALLOWED_RESUME_EXTENSIONS = ('.pdf', '.docx', '.doc', '.txt', '.md')


class ResumeUploadAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AICreditThrottle]

    @staticmethod
    def _validate_file_signature(file_name, content):
        name = (file_name or '').lower()
        if not name.endswith(ALLOWED_RESUME_EXTENSIONS):
            return 'Unsupported file type. Please upload a PDF, DOCX, TXT, or MD resume.'
        if not content:
            return 'Uploaded file is empty.'
        if name.endswith('.pdf') and not content.startswith(b'%PDF'):
            return 'Invalid PDF file signature.'
        if name.endswith('.docx') and not content.startswith(b'PK'):
            return 'Invalid DOCX archive signature.'
        return None

    @staticmethod
    def _extract_resume_text(file_name, content):
        name = (file_name or '').lower()
        if name.endswith('.pdf'):
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                return "\n".join((page.extract_text() or "") for page in pdf.pages).strip()
        if name.endswith(('.docx', '.doc')):
            import docx
            document = docx.Document(io.BytesIO(content))
            parts = [p.text for p in document.paragraphs if p.text.strip()]
            for table in document.tables:
                for row in table.rows:
                    row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                    if row_text:
                        parts.append(row_text)
            return "\n".join(parts).strip()
        if name.endswith(('.txt', '.md')):
            return content.decode('utf-8', errors='ignore').strip()
        return None

    def post(self, request):
        uploaded = request.FILES.get('resume')
        if not uploaded:
            return Response({'error': 'No resume file provided.'}, status=status.HTTP_400_BAD_REQUEST)
        if uploaded.size > MAX_RESUME_BYTES:
            return Response({'error': 'Resume file is too large (max 5 MB).'}, status=status.HTTP_400_BAD_REQUEST)

        content = uploaded.read()
        sig_error = self._validate_file_signature(uploaded.name, content)
        if sig_error:
            return Response({'error': sig_error}, status=status.HTTP_400_BAD_REQUEST)

        try:
            text = self._extract_resume_text(uploaded.name, content)
        except Exception as e:
            logger.error("Resume file parse error: %s", e)
            return Response(
                {'error': f'Could not read this resume file: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not text:
            return Response(
                {'error': 'No readable text found in the resume. Please upload a text-based PDF or DOCX.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Truncate overly long resumes safely before LLM call
        resume_excerpt = text[:16000]

        try:
            prompt = (
                "You are an expert resume analyzer. Extract and structure the following resume text into a strictly valid RFC 8259 JSON object.\n"
                "Return ONLY a JSON object with NO markdown codeblock markers, explanations, or commentary.\n"
                "Keys must include:\n"
                "- name: string (Candidate's full name)\n"
                "- headline: string (Professional title)\n"
                "- about: string (Professional summary or objective)\n"
                "- email: string\n"
                "- phone: string\n"
                "- location: string\n"
                "- linkedin: string (Full URL starting with https://)\n"
                "- github: string (Full URL starting with https://)\n"
                "- website: string (Full URL starting with https://)\n"
                "- projects: array of {title, desc, tags, projectUrl, githubUrl}\n"
                "  CRITICAL RULE FOR PROJECT URLS: If a link points to GitHub or Git (e.g. github.com/user/repo), assign it to 'githubUrl'. Only assign deployed live URLs to 'projectUrl'.\n"
                "  CRITICAL RULE FOR PROJECTS: Extract ALL personal/academic/software projects into 'projects'. DO NOT put projects into 'experience'.\n"
                "- experience: array of {title, company, dates, description}\n"
                "  CRITICAL RULE FOR EXPERIENCE: Only extract ACTUAL employment, corporate jobs, or company internships. NEVER place software projects into 'experience'.\n"
                "- education: array of {institution, degree, years, score}\n"
                "- skills: array of {name, level} where level is an integer 0-100\n"
                "- certifications: array of {name, issuer, date}\n"
                "- achievements: array of {title, issuer, date, description}\n"
                "- publications: array of {title, publisher, date, link}\n\n"
                "Resume Content:\n" + resume_excerpt
            )

            res = generate_text_with_fallback(None, prompt)
            parsed = extract_clean_json_payload(res.text)

            if not isinstance(parsed, dict):
                raise ValueError("AI response was not a JSON object.")

            extracted_projects = parsed.get('projects') or []
            extracted_experience = parsed.get('experience') or []

            PROJECT_INDICATORS = [
                'assistant', 'builder', 'portal', 'shortlister', 'app', 'application', 'system',
                'platform', 'rag', 'intelligence', 'analyzer', 'dashboard', 'tool', 'bot', 'website',
                'clone', 'tracker', 'detector', 'generator', 'engine', 'classifier', 'etl', 'shortlist',
                'portfolio'
            ]

            cleaned_experience = []
            migrated_projects = []

            for exp in extracted_experience:
                if not isinstance(exp, dict):
                    continue
                title = str(exp.get('title', '')).strip()
                company = str(exp.get('company', '')).strip()
                company_lower = company.lower()
                desc = str(exp.get('description', '') or exp.get('desc', '')).strip()
                title_lower = title.lower()

                is_project = False
                if not company or company_lower in ['', 'company', 'n/a', 'none', 'self', 'personal', 'academic', 'project', 'freelance']:
                    is_project = True
                elif any(ind in title_lower for ind in PROJECT_INDICATORS):
                    is_project = True

                if is_project:
                    tags = exp.get('tags') or []
                    if not tags:
                        common_tech = [
                            'Python', 'React', 'React.js', 'Node.js', 'Django', 'Flask', 'SQL',
                            'PostgreSQL', 'SQLite', 'Docker', 'Vercel', 'Render', 'Pandas', 'FAISS',
                            'LLM', 'AI', 'JavaScript', 'HTML5', 'CSS3', 'REST API', 'ETL', 'RAG',
                        ]
                        tags = [tech for tech in common_tech if tech.lower() in (desc.lower() + " " + title_lower)]

                    cand_url = exp.get('projectUrl') or exp.get('url') or ''
                    gh_url = exp.get('githubUrl') or ''
                    if ('github.com' in cand_url.lower() or 'gitlab.com' in cand_url.lower() or cand_url.lower().endswith('.git')) and not gh_url:
                        gh_url = cand_url
                        cand_url = ''

                    migrated_projects.append({
                        'title': title,
                        'desc': desc or title,
                        'tags': tags,
                        'projectUrl': cand_url,
                        'githubUrl': gh_url
                    })
                else:
                    cleaned_experience.append(exp)

            combined_projects = [p for p in extracted_projects if isinstance(p, dict)]
            existing_titles = {str(p.get('title', '')).lower() for p in combined_projects}
            for mp in migrated_projects:
                if mp['title'].lower() not in existing_titles:
                    combined_projects.append(mp)
                    existing_titles.add(mp['title'].lower())

            for p in combined_projects:
                p_url = p.get('projectUrl') or p.get('url') or p.get('demo_link') or ''
                gh_url = p.get('githubUrl') or p.get('github_url') or p.get('repo_url') or ''
                if ('github.com' in p_url.lower() or 'gitlab.com' in p_url.lower() or p_url.lower().endswith('.git')) and not gh_url:
                    gh_url = p_url
                    p_url = ''
                p['projectUrl'] = p_url
                p['githubUrl'] = gh_url

            parsed['projects'] = combined_projects
            parsed['experience'] = cleaned_experience
        except AIKeyMissingError as e:
            logger.error("AI key missing during resume parse: %s", e)
            return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            error_message = str(e)
            logger.error("Resume AI parse failed: %s", error_message)

            if "503" in error_message or "UNAVAILABLE" in error_message:
                return Response({
                    "success": False,
                    "error": "The AI model is currently experiencing high traffic. Please wait 30 seconds and try again."
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

            return Response({'error': 'AI resume parsing failed. Please try again.'}, status=status.HTTP_502_BAD_GATEWAY)

        skill_items = []
        for s in (parsed.get('skills') or []):
            if isinstance(s, dict):
                try:
                    level = max(0, min(100, int(s.get('level', 50))))
                except (TypeError, ValueError):
                    level = 50
                skill_items.append({'name': str(s.get('name', '')).strip(), 'level': level})
            elif str(s).strip():
                skill_items.append({'name': str(s).strip(), 'level': 65})

        SECTION_ORDER_WEIGHTS = {
            'hero': 10,
            'about': 20,
            'experience': 30,
            'education': 40,
            'skills': 50,
            'projects_grid': 60,
            'services': 70,
            'certifications': 80,
            'achievements': 85,
            'testimonials': 90,
            'stats': 100,
            'blog': 110,
            'contact': 120,
        }

        mapping = {
            'hero': {
                'heading': parsed.get('name') or '',
                'subheading': parsed.get('headline') or '',
                'liveUrl': parsed.get('website') or '',
                'linkedin': parsed.get('linkedin') or '',
                'github': parsed.get('github') or '',
            },
            'about': {'bio': parsed.get('about') or ''},
            'experience': {'items': parsed.get('experience') or []},
            'education': {'schools': parsed.get('education') or []},
            'skills': {'items': skill_items},
            'projects_grid': {
                'title': parsed.get('projects_title', 'Showcase of Innovations'),
                'projects': parsed.get('projects') or [],
            },
            'certifications': {'items': parsed.get('certifications') or []},
            'achievements': {'items': parsed.get('achievements') or []},
            'blog': {'articles': parsed.get('publications') or []},
            'contact': {
                'text': "Let's connect — reach me via email or any of my channels below.",
                'email': parsed.get('email') or '',
                'phone': parsed.get('phone') or '',
                'linkedin': parsed.get('linkedin') or '',
                'github': parsed.get('github') or '',
            },
        }

        word_count = len(text.split())
        preview_only = str(request.data.get('preview_only', 'false')).lower() in ('1', 'true', 'yes')

        if preview_only:
            proposed_sections = []
            for stype, cdata in mapping.items():
                if stype in ('experience', 'certifications', 'achievements', 'blog') and not (cdata.get('items') or cdata.get('articles')):
                    continue
                proposed_sections.append({
                    'id': f"resume-{stype}",
                    'section_type': stype,
                    'order': SECTION_ORDER_WEIGHTS.get(stype, 100),
                    'content_data': cdata,
                })
            log = AISessionLog.objects.create(
                user=request.user,
                change_type='Parse',
                description=f"Parsed resume '{uploaded.name}' ({word_count} words) for review.",
                status='preview',
            )
            return Response({
                'success': True,
                'message': 'Parsed successfully (ready for review)',
                'wordCount': f"{word_count} words",
                'data': parsed,
                'sections': proposed_sections,
                'log': log.to_frontend_dict(),
            })

        try:
            portfolio = get_or_create_user_portfolio(request)
            page_name = request.data.get('page')
            page = None
            if page_name:
                page = PortfolioPage.objects.filter(portfolio=portfolio, name=page_name).first()
            page = page or ensure_user_workspace(request)
            sections = {s.section_type: s for s in page.sections.all()}

            for stype, cdata in mapping.items():
                order_val = SECTION_ORDER_WEIGHTS.get(stype, 100)
                if stype in sections:
                    existing = dict(sections[stype].content_data or {})
                    existing.update({k: v for k, v in cdata.items() if v is not None})
                    sections[stype].content_data = existing
                    sections[stype].order = order_val
                    sections[stype].save()
                elif cdata and (stype not in ['experience', 'certifications', 'achievements', 'blog'] or cdata.get('items') or cdata.get('articles')):
                    sections[stype] = PortfolioSection.objects.create(
                        page=page, section_type=stype, order=order_val, content_data=cdata
                    )

            log = AISessionLog.objects.create(
                user=request.user,
                change_type='Parse',
                description=f"Parsed resume '{uploaded.name}': Structured {word_count} words into canvas sections.",
                status='applied',
            )

        except Exception as e:
            logger.error("Resume persist failed: %s", e)
            return Response(
                {'error': 'Resume parsed, but failed to save to workspace.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({
            'success': True,
            'message': 'Parsed successfully',
            'wordCount': f"{word_count} words",
            'data': parsed,
            'sections': PortfolioSectionSerializer(page.sections.all(), many=True).data if page else [],
            'log': log.to_frontend_dict()
        })
