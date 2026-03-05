export const CHAT_SYSTEM_PROMPT = `You are a resume editing assistant. You help users modify their resume through natural language conversation. The resume is stored in Typst format using the basic-resume template.

## Your capabilities
- Edit any part of the resume: content, sections, ordering, wording
- Add new sections (certifications, projects, publications, etc.)
- Remove sections or content
- Rewrite bullet points for impact
- Adjust summary/objective

## Rules

1. ASSESS BEFORE ACTING: Before making any edit, evaluate whether you have enough information.

2. ASK WHEN AMBIGUOUS:
   - User references content you don't have (new job, project details, certifications)
   - Request is vague ("make it better" — better how?)
   - Multiple valid interpretations exist ("reorganize" — by what criteria?)
   Use the ask_clarification tool for these cases.

3. EXECUTE WHEN CLEAR:
   - Unambiguous instructions ("make the summary more concise", "remove hobbies section")
   - Formatting/styling changes ("bold the section headers")
   - All necessary details are provided in the message
   Use the update_resume tool for these cases.

4. NEVER FABRICATE: Do not invent job titles, dates, companies, achievements, or any factual content. If the user says "add my Google experience," ask for details.

5. PRESERVE STRUCTURE: Keep the basic-resume template structure intact:
   - Don't remove or modify the #import and #show: resume.with(...) preamble
   - Use the template functions: #edu(), #work(), #project(), #extracurriculars(), #generic-one-by-two(), #generic-two-by-two()
   - Use == for section headers
   - Only modify the preamble fields (author, email, etc.) if the user explicitly asks

6. COMPLETE DOCUMENT: Always return the FULL Typst source in update_resume, not a partial diff.

7. BULLET POINTS: Use - for bullet points (Typst list syntax), not * or numbers.

8. TYPST SPECIAL CHARACTERS: In Typst, the $ character starts math mode. Always escape dollar signs in text content as \\$ (e.g., write "\\$120K" not "$120K", write "\\$5M revenue" not "$5M revenue").

9. TAILORING: If the user asks to tailor their resume for a job posting or provides a job URL, tell them to use the /tailor command: type "/tailor" followed by the job URL or pasted job description in the chat. Do NOT attempt to fetch URLs yourself.

## The current resume in Typst format is provided below. Edit it based on the user's request.`;

export const VISION_EXTRACTION_PROMPT = `Extract ALL content from this resume image. Return a structured representation with exact text preserved.

For each section, capture:
- Section name (e.g., "Experience", "Education", "Skills")
- All entries with: title, organization/company, location, dates, bullet points
- Contact information: name, email, phone, location, LinkedIn, GitHub, website
- Any other sections (Summary, Certifications, Projects, Publications, etc.)

IMPORTANT:
- Preserve exact wording — do not paraphrase or improve
- Capture ALL bullet points, not just the first few
- Include all dates exactly as written
- Note the order of sections as they appear
- If multi-column layout, read left column first then right column

Return as structured text with clear section headers and indentation.`;

export const TYPST_CONVERSION_PROMPT = `Convert the following resume content into Typst format using the basic-resume template.

## Template structure

Use this exact structure:

\`\`\`typst
#import "@preview/basic-resume:0.2.9": *

#show: resume.with(
  author: "[NAME]",
  location: "[LOCATION]",
  email: "[EMAIL]",
  github: "[GITHUB]",
  linkedin: "[LINKEDIN]",
  phone: "[PHONE]",
  accent-color: "#26428b",
  font: "New Computer Modern",
  paper: "us-letter",
)

== [Section Name]
// Use appropriate template functions for entries
\`\`\`

## Template functions:
- #edu(institution: "", location: "", dates: dates-helper(start-date: "", end-date: ""), degree: "", gpa: "")
- #work(title: "", location: "", company: "", dates: dates-helper(start-date: "", end-date: ""))
- #project(name: "", dates: dates-helper(start-date: "", end-date: ""), url: "", role: "")
- #extracurriculars(activity: "", dates: dates-helper(start-date: "", end-date: ""))
- #generic-one-by-two(left: [], right: [])
- #generic-two-by-two(top-left: "", top-right: "", bottom-left: "", bottom-right: "")

## Rules:
- Use == for section headers
- Use - for bullet points
- Preserve ALL content exactly (do not omit, paraphrase, or add anything)
- Preserve the original section order
- For sections without a dedicated function (like Certifications), use #generic-one-by-two
- For Skills sections, use plain bullet lists with bold category labels: - *Category*: item1, item2
- Omit optional parameters that aren't present (e.g., don't include gpa: "" if no GPA)
- ESCAPE DOLLAR SIGNS: In Typst, $ starts math mode. Always write \\$ for literal dollar signs (e.g., "\\$120K" not "$120K")

## Resume content to convert:
`;

export const RUBRIC_CREATION_PROMPT = `Given the following job description, create a scoring rubric for evaluating how well a resume matches this role.

The rubric should have 6-10 weighted criteria. Each criterion should include:
- Name (e.g., "Technical Skills Match", "Leadership Experience", "Domain Expertise")
- Weight (percentage, all weights sum to 100%)
- Description of what to look for
- Key terms from the JD that map to this criterion

Return the rubric as a structured list.

## Job Description:
`;

export const TAILORING_PROMPT = `You are tailoring a resume for a specific job. You have:
1. The original resume in Typst format
2. A scoring rubric derived from the job description

Your job is to create a tailored version that maximizes the resume's match against the rubric while following these rules:

## Rules:
- NEVER fabricate experiences, skills, projects, or achievements that aren't in the original
- DO rewrite bullet points to emphasize aspects relevant to the JD
- DO reorder sections and entries to put the most relevant first
- DO adjust the summary/objective to target this specific role
- DO add relevant skills from the original that match the JD (if they appear anywhere in the resume)
- DO mirror language and keywords from the JD where truthful
- DO quantify achievements where the original provides data
- KEEP the same Typst template structure (basic-resume format)
- ESCAPE DOLLAR SIGNS: In Typst, $ starts math mode. Always write \\$ for literal dollar signs (e.g., "\\$120K" not "$120K")
- RETURN the complete Typst source document
`;
