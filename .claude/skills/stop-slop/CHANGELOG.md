# Changelog

## 2026-09-10

Local copy vendored into this repository at `.claude/skills/stop-slop/`. Upstream: https://github.com/hardikpandya/stop-slop

### Fixed

The rewrites in `references/examples.md` broke rules the skill sets elsewhere. A model copying them would reproduce the patterns the skill exists to remove.

- Example 2: "Nobody admits confusion" used a lazy extreme banned under Word Patterns, in the disembodied phrasing that Narrator-from-a-Distance rejects. The rewrite now puts the reader and a named actor in the sentence.
- Example 3: "Move faster. Your competition is." stacked two short punchy sentences, which Rhythm Patterns bans as staccato fragmentation. One sentence now carries it.
- Example 4: the rewrite "Speed, quality, cost—pick two." carried an em dash against SKILL.md rule 6 and Rhythm Patterns, plus a three-item list that the same table rejects. The tradeoff now runs on two items in a full sentence, so the example still demonstrates dramatic fragmentation without breaking anything.
- Example 5: "The best teams optimize for learning, not productivity." kept the contrastive negation that Binary Contrasts tells writers to drop.

### Unchanged

- The 2025-01-12 initial-release date below matches upstream. Its distance from the 2026 entries looks like a typo, but nothing available here confirms a different date, so it stays as the author wrote it.

## 2026-01-13

### Added

**Phrases (references/phrases.md)**
- Throat-clearing: "Here's what I find interesting", "Here's the problem though"
- Performative emphasis: "creeps in", "I promise", "They exist, I promise"
- Telling instead of showing: "This is genuinely hard", "This is what leadership actually looks like"

**Structures (references/structures.md)**
- Binary contrasts: "Not X. But Y.", "It's not this. It's that.", "stops being X and starts being Y"
- Rhythm patterns: staccato fragmentation, dashes for dramatic pause, hedging as reassurance
- Word patterns: absolute words (always, never, everyone, etc.), AI-overused intensifiers (deeply, truly, fundamentally, inherently, simply, literally, inevitably)

## 2026-01-12

- Restructured skill following Claude Code best practices (PR #1)
- Split into SKILL.md and references/ folder

## 2025-01-12

- Initial release
