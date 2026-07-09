const fs = require('fs');
const path = require('path');

const testDocsDir = path.join(__dirname, '..', 'test-documents', 'layout-recovery');
const expectedDir = path.join(__dirname, '..', 'expected-output', 'layout-recovery');

fs.mkdirSync(testDocsDir, { recursive: true });
fs.mkdirSync(expectedDir, { recursive: true });

const tests = {
  'benefits-guide.txt': {
    input: `Health Plan Options 2026                 Contact Us
HMO Plan                                 1-800-555-0199
This plan requires a primary             benefits@company.com
care provider.                           
PPO Plan                                 Visit our website:
Flexible choices for out of              www.companybenefits.com
network care.`,
    expected: `Health Plan Options 2026

HMO Plan
This plan requires a primary care provider.

PPO Plan
Flexible choices for out of network care.`
  },
  'church-bulletin.txt': {
    input: `Welcome to Grace Church               Announcements
Order of Service                      - Youth Group Wed at 7
- Welcome & Prayer                    - Men's Breakfast Sat
- Worship Singing                     
- Sermon: John 3:16                   Prayer Requests
- Communion                           Please pray for the Smith family
- Closing Song                        as they travel this week.`,
    expected: `Welcome to Grace Church

Order of Service
- Welcome & Prayer
- Worship Singing
- Sermon: John 3:16
- Communion
- Closing Song

Announcements
- Youth Group Wed at 7
- Men's Breakfast Sat

Prayer Requests
Please pray for the Smith family as they travel this week.`
  },
  'mission-newsletter.txt': {
    input: `Update from the Field                    Page 1 | Jan 2026
Our time in Kenya has been               Support Our Work
fruitful. The new well is                [Donate Button]
finally operational.                     PO Box 1234, Dallas TX
We want to thank all of you              
for your continued prayers.              www.missionsite.org`,
    expected: `Update from the Field
Our time in Kenya has been fruitful. The new well is finally operational.
We want to thank all of you for your continued prayers.`
  },
  'conference-program.txt': {
    input: `Day 1 Schedule                         Track A          Track B
9:00 AM - Keynote Address              Marketing        Engineering
10:30 AM - Break                       Room 101         Room 102
11:00 AM - Morning Sessions            Strategy         Architecture
12:30 PM - Lunch Break                 Room 101         Room 102`,
    expected: `Day 1 Schedule
9:00 AM - Keynote Address
10:30 AM - Break
11:00 AM - Morning Sessions
12:30 PM - Lunch Break

Track A
Marketing (Room 101)
Strategy (Room 101)

Track B
Engineering (Room 102)
Architecture (Room 102)`
  },
  'training-brochure.txt': {
    input: `Leadership Training 101
Module 1: Vision             Module 2: Execution          Module 3: Review
Learn how to cast a          Discover methods to          Evaluate success
compelling vision            implement your ideas         and pivot when
for your entire team.        effectively and fast.        it is necessary.
Copyright 2026 Training Co.`,
    expected: `Leadership Training 101

Module 1: Vision
Learn how to cast a compelling vision for your entire team.

Module 2: Execution
Discover methods to implement your ideas effectively and fast.

Module 3: Review
Evaluate success and pivot when it is necessary.`
  },
  'government-brochure.txt': {
    input: `Tax Filing Deadlines 2026        | Forms Needed
Individual Returns: April 15     | 1040, W-2, 1099
Corporate Returns: March 15      | 1120, 1099-MISC
Extensions: October 15           | Form 4868
Department of Revenue - www.gov.tax.gov - 1-800-TAX-FORM`,
    expected: `Tax Filing Deadlines 2026
Individual Returns: April 15
Corporate Returns: March 15
Extensions: October 15

Forms Needed
1040, W-2, 1099
1120, 1099-MISC
Form 4868`
  },
  'two-column.pdf-example.txt': {
    input: `This is the start of the first       This is the start of the second
column of text. It goes down         column of text. It continues the
the page vertically but when         thought from the first column,
you copy and paste it, it            but PDF extractors often mix
often gets mixed horizontally        the lines together like this.
with the second column.              It makes reading impossible.`,
    expected: `This is the start of the first column of text. It goes down the page vertically but when you copy and paste it, it often gets mixed horizontally with the second column.

This is the start of the second column of text. It continues the thought from the first column, but PDF extractors often mix the lines together like this. It makes reading impossible.`
  },
  'three-column.pdf-example.txt': {
    input: `Col 1 Header       Col 2 Header       Col 3 Header
This is the first  This is the 2nd    And finally the
column of text.    column of text.    third column.
It is short.       It is also short.  It ends here.
1234 Main St       1234 Main St       1234 Main St`,
    expected: `Col 1 Header
This is the first column of text. It is short.

Col 2 Header
This is the 2nd column of text. It is also short.

Col 3 Header
And finally the third column. It ends here.`
  }
};

for (const [filename, data] of Object.entries(tests)) {
  fs.writeFileSync(path.join(testDocsDir, filename), data.input);
  fs.writeFileSync(path.join(expectedDir, filename), data.expected);
}

console.log("Test files generated successfully!");
