Act as a Senior Frontend Developer specializing in clean, semantic UI for Academic Institutions. Your goal is to create a **University Faculty & Student Portal** prototype using React and Tailwind CSS.

**Design Aesthetic:**
* **Style:** Professional, trustworthy, and 'Crisp'. Use 'Inter' or 'Playfair Display' from Google Fonts.
* **Palette:** Subtle and professional. Use Navy Blue (#1e3a8a) or Deep Slate (#334155) for accents, with lots of white space and light gray backgrounds (#f8fafc).
* **Vibe:** Modern academic (think Stanford or MIT portal style).

**Key Sections to Build:**

**1. Navigation Header:**
* Clean logo placeholder and a simple menu (Calendar, Directory, Resources).

**2. Academic Calendar (Section 1):**
* A 'Timeline' or 'Grid' view showing upcoming key dates (Exams, Holidays, Registration).
* Data should be mapped from a JSON-like object for easy future integration.

**3. Faculty Directory (Section 2):**
* A searchable grid of 'Faculty Cards'.
* Each card includes: Photo placeholder, Name, Title, Department, and a 'Contact' button.
* Implement a simple search filter (by name or department) using React state.

**4. Student Resources & Announcements (Section 3):**
* A 'Masonry' or 'Bento Box' style layout for announcements.
* Categories: 'Campus News', 'Academic Alerts', 'Student Life'.
* Use clean icons (Lucide-React) for different resource types (PDFs, Links, Portals).

**Technical Constraints for the Prompt:**
* Use **Tailwind CSS** for styling (to easily translate to clean CSS later).
* Ensure **HTML5 Semantic tags** (`<section>`, `<article>`, `<header>`, `<nav>`).
* Add **ARIA labels** for accessibility (the client specifically asked for this).
* Keep the code extremely modular, as if each part will be converted to a standalone HTML/JS block.

Create a single page in AcademicPage.tsx

The final result should look like a premium, lightweight academic portal.