# English translations of synced content

UI translations live in `messages/en.json`. Bilingual content normally carries
its own `es` and `en` values.

The People and Journal Club sheets also contain text without an English
translation. Maintain its English version in `content/translations.en.json`,
using the exact source text as the key and its English translation as the value.
This file is curated and is not overwritten by the sync scripts.

The content layer uses these translations for Journal Club titles, abstracts,
notes, speaker positions and rooms, and for bilingual fields where the sync has
copied the same source text into both languages. Explicit bilingual translations
take precedence. Names, affiliations, publication titles, links and session
dates retain their original values.

When source wording changes or a new session is added, add its translation here.
Unknown text is displayed in its original language until translated; exact
matching prevents outdated translations from hiding source updates.
