# GradeWise (Django)
    pip install -r requirements.txt
    python manage.py migrate
    python manage.py runserver
Open http://127.0.0.1:8000/

## Student profile & onboarding
- After signup students are sent to **/settings/** to choose Bachelor's (8 semesters) or Master's (4 semesters), their current semester, start term/year, required credits and target CGPA.
- For semester 2 and above they enter every previous semester (course by course, or "Totals only" with credits + GPA). Data is stored in the database (`Profile`, `Semester` models).
- The dashboard builds the cumulative GPA from that history plus the current semester's courses, all on the **4.5 scale** (A+ 4.5, A0 4.0, B+ 3.5, B0 3.0, C+ 2.5, C0 2.0, D+ 1.5, D0 1.0, F 0).
- Extra tools: Goal Planner (GPA needed for your target CGPA), Retake Simulator, Semester History.
- After pulling this update run `python manage.py migrate`.

## Branding, landing page & company pages
- The product is now called **GradeWise** (logo: `core/static/core/img/logo.svg`, also used as the favicon).
- Public landing page (guests): hero, live calculator, features, how it works, predictor spotlight, 4.5 grade scale, FAQ.
- `/about/` and `/contact/` are linked from the footer on every page. Contact messages are stored in the database; read them in the admin (`/admin/`, create an admin with `python manage.py createsuperuser`).
- After updating run `python manage.py migrate`.

## Design system (v2)
- New indigo-violet-fuchsia brand with a **light theme (default)** and a **dark theme**; the toggle (sun/moon) is in every header and is remembered per browser.
- All colours are CSS variables defined in `core/static/core/css/style.css`; `core/static/core/js/tw-config.js` maps them into Tailwind, so every page (including the dashboard) switches theme together.
- Change the brand colour by editing `--brand`, `--brand-text` and the gradients in `style.css`.
