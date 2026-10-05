import json
from .models import GRADES


def clean_course(c):
    if not isinstance(c, dict):
        raise ValueError("Invalid course entry.")
    try:
        credits = float(c.get("credits"))
    except (TypeError, ValueError):
        raise ValueError("Every course needs a numeric credit value.")
    if not 0.5 <= credits <= 12:
        raise ValueError("Course credits must be between 0.5 and 12.")
    grade = c.get("grade")
    if grade not in GRADES:
        raise ValueError("Invalid grade selected.")
    name = str(c.get("name") or "").strip()[:80] or "Course"
    return {"name": name, "credits": credits, "grade": grade}


def clean_courses(raw):
    if not isinstance(raw, list):
        raise ValueError("Invalid course list.")
    return [clean_course(c) for c in raw]


def parse_history(raw, current):
    """Validate the previous-semester data sent by the settings form."""
    try:
        data = json.loads(raw or "[]")
    except json.JSONDecodeError:
        raise ValueError("Could not read your semester history. Please try again.")
    if not isinstance(data, list):
        raise ValueError("Invalid semester history.")
    by_n = {}
    for item in data:
        if isinstance(item, dict) and isinstance(item.get("n"), int):
            by_n[item["n"]] = item
    out = []
    for n in range(1, current):
        it = by_n.get(n)
        if not it:
            raise ValueError(f"Please fill in Semester {n}.")
        if it.get("mode") == "totals":
            try:
                cr, gpa = float(it.get("credits")), float(it.get("gpa"))
            except (TypeError, ValueError):
                raise ValueError(f"Semester {n}: enter both total credits and GPA.")
            if not 1 <= cr <= 40:
                raise ValueError(f"Semester {n}: total credits must be between 1 and 40.")
            if not 0 <= gpa <= 4.5:
                raise ValueError(f"Semester {n}: GPA must be between 0 and 4.5.")
            out.append({"n": n, "courses": [], "summary_credits": cr, "summary_gpa": gpa})
        else:
            try:
                courses = clean_courses(it.get("courses"))
            except ValueError as e:
                raise ValueError(f"Semester {n}: {e}")
            if not courses:
                raise ValueError(f"Semester {n}: add at least one course.")
            out.append({"n": n, "courses": courses, "summary_credits": None, "summary_gpa": None})
    return out


def dashboard_data(user, p):
    sems = {s.number: s for s in user.semesters.all()}
    history = []
    for n in range(1, p.current_semester):
        s = sems.get(n)
        if not s:
            continue
        cr, pts = s.totals()
        history.append({"n": n, "label": p.label(n), "credits": cr, "points": pts,
                        "gpa": pts / cr if cr else 0, "courses": s.courses if s.summary_credits is None else []})
    cur = sems.get(p.current_semester)
    return {
        "username": user.username, "degree": p.degree, "current": p.current_semester,
        "maxSem": p.max_semesters, "labels": [p.label(n) for n in range(1, p.max_semesters + 1)],
        "required": p.required_credits, "target": p.target_cgpa,
        "history": history, "courses": cur.courses if cur else [],
    }


def settings_data(user, p):
    sems = {s.number: s for s in user.semesters.all()}
    hist = []
    for n, s in sems.items():
        if n >= p.current_semester:
            continue
        if s.summary_credits is not None:
            hist.append({"n": n, "mode": "totals", "credits": s.summary_credits, "gpa": s.summary_gpa, "courses": []})
        else:
            hist.append({"n": n, "mode": "courses", "courses": s.courses})
    return {"grades": list(GRADES), "history": hist}
