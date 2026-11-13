"""Build HCIN6222 Final POE report: ~15 body pages (cover + references not counted)."""
from pathlib import Path
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = Path(r"C:\Users\veekh\OneDrive\Desktop\HCIN6222")
SHOTS = ROOT / "AssignmentFlow" / "AssignmentFlow" / "screenshots" / "report"
OUT = ROOT / "HCIN6222_POE_ST10468302.docx"
OUT_DOCS = Path(r"C:\Users\veekh\OneDrive\Documents\HCIN6222_POE_ST10468302.docx")

NAVY = RGBColor(0x22, 0x28, 0x3A)
BLUE = RGBColor(0x35, 0x56, 0xC8)
IMG_W = 14.0


def set_run_font(run, size=11, bold=False, color=NAVY, name="Arial"):
    run.font.name = name
    run._element.rPr.rFonts.set(qn("w:eastAsia"), name)
    run.font.size = Pt(size)
    run.bold = bold
    run.font.color.rgb = color


def add_page_number(paragraph):
    run = paragraph.add_run()
    fld1 = OxmlElement("w:fldChar")
    fld1.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    fld2 = OxmlElement("w:fldChar")
    fld2.set(qn("w:fldCharType"), "end")
    run._r.append(fld1)
    run._r.append(instr)
    run._r.append(fld2)
    set_run_font(run, 9)


def configure_section(section):
    section.page_width = Cm(21.0)
    section.page_height = Cm(29.7)
    section.left_margin = Cm(2.0)
    section.right_margin = Cm(2.0)
    section.top_margin = Cm(2.0)
    section.bottom_margin = Cm(2.0)
    header = section.header
    header.is_linked_to_previous = False
    hp = header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r = hp.add_run("HCIN6222  |  AssignmentFlow  |  Final POE")
    set_run_font(r, 9, color=BLUE)
    footer = section.footer
    footer.is_linked_to_previous = False
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    left = fp.add_run("Vusimuzi Khanyile  ST10468302   ")
    set_run_font(left, 9)
    add_page_number(fp)


def set_normal(doc):
    style = doc.styles["Normal"]
    style.font.name = "Arial"
    style.font.size = Pt(11)
    style.font.color.rgb = NAVY
    pf = style.paragraph_format
    pf.line_spacing = 1.25
    pf.space_after = Pt(9)
    pf.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY


def heading(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    set_run_font(run, 13, bold=True, color=BLUE)
    return p


def body(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.line_spacing = 1.2
    p.paragraph_format.space_after = Pt(8)
    run = p.add_run(text)
    set_run_font(run, 11)
    return p


def caption(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(10)
    run = p.add_run(text)
    set_run_font(run, 9, bold=True)
    return p


def picture(doc, name, width_cm=IMG_W):
    path = SHOTS / name
    if not path.exists():
        body(doc, f"[Screenshot missing: {name}]")
        return
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    run = p.add_run()
    run.add_picture(str(path), width=Cm(width_cm))


def section_break(doc, title, page_break=False):
    if page_break:
        doc.add_page_break()
    else:
        spacer = doc.add_paragraph()
        spacer.paragraph_format.space_before = Pt(6)
        spacer.paragraph_format.space_after = Pt(0)
    heading(doc, title)


def cover(doc):
    for _ in range(3):
        doc.add_paragraph()
    t = doc.add_paragraph()
    t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = t.add_run("The Independent Institute of Education")
    set_run_font(r, 12, bold=True, color=BLUE)

    t = doc.add_paragraph()
    t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = t.add_run("HUMAN COMPUTER INTERACTION")
    set_run_font(r, 18, bold=True)

    t = doc.add_paragraph()
    t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = t.add_run("HCIN6222")
    set_run_font(r, 14, bold=True, color=BLUE)

    t = doc.add_paragraph()
    t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = t.add_run("Portfolio of Evidence — Final POE")
    set_run_font(r, 16, bold=True)

    t = doc.add_paragraph()
    t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = t.add_run("Research report and prototype")
    set_run_font(r, 12)

    t = doc.add_paragraph()
    t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = t.add_run("AssignmentFlow")
    set_run_font(r, 20, bold=True, color=BLUE)

    t = doc.add_paragraph()
    t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = t.add_run("Don't finish the assignment. Finish today's step.")
    set_run_font(r, 11)

    doc.add_paragraph()
    for label, value in [
        ("Student name", "Vusimuzi Khanyile"),
        ("Student number", "ST10468302"),
        ("Module", "HCIN6222"),
        ("Description", "Final POE"),
        ("Date", "13 November 2026"),
    ]:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        a = p.add_run(f"{label}:  ")
        set_run_font(a, 11, bold=True)
        b = p.add_run(value)
        set_run_font(b, 11)


def toc(doc):
    doc.add_page_break()
    heading(doc, "Table of contents")
    items = [
        "1. Introduction and problem statement",
        "2. Website functionality  —  Figures 1 to 4",
        "3. Usability goals  —  Figure 5",
        "4. Desirable aspects of user experience  —  Figure 6",
        "5. Design principles  —  Figure 7",
        "6. Interaction types  —  Figures 8 to 10",
        "7. Social interactions  —  Figures 11 to 13",
        "8. Emotional interaction  —  Figures 14 to 16",
        "9. Web Content Accessibility Guidelines (WCAG) 2.0  —  Figure 17",
        "10. Conclusion",
        "References",
    ]
    for title in items:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(6)
        r = p.add_run(title)
        set_run_font(r, 11)


def build():
    doc = Document()
    set_normal(doc)
    configure_section(doc.sections[0])

    cover(doc)
    toc(doc)

    # BODY STARTS — target ~15 pages excluding cover and references
    section_break(doc, "1. Introduction and problem statement", page_break=True)
    body(
        doc,
        "When a university student has a big assignment with many sub-questions, the first reaction is often to close "
        "the file. The task feels too large to start. Calendars and task managers do not help much, because they show "
        "everything that still needs to be done plus the due date. They also do not make space for rest, and they do not "
        "reward the student enough for finishing one small piece. AssignmentFlow tries to fix this. It is a responsive "
        "website that gives the student one target for the day, rewards them when they finish it, and then reminds them "
        "to rest.",
    )
    body(
        doc,
        "Part 1 was the plan. Part 2 was the working prototype. A few details were cleaned up so the report and the "
        "screen match. Finishing a target always gives 150 XP. Some progress gives 50 XP. Not yet gives 0 XP. Design "
        "principles are discussed using Norman (2013) and Sharp, Rogers and Preece (2019). FlowCite still asks the "
        "student for the page number before it builds a Harvard reference. The prototype was built with Next.js. Sign "
        "in works with any email and password, or with the demo Google button. After a short onboarding, the dashboard "
        "opens with today's step.",
    )
    body(
        doc,
        "Part 2 feedback confirmed that the social interaction requirements from Part 1 were successfully translated "
        "into the website prototype. The marker noted that the proposed features demonstrate how users can communicate, "
        "collaborate, or engage with one another; that the functionality is relevant to the identified target users; "
        "that the interface provides an understandable structure for accessing social features; that usability was "
        "considered by making the interaction process relatively straightforward; and that design principles were "
        "appropriately applied. No corrective redesign was required. This Final POE therefore keeps that implementation, "
        "updates the report for final submission, and uses result screenshots that show the outcome of each main flow.",
    )

    section_break(doc, "2. Website functionality")
    body(
        doc,
        "When creating an assignment, the student enters the module code, title, deadline, and sub-questions with time "
        "estimates. The tool recommends one achievable target per day and keeps a two-day buffer before the deadline. "
        "If a past date is typed, the form shows “Please enter a valid future date.” and the next button stays disabled. "
        "If the module code is already known in the community list, the form also shows how many students have entered it.",
    )
    body(
        doc,
        "On the dashboard the student only sees today's target. They hit Start today's target, work outside AssignmentFlow, "
        "then come back to check in. The question is “Did you manage to make progress?” with three options: Yes, I finished "
        "it (+150 XP), I made some progress (+50 XP), and Not yet (0 XP). A finished step can be verified. A score of 50 "
        "or higher unlocks rewards such as mobile data, campus catering, printing, and transport. After a finish, the rest "
        "reminder offers I'm Done for Today or I'm in the flow, let me continue (+200 XP).",
    )
    body(
        doc,
        "My Journey shows the task timeline. When the learner starts a target, the dashboard shows Working on … and the "
        "timeline marks that step as in progress. When they finish and verify, the dashboard shows Today's step is done "
        "and the timeline moves the same step to completed with the XP earned. FlowCite finds sources and builds a Harvard "
        "reference after the page number is typed. Social features include the Support Wall, silent study rooms, Study Buddy, "
        "and collective milestones. There are no leaderboards.",
    )
    picture(doc, "fig1-create.png")
    caption(doc, "Figure 1. Result of create validation: past deadline rejected with plain-language WCAG error text.")
    picture(doc, "fig14-task-started.png")
    caption(doc, "Figure 2. Result of starting today's target: Working on … with Return & check in.")
    picture(doc, "fig15-timeline-started.png")
    caption(doc, "Figure 3. Result on My Journey while the target is in progress (You are here).")
    picture(doc, "fig16-task-completed.png")
    caption(doc, "Figure 4. Result of finishing today's target: Today's step is done and 150 XP banked.")

    section_break(doc, "3. Usability goals")
    body(
        doc,
        "According to Sharp, Rogers and Preece (2019), there are six usability goals: effectiveness, efficiency, safety, "
        "utility, learnability, and memorability.",
    )
    body(
        doc,
        "Effectiveness: the user only sees the target for the current day. There is no other list to process first. "
        "Efficiency: starting a target takes one click, and the check-in is one choice. Progress is saved in the browser. "
        "Safety: if the user selects Not yet, they are not punished and the target rolls over. The streak shield also "
        "protects a short streak if one day is missed. Utility: the Rewards Store and FlowCite deal with real student "
        "problems such as data, printing, catering, transport, and Harvard referencing. Learnability: a three-screen "
        "onboarding explains the idea before the dashboard. Memorability: the daily target card and Start today's target "
        "button stay in the same place every visit.",
    )
    body(
        doc,
        "These goals also map to the Fogg Behavior Model (Fogg, 2009). For a behaviour to happen, the user needs "
        "motivation, ability, and a trigger at the same time. AssignmentFlow focuses on ability first. The target is one "
        "manageable task, and starting it takes one click. The XP bar shows the level, the total XP, how much is left, "
        "and a percentage, so colour is never the only cue.",
    )
    picture(doc, "fig2-dashboard.png")
    caption(doc, "Figure 5. Usability result: dashboard shows only today's step, labelled XP progress, and Start today's target.")

    section_break(doc, "4. Desirable aspects of user experience")
    body(
        doc,
        "According to Hassenzahl (2010), a product should feel useful and also feel good to use. Sharp, Rogers and "
        "Preece (2019) list desirable aspects such as satisfying, enjoyable, motivating, helpful, and rewarding.",
    )
    body(
        doc,
        "Satisfying: the progress bar moves and XP is banked when a step is finished. Enjoyable: levels and rewards "
        "feel familiar without turning study into a public competition. Motivating: the Rewards Store offers things "
        "students actually need, such as data, catering, printing, and transport. Xiao and Hew (2024) note that tangible "
        "rewards linked to meaningful outcomes work better than points alone.",
    )
    body(
        doc,
        "Supportive and trustworthy: after a finish, the rest reminder tells the student that rest is part of the "
        "process. They can stop without losing the XP they already earned. This fits Self-Determination Theory "
        "(Ryan and Deci, 2000). The student chooses whether to rest or continue, sees clear progress, and can still "
        "feel connected through the Support Wall and study rooms.",
    )
    picture(doc, "fig9-rewards.png")
    caption(doc, "Figure 6. UX result: Rewards Store with data, catering, printing, and transport unlocked by XP.")

    section_break(doc, "5. Design principles")
    body(
        doc,
        "Norman (2013) says good design should be discoverable, and that feedback and constraints stop people from "
        "blaming themselves. Sharp, Rogers and Preece (2019) talk about the same ideas as visibility, feedback, "
        "constraints, consistency, and affordance.",
    )
    body(
        doc,
        "Visibility of system status: the XP bar, the Ready or In progress label, and the Working on … banner. "
        "Feedback: finished gives +150 XP, some progress shows Every step counts!, and Not yet shows that progress "
        "is safe. Constraints: a past deadline is blocked, and FlowCite will not generate a reference until the page "
        "number is typed. Consistency: XP values stay the same, and the main buttons look the same across screens. "
        "Affordance: Start today's target is large and clearly clickable.",
    )
    body(
        doc,
        "Recognition rather than recall: on return, the student is asked “Did you manage to make progress?” instead of "
        "having to remember what they did. Error recovery is gentle. A modal can be closed, Not now is available, and "
        "a rolled target comes back tomorrow. Help is given through onboarding, tooltips, and short hints under each option.",
    )
    picture(doc, "fig4-checkin.png")
    caption(doc, "Figure 7. Design-principles result: check-in with recognition rather than recall and visible XP feedback.")

    section_break(doc, "6. Interaction types")
    body(
        doc,
        "There are five types of interaction: instructing, conversing, manipulating, exploring, and responding "
        "(Sharp, Rogers and Preece, 2019).",
    )
    body(
        doc,
        "Instructing: the user clicks Start today's target, Minimize & Work, Generate Reference, or Redeem. "
        "Conversing: the system asks “Did you manage to make progress?” and the user answers by choosing an option. "
        "The tone is supportive, not strict. Manipulating: the student can edit sub-questions and change the daily pace "
        "in the create wizard. Exploring: the student can open FlowCite and My Journey. Responding: the interface "
        "answers back with XP, the rest reminder, and the Not yet banner. For the book example, the student uses "
        "Norman's The Design of Everyday Things, types pages 10-34, and FlowCite returns a Harvard reference that can "
        "be saved. The screenshots below show the instructing result and the FlowCite result screens rather than every "
        "intermediate form step.",
    )
    picture(doc, "fig3-start-modal.png")
    caption(doc, "Figure 8. Instructing result: Start Target modal sends the student out to their own document.")
    picture(doc, "fig7c-flowcite-result.png")
    caption(doc, "Figure 9. FlowCite result: Harvard reference generated for the book citation.")
    picture(doc, "fig7d-flowcite-saved.png")
    caption(doc, "Figure 10. FlowCite result: that book reference saved in My References.")

    section_break(doc, "7. Social interactions")
    body(
        doc,
        "Sharp, Rogers and Preece (2019) highlight conversation, coordination, and awareness. According to Festinger "
        "(1954), people compare themselves with others when they do not have a clear measure. AssignmentFlow keeps "
        "the social side, but removes leaderboards and public ranking.",
    )
    body(
        doc,
        "The Support Wall lets students leave messages. Other people's posts show as Anonymous. Study rooms let "
        "students sit together quietly with no scores. The Study Buddy option in Settings is opt-in. Posts can also "
        "be filtered by assignment, so students on HCIN6222 see HCIN6222 posts first.",
    )
    body(
        doc,
        "Collective milestones show shared progress, such as five hundred students completing a target today, without "
        "naming anyone. A Not yet reply from a Study Buddy stays kind: tomorrow is a new day. The design choice is "
        "deliberate. Comparison is not the product. Part 2 feedback specifically confirmed that these social features "
        "were successfully implemented for the target users and that the structure for accessing them is understandable.",
    )
    picture(doc, "fig8-social.png")
    caption(doc, "Figure 11. Social result: Support Wall, silent study rooms, and anonymous posts. No leaderboard.")
    picture(doc, "fig18-study-buddy.png")
    caption(doc, "Figure 12. Social result: Study buddy opt-in in Settings (private collaboration, not ranking).")
    picture(doc, "fig20-collective.png")
    caption(doc, "Figure 13. Social result: collective step milestone and tomorrow's help circle.")

    section_break(doc, "8. Emotional interaction")
    body(
        doc,
        "Norman (2004) argues that design should create positive feelings and avoid guilt. Sharp, Rogers and Preece "
        "(2019) also say emotional interaction matters because users should not feel ashamed when they struggle.",
    )
    body(
        doc,
        "Desirable responses come from one target a day, XP for consistency, and the rest reminder. The reminder says "
        "“Great choice! Rest is part of the process.” Both I'm Done for Today and I'm in the flow, let me continue "
        "are accepted. Continuing gives +200 XP, but stopping is not treated as failure.",
    )
    body(
        doc,
        "Undesirable responses are blocked on the Not yet path. The message is “That's okay. Life happens. Your progress "
        "is safe.” The same step waits for tomorrow. After a real finish, the dashboard shows Today's step is done and "
        "My Journey moves that step onto the completed path with the XP earned. The student did not finish everything "
        "in one night. They finished it one step at a time.",
    )
    picture(doc, "fig5-not-yet.png")
    caption(doc, "Figure 14. Emotional result after Not yet: progress stays safe and no XP is taken away.")
    picture(doc, "fig6-rest.png")
    caption(doc, "Figure 15. Emotional result after a finish: rest reminder treats rest and flow as good choices.")
    picture(doc, "fig17-timeline-completed.png")
    caption(doc, "Figure 16. Journey result after completion: step verified and marked done on My Journey.")

    section_break(doc, "9. Web Content Accessibility Guidelines (WCAG) 2.0")
    body(
        doc,
        "WCAG 2.0 has four principles: Perceivable, Operable, Understandable, and Robust (W3C, 2008). AssignmentFlow "
        "aims for Level AA, using the W3C Recommendation of 11 December 2008.",
    )
    body(
        doc,
        "Perceivable: Criterion 1.4.3 needs at least 4.5:1 contrast for normal text. Body text uses dark ink on a light "
        "background, and a high-contrast theme is available. Criterion 1.4.1 says colour must not be the only cue, so "
        "the progress bar is labelled. Criterion 1.4.4 says text should still work at 200 percent. Settings offer larger "
        "text sizes (100%, 125%, and 150%), and browser zoom still keeps the layout usable.",
    )
    body(
        doc,
        "Operable: Criterion 2.1.1 needs keyboard access. Buttons, links, and fields are native controls. Modals keep "
        "focus inside, close with Escape, and return focus when closed. There is a Skip to main content link (2.4.1), "
        "a descriptive page title (2.4.2), and a visible focus ring (2.4.7).",
    )
    body(
        doc,
        "Understandable and robust: the page language is English. Error messages are plain, for example “Please enter "
        "a valid future date.” Labels sit above fields. The progress bar uses aria-valuemin, aria-valuemax, "
        "aria-valuenow, and an accessible name. Dialogs use aria-modal. Reduced motion is respected.",
    )
    picture(doc, "fig19-larger-text.png")
    caption(
        doc,
        "Figure 17. WCAG result: Settings text-size options (100%, 125%, 150%) and high-contrast theme (1.4.3 / 1.4.4).",
    )

    section_break(doc, "10. Conclusion", page_break=True)
    body(
        doc,
        "The design of AssignmentFlow was guided by HCI principles from Part 1. Part 2 showed those ideas running in a "
        "prototype, and Part 2 feedback confirmed the social, usability, and design-principle work. This Final POE keeps "
        "that implementation and presents result screens for each main flow. Students often procrastinate when an assignment "
        "feels too big. Breaking it into one daily target, rewarding consistency, and allowing rest makes the work feel "
        "possible.",
    )
    body(
        doc,
        "The start and complete screens in My Journey show that the learner's path is visible from the first click to the "
        "verified finish. The system does not reward students for working the longest. It rewards them for finishing a "
        "realistic step, checking in honestly, and knowing when to stop. Rest is not laziness. It is part of the process.",
    )

    # References — separate page; not counted in the 15 body pages
    doc.add_page_break()
    heading(doc, "References")
    refs = [
        "Festinger, L. (1954) 'A theory of social comparison processes', Human Relations, 7(2), pp. 117-140.",
        "Fogg, B.J. (2009) 'A behavior model for persuasive design', in Proceedings of the 4th International Conference on Persuasive Technology. New York: ACM, pp. 1-7.",
        "Hassenzahl, M. (2010) 'Experience design: Technology for all the right reasons', Synthesis Lectures on Human-Centered Informatics, 3(1), pp. 1-95.",
        "Norman, D. (2004) Emotional Design: Why We Love (or Hate) Everyday Things. New York: Basic Books.",
        "Norman, D. (2013) The Design of Everyday Things. Revised and expanded edn. New York: Basic Books.",
        "Ryan, R.M. and Deci, E.L. (2000) 'Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being', American Psychologist, 55(1), pp. 68-78.",
        "Sharp, H., Rogers, Y. and Preece, J. (2019) Interaction Design: Beyond Human-Computer Interaction. 5th edn. Indianapolis: Wiley.",
        "W3C (2008) Web Content Accessibility Guidelines (WCAG) 2.0. W3C Recommendation, 11 December. Available at: https://www.w3.org/TR/WCAG20/ (Accessed: 13 November 2026).",
        "Xiao, Y. and Hew, K.F. (2024) 'Tangible rewards in gamified learning: A systematic review and meta-analysis', British Journal of Educational Technology, 55(2), pp. 456-478.",
    ]
    for ref in refs:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.left_indent = Cm(1.25)
        p.paragraph_format.first_line_indent = Cm(-1.25)
        p.paragraph_format.space_after = Pt(8)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(ref)
        set_run_font(run, 11)

    doc.save(OUT)
    try:
        doc.save(OUT_DOCS)
        print(f"Wrote {OUT}")
        print(f"Wrote {OUT_DOCS}")
    except PermissionError:
        alt = OUT_DOCS.with_name("HCIN6222_POE_ST10468302_new.docx")
        doc.save(alt)
        print(f"Wrote {OUT}")
        print(f"Documents locked; wrote {alt}")


if __name__ == "__main__":
    build()
