# Google Form Auto Filler

A small [Tampermonkey](https://www.tampermonkey.net/) userscript that saves you from retyping the same details on survey and feedback Google Forms. It adds a floating panel to every Google Form where you store your info once, then fill the form with one click.

> **Always review before you submit.** The script fills the form but never submits it for you.

## Features

- **Saves your details once:** name, email, student ID, a suggestion message and a feedback message are stored in your browser and reloaded on every form.
- **Fills text questions by matching the question wording**, in English, Malay and Chinese.
- **Picks the highest score** on rating-scale questions (optional, controlled by a checkbox).
- **Separate suggestion and feedback messages**, because many forms ask for both in different questions.
- **Panel language switcher** (BC / BI / BM) at the top right of the panel.
- **Collapsible panel** so it stays out of the way.

## How it works

| Question type | What the script does |
|---|---|
| Scale / multiple choice with 3 to 7 options | Clicks the **last** option (if "Select highest score" is ticked) |
| Short answer matching name / email / student ID | Fills your saved details |
| Short answer matching suggestion / feedback | Fills your saved suggestion or feedback |
| Long answer (paragraph) | Fills the suggestion or feedback text, depending on the question. If it matches neither, it gets the feedback text |
| Anything else | Left empty |

Questions are matched by looking for keywords in the question text, so the script works in any language for scores and long answers, and in English, Malay and Chinese for the keyword-matched fields.

| Field | Example keywords |
|---|---|
| Name | name, nama, 姓名, 名字 |
| Email | email, emel, 邮箱, 电邮 |
| Student ID | student id, matric, no. matriks, 学号 |
| Suggestion | suggest, cadangan, saran, 建议 |
| Feedback | feedback, comment, maklum balas, komen, 反馈, 意见 |

The full lists are in the `KEYS` object near the top of the script. If a form uses a word that isn't matched, add it there.

## Installation

### Desktop (Chrome / Edge / Firefox)

1. Install the **Tampermonkey** extension for your browser.
2. In Chrome, open `chrome://extensions`, click **Details** on Tampermonkey, and turn on **Allow User Scripts**. Recent versions of Chrome need this for scripts to run.
3. Click the Tampermonkey icon → **Create a new script**.
4. Delete the template, paste in the contents of `google-form-autofill.user.js`, and press **Ctrl+S** (Cmd+S on Mac).
5. Open any Google Form. The **Auto Filler** panel appears at the bottom-right after a second.

### Phone

Chrome on phones doesn't support extensions, so use a different browser:

- **Android:** Firefox for Android with the Tampermonkey add-on.
- **iPhone / iPad:** Safari with a userscript manager such as the Userscripts app.

Open the form in that same browser (links opened inside other apps may use a different in-app browser where the script won't run). Your saved details are stored per browser, so you'll enter them once on each device.

## Usage

1. Open a Google Form.
2. In the panel, enter your **Name**, **Email**, **Student ID**, **Suggestion** and **Feedback**.
3. Tick **Select highest score** if you want rating questions answered with the top option.
4. Click **Save & Fill**.
5. Check the form, especially scale questions, then submit it yourself.

Your details are saved when you click **Save & Fill**, so the panel is already filled in next time.

For **multi-page forms**, click **Save & Fill** again on each new page.

### Language switcher

The **BC**, **BI** and **BM** buttons at the top right of the panel switch the panel between Chinese, English and Malay. The active language is highlighted, and your choice is remembered. This only changes the panel's labels. The suggestion and feedback text is whatever you type.

## Limitations

- **Reversed or negative scales** (for example, 1 = best, or "The workload was too heavy") still get the highest option, so check these before submitting.
- **Multiple choice questions that aren't scores** with 3 to 7 options (such as "Which faculty?") also get the last option.
- **Dropdowns and checkbox questions** are not handled.
- **Every long-answer box** that doesn't match a suggestion or feedback keyword gets your feedback text.
- **Google can change its page structure.** If the script stops working, the selectors `[role="radio"]`, `[role="radiogroup"]`, `[role="listitem"]` and `[role="heading"]` are the first things to check.

## Privacy

Everything you enter is stored locally in your browser through Tampermonkey (`GM_setValue`). Nothing is sent to any server, and the script makes no network requests. The script file itself contains no personal details, so it's safe to share the file.

## Responsible use

This tool is meant for saving time when you're a genuine respondent on forms you are entitled to fill in. Please don't use it to submit fake or mass responses to other people's surveys, which skews their data and may break the form owner's terms.

## Troubleshooting

| Problem | Try this |
|---|---|
| The panel doesn't appear | Refresh the form. In Chrome, make sure **Allow User Scripts** is on for Tampermonkey (see Installation step 2), and check that the script is enabled in the Tampermonkey menu. |
| A name or email box stays empty | The question wording isn't recognised. Add the word to the `KEYS` list in the script. |
| A scale question got the wrong score | Untick **Select highest score** for that form, or answer that question by hand. |
| Red errors in the browser console | Messages about Content Security Policy, `eval`, or `label for` come from Google's own page and are harmless. |

## Customising

The script is a single plain JavaScript file, so it's easy to modify:

- **Keywords:** edit the `KEYS` object near the top.
- **Default messages:** edit the `DEFAULTS` object.
- **Panel text and languages:** edit the `TEXT` object.
- **Which scales are treated as scores:** change the `3` and `7` in the radio-group check inside `fillForm()`.

## Contributing

Issues and suggestions are welcome. Useful things to add include dropdown and checkbox support, handling of reversed scales, and more keywords for other languages.

## License

[MIT](LICENSE)