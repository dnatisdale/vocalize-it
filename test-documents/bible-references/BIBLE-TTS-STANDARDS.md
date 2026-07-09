# Vocalize.it Bible Reference TTS Standards

This document defines the expected behavior and normalization rules for handling Bible references during text-to-speech (TTS) playback in Vocalize.it.

## 1. Standard Pronunciation Rules
- References should be spoken as a natural sentence.
- "Book Chapter:Verse" should be expanded to "The Book of [Book Name], chapter [Chapter], verse [Verse]".
- For Gospels, use "The Gospel of [Name]".

## 2. Abbreviation Expansion Rules
Abbreviations must be expanded to their full book names before being passed to the TTS engine:
- `Jn` -> John
- `Mt` or `Matt` -> Matthew
- `Rom` -> Romans
- `Ps` -> Psalms
- `Prov` -> Proverbs
- `Phil` -> Philippians
- `Isa` -> Isaiah

## 3. Numbered Book Handling
Numbered books should use spoken ordinals rather than cardinal numbers:
- `1 Cor` -> First Corinthians
- `2 Cor` -> Second Corinthians
- `1 Tim` -> First Timothy
- `2 Tim` -> Second Timothy
- `1 Thess` -> First Thessalonians
- `2 Thess` -> Second Thessalonians
- `1 John` -> First John

## 4. Chapter and Verse Handling
- The colon `:` must be replaced with the words ", verse ".
- Example: `John 3:16` -> `The Gospel of John, chapter three, verse sixteen.`

## 5. Verse Range Handling
- The hyphen `-` must be replaced with the words " through ".
- Example: `John 3:16-18` -> `...verses sixteen through eighteen.`

## 6. Multi-Reference Handling
- Semicolons separating references should be replaced with natural conjunctions or pauses.
- Example: `John 3:16; Romans 8:28` -> `...verse sixteen, and Romans...`

## 7. Narration Standards
The primary goal is for the reading to sound like a skilled audiobook reader or pastor reading from the pulpit, rather than a robotic list of coordinates. Punctuation should be optimized for pacing (e.g., converting dashes to commas or pauses).
