# Word lists

Raw material for the [`spark`](../../.github/workflows/shared/spark.md) tool. Creative agents draw random words from
here to seed an idea, so that what gets invented comes partly from chance instead of entirely from a model's
defaults.

**This is not part of the world.** Nothing here is lore, nothing here is canon, and no agent may write to it — the
commit step stages `codex/` only. Words are inspiration; they are translated into the world, never imported into it.

| File | Words |
| --- | --- |
| `nouns.txt` | 8,815 |
| `adjectives.txt` | 4,518 |
| `verbs.txt` | 3,584 |

One lowercase word per line, sorted, 3–12 letters, no multi-word entries.

## Where they came from

Derived from [WordNet 3.0](https://wordnet.princeton.edu/) (Princeton University), which tags every lemma with a
part of speech. The raw lists are far larger; they were cut down to lemmas that appear at least once in WordNet's
semantic concordance, which drops the taxonomic and technical long tail (`aalii`, `anisogamete`) and keeps words a
person might actually use.

They are still ordinary modern English, so plenty of draws will be useless here. That is by design — agents are told
to discard most of what they draw. See [`LICENSE-wordnet.txt`](LICENSE-wordnet.txt) for the WordNet licence.

## Regenerating

Not automated, and not expected to change. If you want to rebuild or re-tune the filter, the lists come from the
`index.noun`, `index.adj` and `index.verb` files in the `wordnet-db` npm package: keep field 0 as the lemma, and
filter on the `tagsense_cnt` field (index `5 + p_cnt`) being at least 1.
