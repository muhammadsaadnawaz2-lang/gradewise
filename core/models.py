from django.contrib.auth.models import User
from django.db import models

# University grading scale (4.5)
GRADES = {"A+": 4.5, "A0": 4.0, "B+": 3.5, "B0": 3.0, "C+": 2.5, "C0": 2.0, "D+": 1.5, "D0": 1.0, "F": 0.0}
DEGREE_MAX = {"bachelor": 8, "master": 4}


def term_label(n, start_term, start_year):
    """Label for semester n, e.g. 'Fall 2025'. Falls back to 'Semester n'."""
    if not start_year:
        return f"Semester {n}"
    i = n - 1
    if start_term == "spring":
        term, year = ("Spring" if i % 2 == 0 else "Fall"), start_year + i // 2
    else:
        term, year = ("Fall" if i % 2 == 0 else "Spring"), start_year + (i + 1) // 2
    return f"{term} {year}"


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    degree = models.CharField(max_length=10, choices=[("bachelor", "Bachelor's"), ("master", "Master's")], default="bachelor")
    current_semester = models.PositiveSmallIntegerField(default=1)
    start_term = models.CharField(max_length=6, choices=[("spring", "Spring"), ("fall", "Fall")], default="spring")
    start_year = models.PositiveSmallIntegerField(null=True, blank=True)
    required_credits = models.PositiveSmallIntegerField(default=120)
    target_cgpa = models.FloatField(default=4.3)
    onboarded = models.BooleanField(default=False)

    @property
    def max_semesters(self):
        return DEGREE_MAX[self.degree]

    def label(self, n):
        return term_label(n, self.start_term, self.start_year)

    def __str__(self):
        return f"{self.user.username} ({self.degree}, semester {self.current_semester})"


class Semester(models.Model):
    """One semester of a student. Either a list of courses, or just credits + GPA totals."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="semesters")
    number = models.PositiveSmallIntegerField()
    courses = models.JSONField(default=list, blank=True)  # [{name, credits, grade}]
    summary_credits = models.FloatField(null=True, blank=True)
    summary_gpa = models.FloatField(null=True, blank=True)

    class Meta:
        unique_together = ("user", "number")
        ordering = ["number"]

    def totals(self):
        if self.summary_credits is not None and self.summary_gpa is not None:
            return self.summary_credits, self.summary_gpa * self.summary_credits
        cr = sum(c["credits"] for c in self.courses)
        return cr, sum(GRADES[c["grade"]] * c["credits"] for c in self.courses)


class ContactMessage(models.Model):
    TOPICS = [("general", "General question"), ("bug", "Report a problem"), ("feature", "Feature request"), ("other", "Something else")]
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="contact_messages")
    name = models.CharField(max_length=80)
    email = models.EmailField()
    topic = models.CharField(max_length=10, choices=TOPICS, default="general")
    message = models.TextField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - {self.get_topic_display()} ({self.created_at:%Y-%m-%d})"
