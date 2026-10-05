import json
from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.views.decorators.http import require_POST
from .forms import SignupForm, ProfileForm, ContactForm
from .models import Profile, Semester, ContactMessage
from .services import clean_courses, dashboard_data, settings_data


LANDING = {
    "marquee": ["4.5 grading scale", "Relative grading", "Absolute grading", "Goal planner", "Retake simulator", "Attendance guard",
                "Honors tracking", "Scale converter", "Scholarship matching", "Career paths", "Semester history"],
    "stats": [("4.5", "Grading scale built in"), ("9", "Grade levels, A+ to F"), ("8", "Semesters tracked"), ("5", "GPA scales converted")],
    "history": [("Sem 1", "3.90"), ("Sem 2", "4.05"), ("Sem 3", "4.08"), ("Sem 4", "4.12")],
    "preview_mini": [("Attendance", 20), ("Midterm exam", 20), ("Final exam", 40), ("Class perf.", 20)],
    "scales": ["4.5", "4.0", "5.0", "100 pts", "7.0"],
    "steps": [("1", "Create your account", "Sign up for free and tell us your degree (Bachelor's or Master's) and the semester you are in right now."),
              ("2", "Add your semesters", "Enter your previous courses, credits and grades, or just the totals if you do not remember every course."),
              ("3", "Get your insights", "See your real CGPA, predict upcoming grades and find out what you need to reach your target.")],
    "features": [
        ("fa-chart-line", "emerald", "Real CGPA tracking", "Enter your semesters once and GradeWise keeps your cumulative GPA up to date on the 4.5 scale."),
        ("fa-clock-rotate-left", "cyan", "Semester history", "Add every past semester course by course, or just its credits and GPA. Edit it any time."),
        ("fa-bullseye", "indigo", "Course grade predictor", "Weighted components, what-if marks for the final exam, and relative or absolute grading."),
        ("fa-user-check", "amber", "Attendance guard", "Clear warnings when your absences get close to the limit that means an automatic F."),
        ("fa-flag-checkered", "emerald", "Goal planner", "Set a target CGPA and see the average GPA you need in your remaining credits."),
        ("fa-rotate-left", "cyan", "Retake simulator", "Test how retaking a course would change your cumulative GPA before you decide."),
        ("fa-right-left", "indigo", "GPA scale converter", "Convert between 4.5, 4.0, 5.0, 100-point and 7.0 scales in one click."),
        ("fa-crown", "amber", "Honors progress", "Track your path to Cum Laude, Magna Cum Laude and Summa Cum Laude standing."),
        ("fa-graduation-cap", "emerald", "Scholarships & careers", "See which scholarships and career paths your current CGPA unlocks."),
    ],
    "preview": [("Attendance", 20, "100"), ("Midterm exam", 20, "90"), ("Final exam", 40, "Pending"), ("Class performance & attitude", 20, "95")],
    "scale": [("A+", "4.5", "emerald"), ("A0", "4.0", "emerald"), ("B+", "3.5", "cyan"), ("B0", "3.0", "cyan"), ("C+", "2.5", "amber"),
              ("C0", "2.0", "amber"), ("D+", "1.5", "orange"), ("D0", "1.0", "orange"), ("F", "0", "red")],
    "faq": [
        ("Is GradeWise free?", "Yes. The quick calculator works without an account, and creating an account is free."),
        ("Which grading scale does it use?", "The 4.5 scale is the default (A+ = 4.5 down to F = 0). The converter also handles 4.0, 5.0, 100-point and 7.0 scales."),
        ("What if my professor grades differently?", "The Course Grade Predictor lets you edit the component weights, choose relative or absolute grading, and set your own grade cut-offs."),
        ("Do I have to remember every old course?", "No. For past semesters you can enter just the total credits and the semester GPA."),
        ("Is my data saved?", "Yes. Your semesters and current courses are saved to your account, so everything is there the next time you log in."),
        ("Are the results official?", "No. GradeWise gives estimates to help you plan. Your official grades and GPA are always decided by your university."),
    ],
}


def get_profile(user):
    return Profile.objects.get_or_create(user=user)[0]


def home(request):
    # Guests see the quick calculator; students see their dashboard (after setting up their profile)
    if not request.user.is_authenticated:
        return render(request, "core/guest.html", LANDING)
    p = get_profile(request.user)
    if not p.onboarded:
        return redirect("settings")
    return render(request, "core/dashboard.html", {"gm_data": dashboard_data(request.user, p), "profile": p})


def signup(request):
    if request.user.is_authenticated:
        return redirect("home")
    form = SignupForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = form.save()
        login(request, user)
        messages.success(request, f"Welcome to GradeWise, {user.username}! Let's set up your academic profile.")
        return redirect("settings")
    return render(request, "core/signup.html", {"form": form})


@login_required
def settings_view(request):
    p = get_profile(request.user)
    initial = {"degree": p.degree, "current_semester": p.current_semester, "start_term": p.start_term,
               "start_year": p.start_year, "required_credits": p.required_credits, "target_cgpa": p.target_cgpa}
    form = ProfileForm(request.POST or None, initial=initial)
    if request.method == "POST" and form.is_valid():
        d = form.cleaned_data
        with transaction.atomic():
            p.degree, p.current_semester, p.start_term = d["degree"], d["current_semester"], d["start_term"]
            p.start_year, p.required_credits, p.target_cgpa = d["start_year"], d["required_credits"], d["target_cgpa"]
            was_onboarded, p.onboarded = p.onboarded, True
            p.save()
            for h in d["history_parsed"]:
                Semester.objects.update_or_create(user=request.user, number=h["n"], defaults={
                    "courses": h["courses"], "summary_credits": h["summary_credits"], "summary_gpa": h["summary_gpa"]})
            request.user.semesters.filter(number__gt=p.current_semester).delete()
            Semester.objects.get_or_create(user=request.user, number=p.current_semester)
        messages.success(request, "Settings saved." if was_onboarded else "Your profile is ready. Welcome to your dashboard!")
        return redirect("home")
    sdata, init = settings_data(request.user, p), {"degree": p.degree, "current": p.current_semester}
    if form.is_bound:  # validation failed: keep what the user typed
        try:
            sdata["history"] = json.loads(form.data.get("history") or "[]")
            init = {"degree": form.data.get("degree", p.degree), "current": int(form.data.get("current_semester") or 1)}
        except (ValueError, TypeError):
            pass
    return render(request, "core/settings.html", {"form": form, "onboarding": not p.onboarded, "sdata": sdata, "init": init})


@login_required
@require_POST
def save_courses(request):
    p = get_profile(request.user)
    try:
        courses = clean_courses(json.loads(request.body or "{}").get("courses", []))
    except (ValueError, TypeError) as e:
        return JsonResponse({"ok": False, "error": str(e)}, status=400)
    Semester.objects.update_or_create(user=request.user, number=p.current_semester,
                                      defaults={"courses": courses, "summary_credits": None, "summary_gpa": None})
    return JsonResponse({"ok": True})


def about(request):
    return render(request, "core/about.html", {
        "pillars": [
            ("fa-chart-line", "emerald", "Track", "See your cumulative GPA across every semester, always up to date on the 4.5 scale."),
            ("fa-bullseye", "cyan", "Predict", "Estimate your course grades before results are published, using weights, attendance and class ranking."),
            ("fa-flag-checkered", "indigo", "Plan", "Set a target CGPA and see exactly what you need to reach it, including retake scenarios."),
        ],
        "values": [
            ("01", "Accuracy first", "Every number comes from clear formulas you can verify, on the grading scale your university really uses."),
            ("02", "Your rules, your numbers", "Weights, cut-offs and grading methods are editable, because every course and professor is different."),
            ("03", "Clear and honest", "We show estimates as estimates, and warn you when something looks wrong instead of hiding it."),
        ],
    })


def contact(request):
    initial = {}
    if request.user.is_authenticated:
        initial = {"name": request.user.get_full_name() or request.user.username, "email": request.user.email}
    form = ContactForm(request.POST or None, initial=initial)
    if request.method == "POST" and form.is_valid():
        d = form.cleaned_data
        if not d["website"]:  # honeypot field must stay empty
            ContactMessage.objects.create(user=request.user if request.user.is_authenticated else None,
                                          name=d["name"], email=d["email"], topic=d["topic"], message=d["message"])
        messages.success(request, "Thanks for reaching out! Your message has been sent and we will get back to you by email.")
        return redirect("contact")
    topics = [
        ("fa-circle-question", "emerald", "General questions", "How GradeWise works or how a result is calculated."),
        ("fa-bug", "amber", "Report a problem", "Something looks wrong? Tell us what you saw and we will fix it."),
        ("fa-lightbulb", "cyan", "Feature requests", "Ideas that would make GradeWise better for your university."),
    ]
    return render(request, "core/contact.html", {"form": form, "topics": topics})
