# Listen Better Project Brief

## Product Name

Listen Better

## Tagline

Paste anything. Hear what matters.

---

# Mission

Listen Better helps users turn written content into a natural, trustworthy listening experience.

The application should feel like:

- A thoughtful narrator
- A trusted reader
- A ministry assistant
- A podcast host
- An audiobook reader

The application should never feel like:

- A PDF reader
- A robotic text-to-speech engine
- A spreadsheet reader
- A generic AI tool

---

# Project History

The application originally began as:

Vocalize.it

focused primarily on AI-powered text processing.

The application has evolved into:

Listen Better

focused primarily on listening.

The preferred user journey is:

Paste
↓
Listen Better
↓
Play

---

# Core Principle

Whenever there is a choice between:

More Features

or

Better Listening

always prioritize:

Better Listening

---

# Technology Stack

## Frontend

- React
- Vite
- PWA (Progressive Web App)

## Backend

- Firebase Hosting
- Firebase Functions
- Google Gemini

## Audio

- Browser Speech Synthesis API

Current philosophy:

Keep the browser speech engine and improve the listening experience before replacing the speech technology.

---

# Product Vision

The goal is to become the best tool for listening to:

- Ministry newsletters
- Missionary updates
- Prayer letters
- Church newsletters
- Devotionals
- Scripture passages
- Articles
- Reports
- PDFs
- Government notices
- Emails
- Long-form content

Listen Better should sound like a knowledgeable person reading content aloud rather than a machine reading text.

---

# Current Priorities

## 1. Speech Intelligence Layer

Future component:

speechIntelligence.js

Processing pipeline:

Input
↓
Listen Better
↓
Speech Intelligence
↓
Text To Speech

Purpose:

Improve how content sounds without changing what the user sees.

Examples:

- read vs red
- lead vs led
- wind vs wind
- live vs live
- wound vs wound
- minute vs minute
- record vs record

---

## 2. Scripture-Aware Narration

Scripture is protected content.

Never:

- Summarize Scripture
- Paraphrase Scripture
- Modernize Scripture
- Rewrite Scripture

Preserve wording exactly.

Supported translations include:

- KJV
- NKJV
- NIV
- ESV
- NASB
- CSB
- NLT

### Desired Behavior

Input:

John 3:16-18

16 For God so loved the world...

17 For God did not send...

18 Whoever believes...

Speech:

John chapter three, verses sixteen through eighteen.

For God so loved the world...

For God did not send...

Whoever believes...

### Rules

- Read chapter and verse references naturally.
- Suppress repeated verse numbers during narration.
- Remove study-note markers.
- Remove cross-reference markers.

---

# Trust Framework

Users must trust the content they hear.

Certain content should never be rewritten.

## Protected Content

### Scripture

Preserve exactly.

### Direct Quotations

Examples:

- Martin Luther King Jr.
- C.S. Lewis
- Corrie ten Boom
- Billy Graham
- Charles Spurgeon
- Dallas Willard
- A.W. Tozer

Preserve quotations exactly.

### Prayers

Preserve wording.

### Poetry

Preserve wording and structure.

### Creeds and Liturgical Readings

Preserve wording.

---

# Pronunciation Intelligence

Handle words whose pronunciation depends on context.

Examples:

- read
- lead
- wind
- tear
- bow
- live
- wound
- minute
- object
- project
- conduct
- content
- record
- present

Example:

Input:

I read it yesterday.

Speech:

I red it yesterday.

when context indicates past tense.

---

# Cross-Reference Cleanup

Do not read:

¹
²
³
⁴
⁵
*
**
***
†
‡
§
[1]
[12]
[35]

when they function as references.

Remove them from speech output.

---

# Ministry Newsletter Intelligence

One of the most important content categories.

Examples:

- Missionary newsletters
- Prayer letters
- Church newsletters
- Ministry updates
- Support letters

Preserve:

- Prayer requests
- Praise reports
- Testimonies
- Ministry stories
- Future ministry plans

Remove:

- Unsubscribe links
- View in browser links
- Mailchimp references
- Mailing addresses
- Marketing content
- Preference links
- Boilerplate email content

Goal:

Sound like a ministry update rather than an email.

---

# Layout Intelligence

Future component:

layoutAnalyzer.js

Purpose:

Handle copied content from:

- Two-column PDFs
- Three-column PDFs
- Brochures
- Bulletins
- Benefits guides
- Conference programs
- Training manuals

Problem:

Many PDFs lose their natural reading order when copied.

Goal:

Reconstruct the order a human would naturally read.

Listening flow is more important than preserving visual layout.

---

# Structured Data Detection

Future component:

structuredDataDetector.js

Purpose:

Recognize:

- Excel exports
- Google Sheets exports
- CSV files
- Airtable exports
- Database exports

Support detection up to:

500 rows
40 columns

When structured data is detected:

Do not automatically process as narrative text.

Offer:

- Summarize Dataset
- Extract Insights
- Convert to Narrative
- Read Selected Columns

Goal:

Never mistake a spreadsheet for a story.

---

# Real World Test Library

Maintain:

test-documents/

Recommended structure:

test-documents/
├── emails
├── newsletters
├── mission-newsletters
├── prayer-letters
├── devotionals
├── church-bulletins
├── government-notices
├── brochures
├── pdf-2-column
├── pdf-3-column
├── structured-data
└── scripture

Real-world examples are more valuable than synthetic examples.

---

# Audio Experience

## Auto-Play

Audio should never begin automatically.

Required:

Paste
↓
Listen Better
↓
Processing Complete
↓
User Presses Play

---

## Player Controls

These should remain visible whenever possible:

- Play
- Pause
- Stop
- Voice Selection
- Speech Rate

Settings should not hide playback controls.

---

## Speech Rate

Preferred future design:

Slider

Range:

0.50x → 2.00x

Step:

0.05

User preference should persist between sessions.

Example preferred speed:

0.95x

---

# User Experience Priorities

Most important elements:

1. Input Area
2. Listen Better Button
3. Play Button
4. Pause Button
5. Stop Button
6. Speech Rate
7. Voice Selection

Everything else is secondary.

---

# Mobile Experience

Primary goal:

Users should ideally see:

Input Area

Listen Better Button

Play Button

without excessive scrolling.

Reduce unnecessary vertical padding on mobile devices.

Target:

15%–25% reduction in mobile spacing where appropriate.

---

# Branding

## Product Name

Listen Better

## Tagline

Paste anything. Hear what matters.

---

# Main Action Button

Text:

Listen Better

Typography:

Listen

- Weight: 500
- Slightly softer emphasis

Better

- Weight: 700
- Primary emphasis

Visual goal:

Listen BETTER

### Color Hierarchy

Listen:

Slightly softer color.

Better:

Slightly stronger color.

Must remain visible in:

- Light Theme
- Dark Theme

### Word Spacing

Use proper CSS spacing.

Preferred:

gap: 0.15em

Do not use:

- Multiple spaces
- Nonbreaking-space hacks
- Invisible characters

---

# Logo Standards

Preferred format:

[Logo] Listen Better

Logo appears before the product name.

### Main Button

Replace the headphone icon.

Use the official Listen Better logo.

Requirements:

- Slightly taller than the capital L.
- Positioned very close to the word Listen.
- Visually feels like one unit.

Desired appearance:

[Logo] Listen Better

---

# Update Notification

Use:

Listen Better has improved.

Refresh to hear what's new.

[Refresh Now]

[Later]

Tone:

- Friendly
- Calm
- Helpful
- Non-technical

Avoid:

- Update Available
- New Build Available
- Software Update Ready

---

# Long-Term Goal

Listen Better should become the best way to listen to:

- Newsletters
- Devotionals
- Scripture
- PDFs
- Articles
- Reports
- Ministry updates
- Structured data summaries

The product should sound like:

A knowledgeable friend reading content aloud.

The product should never sound like:

A PDF reader.

---

# Success Test

Before adding any feature ask:

Does this make Listen Better more human, more trustworthy, and easier to listen to?

If the answer is no, reconsider the feature.

---

Listen Better

Paste anything. Hear what matters.