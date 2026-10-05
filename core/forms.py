from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User
from .models import DEGREE_MAX
from .services import parse_history

INPUT = "w-full glass-input rounded-xl px-4 py-3 text-sm font-semibold"


class SignupForm(UserCreationForm):
    email = forms.EmailField(required=True)

    class Meta:
        model = User
        fields = ("username", "email", "password1", "password2")

    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)
        ph = {"username": "Choose a username", "email": "student@university.edu",
              "password1": "Min 8 characters", "password2": "Repeat password"}
        for n, f in self.fields.items():
            f.widget.attrs.update({"class": INPUT, "placeholder": ph[n]})

    def clean_email(self):
        e = self.cleaned_data["email"].lower()
        if User.objects.filter(email__iexact=e).exists():
            raise forms.ValidationError("This email is already registered.")
        return e


class LoginForm(AuthenticationForm):
    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)
        self.fields["username"].widget.attrs.update({"class": INPUT, "placeholder": "Your username", "autofocus": True})
        self.fields["password"].widget.attrs.update({"class": INPUT, "placeholder": "••••••••"})


class ProfileForm(forms.Form):
    degree = forms.ChoiceField(choices=[("bachelor", "Bachelor's (8 semesters)"), ("master", "Master's (4 semesters)")],
                               widget=forms.Select(attrs={"class": INPUT}))
    current_semester = forms.IntegerField(min_value=1, max_value=8, widget=forms.Select(attrs={"class": INPUT}))
    start_term = forms.ChoiceField(choices=[("spring", "Spring"), ("fall", "Fall")], widget=forms.Select(attrs={"class": INPUT}))
    start_year = forms.IntegerField(required=False, min_value=2000, max_value=2100,
                                    widget=forms.NumberInput(attrs={"class": INPUT, "placeholder": "e.g. 2024"}))
    required_credits = forms.IntegerField(min_value=1, max_value=300, widget=forms.NumberInput(attrs={"class": INPUT}))
    target_cgpa = forms.FloatField(min_value=0, max_value=4.5, widget=forms.NumberInput(attrs={"class": INPUT, "step": "0.01"}))
    history = forms.CharField(required=False, widget=forms.HiddenInput())

    def clean(self):
        d = super().clean()
        if self.errors:
            return d
        if d["current_semester"] > DEGREE_MAX[d["degree"]]:
            self.add_error("current_semester", f"A {d['degree']}'s degree has {DEGREE_MAX[d['degree']]} semesters.")
            return d
        try:
            d["history_parsed"] = parse_history(d.get("history"), d["current_semester"])
        except ValueError as e:
            self.add_error(None, str(e))
        return d


class ContactForm(forms.Form):
    name = forms.CharField(max_length=80, widget=forms.TextInput(attrs={"class": INPUT, "placeholder": "Your name"}))
    email = forms.EmailField(widget=forms.EmailInput(attrs={"class": INPUT, "placeholder": "you@university.edu"}))
    topic = forms.ChoiceField(choices=[("general", "General question"), ("bug", "Report a problem"),
                                       ("feature", "Feature request"), ("other", "Something else")],
                              widget=forms.Select(attrs={"class": INPUT}))
    message = forms.CharField(min_length=10, max_length=2000,
                              widget=forms.Textarea(attrs={"class": INPUT, "rows": 6, "placeholder": "How can we help?"}))
    website = forms.CharField(required=False, widget=forms.TextInput(attrs={"tabindex": "-1", "autocomplete": "off"}))  # honeypot
