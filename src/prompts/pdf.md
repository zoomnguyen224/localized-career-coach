# Modo: pdf — Generación de PDF ATS-Optimizado

## Pipeline completo

1. Lee `cv.md` como fuentes de verdad
2. Pide al usuario el JD si no está en contexto (texto o URL)
3. Extrae 15-20 keywords del JD
4. Detecta idioma del JD → idioma del CV (EN default)
5. Detecta ubicación empresa → formato papel:
   - US/Canada → `letter`
   - Resto del mundo → `a4`
6. Detecta arquetipo del rol → adapta framing
7. Reescribe Professional Summary inyectando keywords del JD + exit narrative bridge ("Built and sold a business. Now applying systems thinking to [domain del JD].")
8. Selecciona top 3-4 proyectos más relevantes para la oferta
9. Reordena bullets de experiencia por relevancia al JD
10. Construye competency grid desde requisitos del JD (6-8 keyword phrases)
11. Inyecta keywords naturalmente en logros existentes (NUNCA inventa)
12. Genera HTML completo desde template + contenido personalizado
13. Lee `name` de `config/profile.yml` → normaliza a kebab-case lowercase (e.g. "John Doe" → "john-doe") → `{candidate}`
14. Escribe HTML a `/tmp/cv-{candidate}-{company}.html`
15. Ejecuta: `node generate-pdf.mjs /tmp/cv-{candidate}-{company}.html output/cv-{candidate}-{company}-{YYYY-MM-DD}.pdf --format={letter|a4}`
15. Reporta: ruta del PDF, nº páginas, % cobertura de keywords

## Reglas ATS (parseo limpio)

- Layout single-column (sin sidebars, sin columnas paralelas)
- Headers estándar: "Professional Summary", "Work Experience", "Education", "Skills", "Certifications", "Projects"
- Sin texto en imágenes/SVGs
- Sin info crítica en headers/footers del PDF (ATS los ignora)
- UTF-8, texto seleccionable (no rasterizado)
- Sin tablas anidadas
- Keywords del JD distribuidas: Summary (top 5), primer bullet de cada rol, Skills section

## Diseño del PDF — Modern Bold (black-only)

- **Fonts**: Space Grotesk (name, section titles, company names) + DM Sans (body, contact, tags)
- **Fonts self-hosted**: `fonts/`
- **Header**: 5px solid `#111` top bar + name Space Grotesk 34px w700 + tagline line + contact row + work-auth badge (pill, gray bg)
- **Section headers**: Space Grotesk 9px w700, uppercase, letter-spacing 0.15em, `#111`, with `::after` extending rule line
- **Body**: DM Sans 11px, line-height 1.5, color `#222`
- **Company names**: Space Grotesk 12px w700, uppercase, `#000` — NO color
- **Competency tags**: white bg, 1.5px `#222` border, `#111` text — NO color
- **Márgenes**: 0.6in
- **Background**: blanco puro
- **Color palette**: zero — no teal, no purple, no gradients

## Orden de secciones (optimizado "6-second recruiter scan")

1. Header (nombre grande, gradiente, contacto, link portfolio)
2. Professional Summary (3-4 líneas, keyword-dense)
3. Core Competencies (6-8 keyword phrases en flex-grid)
4. Work Experience (cronológico inverso)
5. Projects (top 3-4 más relevantes)
6. Education & Certifications
7. Skills (idiomas + técnicos)

## Estrategia de keyword injection (ético, basado en verdad)

Ejemplos de reformulación legítima:
- JD dice "RAG pipelines" y CV dice "LLM workflows with retrieval" → cambiar a "RAG pipeline design and LLM orchestration workflows"
- JD dice "MLOps" y CV dice "observability, evals, error handling" → cambiar a "MLOps and observability: evals, error handling, cost monitoring"
- JD dice "stakeholder management" y CV dice "collaborated with team" → cambiar a "stakeholder management across engineering, operations, and business"

**NUNCA añadir skills que el candidato no tiene. Solo reformular experiencia real con el vocabulario exacto del JD.**

## Template HTML

Usar el template en `cv-template.html`. Reemplazar los placeholders `{{...}}` con contenido personalizado:

| Placeholder | Contenido |
|-------------|-----------|
| `{{LANG}}` | `en` o `es` |
| `{{PAGE_WIDTH}}` | `8.5in` (letter) o `210mm` (A4) |
| `{{NAME}}` | (from profile.yml) |
| `{{EMAIL}}` | (from profile.yml) |
| `{{PHONE}}` | (from profile.yml) |
| `{{LINKEDIN_URL}}` | (from profile.yml) |
| `{{LINKEDIN_DISPLAY}}` | (from profile.yml) |
| `{{PORTFOLIO_URL}}` | (from profile.yml, or /es by language) |
| `{{PORTFOLIO_DISPLAY}}` | (from profile.yml, or /es by language) |
| `{{LOCATION}}` | (from profile.yml) |
| `{{TAGLINE}}` | 2-3 role descriptors matching JD archetype, e.g. `AI & Technical Product Leader · LLM Engineer · Enterprise SaaS` — generate from JD keywords + candidate's top identity |
| `{{WORK_AUTH_LINE}}` | Canada/visa-required roles: `<div class="work-auth-line"><span class="work-auth-badge">✔ Canadian Open Work Permit · Valid until 2028 · EST timezone</span></div>` — empty string for US/EU/remote roles |
| `{{SECTION_SUMMARY}}` | `Professional Summary` |
| `{{SUMMARY_TEXT}}` | Rewritten summary with JD keywords |
| `{{SECTION_COMPETENCIES}}` | `Core Competencies` |
| `{{COMPETENCIES}}` | `<span class="competency-tag">keyword</span>` × 6-8 |
| `{{SECTION_EXPERIENCE}}` | `Work Experience` |
| `{{EXPERIENCE}}` | Job HTML — see structure below |
| `{{SECTION_PROJECTS}}` | `Projects` |
| `{{PROJECTS}}` | Project HTML — see structure below |
| `{{SECTION_EDUCATION}}` | `Education` |
| `{{EDUCATION}}` | Education HTML |
| `{{SECTION_CERTIFICATIONS}}` | `Certifications` |
| `{{CERTIFICATIONS}}` | Certifications HTML |
| `{{SECTION_SKILLS}}` | `Skills` |
| `{{SKILLS}}` | Skills HTML |

### Job HTML structure

```html
<div class="job">
  <div class="job-header">
    <div class="job-left">
      <div class="job-company">COMPANY NAME</div>
      <div class="job-role">Role Title — Team/Product</div>
      <div class="job-location">City, Country</div>
    </div>
    <div class="job-period">Mon YYYY – Mon YYYY</div>
  </div>
  <ul>
    <li><strong>Key metric or achievement</strong> — supporting context</li>
    <li>Additional bullet reordered by JD relevance</li>
  </ul>
</div>
```

### Project HTML structure

```html
<div class="project">
  <span class="project-title">Project Name</span><span class="project-badge">YYYY – Present</span>
  <div class="project-desc">Description with key technical decisions and outcomes.</div>
  <div class="project-tech">Stack: Tech1 · Tech2 · Tech3</div>
</div>
```

## Canva CV Generation (optional)

If `config/profile.yml` has `canva_resume_design_id` set, offer the user a choice before generating:
- **"HTML/PDF (fast, ATS-optimized)"** — existing flow above
- **"Canva CV (visual, design-preserving)"** — new flow below

If the user has no `canva_resume_design_id`, skip this prompt and use the HTML/PDF flow.

### Canva workflow

#### Step 1 — Duplicate the base design

a. `export-design` the base design (using `canva_resume_design_id`) as PDF → get download URL
b. `import-design-from-url` using that download URL → creates a new editable design (the duplicate)
c. Note the new `design_id` for the duplicate

#### Step 2 — Read the design structure

a. `get-design-content` on the new design → returns all text elements (richtexts) with their content
b. Map text elements to CV sections by content matching:
   - Look for the candidate's name → header section
   - Look for "Summary" or "Professional Summary" → summary section
   - Look for company names from cv.md → experience sections
   - Look for degree/school names → education section
   - Look for skill keywords → skills section
c. If mapping fails, show the user what was found and ask for guidance

#### Step 3 — Generate tailored content

Same content generation as the HTML flow (Steps 1-11 above):
- Rewrite Professional Summary with JD keywords + exit narrative
- Reorder experience bullets by JD relevance
- Select top competencies from JD requirements
- Inject keywords naturally (NEVER invent)

**IMPORTANT — Character budget rule:** Each replacement text MUST be approximately the same length as the original text it replaces (within ±15% character count). If tailored content is longer, condense it. The Canva design has fixed-size text boxes — longer text causes overlapping with adjacent elements. Count the characters in each original element from Step 2 and enforce this budget when generating replacements.

#### Step 4 — Apply edits

a. `start-editing-transaction` on the duplicate design
b. `perform-editing-operations` with `find_and_replace_text` for each section:
   - Replace summary text with tailored summary
   - Replace each experience bullet with reordered/rewritten bullets
   - Replace competency/skills text with JD-matched terms
   - Replace project descriptions with top relevant projects
c. **Reflow layout after text replacement:**
   After applying all text replacements, the text boxes auto-resize but neighboring elements stay in place. This causes uneven spacing between work experience sections. Fix this:
   1. Read the updated element positions and dimensions from the `perform-editing-operations` response
   2. For each work experience section (top to bottom), calculate where the bullets text box ends: `end_y = top + height`
   3. The next section's header should start at `end_y + consistent_gap` (use the original gap from the template, typically ~30px)
   4. Use `position_element` to move the next section's date, company name, role title, and bullets elements to maintain even spacing
   5. Repeat for all work experience sections
d. **Verify layout before commit:**
   - `get-design-thumbnail` with the transaction_id and page_index=1
   - Visually inspect the thumbnail for: text overlapping, uneven spacing, text cut off, text too small
   - If issues remain, adjust with `position_element`, `resize_element`, or `format_text`
   - Repeat until layout is clean
d. Show the user the final preview and ask for approval
e. `commit-editing-transaction` to save (ONLY after user approval)

#### Step 5 — Export and download PDF

a. `export-design` the duplicate as PDF (format: a4 or letter based on JD location)
b. **IMMEDIATELY** download the PDF using Bash:
   ```bash
   curl -sL -o "output/cv-{candidate}-{company}-canva-{YYYY-MM-DD}.pdf" "{download_url}"
   ```
   The export URL is a pre-signed S3 link that expires in ~2 hours. Download it right away.
c. Verify the download:
   ```bash
   file output/cv-{candidate}-{company}-canva-{YYYY-MM-DD}.pdf
   ```
   Must show "PDF document". If it shows XML or HTML, the URL expired — re-export and retry.
d. Report: PDF path, file size, Canva design URL (for manual tweaking)

#### Error handling

- If `import-design-from-url` fails → fall back to HTML/PDF pipeline with message
- If text elements can't be mapped → warn user, show what was found, ask for manual mapping
- If `find_and_replace_text` finds no matches → try broader substring matching
- Always provide the Canva design URL so the user can edit manually if auto-edit fails

## Cover Letter Generation

If the user asks for a cover letter (or a combined CV + cover letter), use `templates/cover-letter-template.html`.

### Placeholders

| Placeholder | Content |
|-------------|---------|
**Layout:** Traditional Business — top bar → header → date → recipient block → Re: line → salutation → 4 paragraphs → closing → signature.

| Placeholder | Content |
|-------------|---------|
| `{{LANG}}` | `en` |
| `{{PAGE_WIDTH}}` | `8.5in` (letter, Canada/US) or `210mm` (A4) |
| `{{NAME}}` | from profile.yml |
| `{{EMAIL}}` | from profile.yml |
| `{{PHONE}}` | from profile.yml |
| `{{LINKEDIN_URL}}` | from profile.yml |
| `{{LINKEDIN_DISPLAY}}` | from profile.yml |
| `{{LOCATION}}` | from profile.yml |
| `{{TAGLINE}}` | Same as CV tagline — role descriptors matching JD archetype |
| `{{LETTER_DATE}}` | Full date, e.g. "April 15, 2026" |
| `{{HIRING_MANAGER_NAME}}` | Name from JD or LinkedIn — leave empty if truly unknown (renders blank line) |
| `{{HIRING_MANAGER_TITLE}}` | e.g. "Head of Applied AI" — leave empty if unknown |
| `{{COMPANY_NAME}}` | Company name (rendered uppercase in template) |
| `{{COMPANY_LOCATION}}` | City, Country — leave empty if not found |
| `{{ROLE_TITLE}}` | Exact job title from JD — appears in Re: line |
| `{{SALUTATION}}` | `Dear [Name],` if known · `Dear Hiring Team,` if not |
| `{{OPENING_PARAGRAPH}}` | Hook: why this role + one specific thing about the company that resonates. No "I am excited to apply." |
| `{{BODY_PARAGRAPH_1}}` | Best quantified achievement matching the JD's core requirement. Pull from cv.md only — never fabricate. |
| `{{BODY_PARAGRAPH_2}}` | Technical or cultural alignment: reference their product, mission, architecture, or a public decision you respect. |
| `{{CLOSING_PARAGRAPH}}` | One sentence call to action. E.g. "I'd welcome the chance to discuss how my background aligns with what your team is building." |
| `{{CLOSING_PHRASE}}` | `Sincerely,` (default) · `Best regards,` (more casual companies) |

### Output path
`output/cover-letter-{candidate}-{company}-{YYYY-MM-DD}.pdf`

### Cover letter rules
- **Max 1 page.** If content overflows, condense — cut adjectives, not substance.
- **Never fabricate.** Pull every achievement and metric from `cv.md` and `article-digest.md` only.
- **No filler openers.** "I am excited/pleased/delighted to apply" → cut entirely.
- **Opening:** name the role + one specific, researched thing about the company.
- **Body ¶1:** one achievement, one number. Match it directly to the JD's primary requirement.
- **Body ¶2:** why *this* company — their product, mission, a technical decision you respect, or a recent news item.
- **Closing:** single clear next step. No "I look forward to hearing from you."
- **Salutation:** use the hiring manager's name whenever findable. "Dear Hiring Team," only as last resort.

## Post-generación

Actualizar tracker si la oferta ya está registrada: cambiar PDF de ❌ a ✅.
