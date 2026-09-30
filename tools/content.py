"""Content validation and locale resolution, independent of the renderer."""
import json
import re
import unicodedata
from datetime import datetime, timezone, date
from pathlib import Path
from jsonschema import Draft7Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / 'content'


def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def fold(value):
    return ''.join(c for c in unicodedata.normalize('NFD', value) if not unicodedata.category(c).startswith('M')).lower()


def localize(value, locale, translations):
    if isinstance(value, dict):
        if set(value) == {'es', 'en'}:
            text = value[locale]
            return translations.get(text, text) if locale == 'en' and value['en'] == value['es'] else text
        return {k: localize(v, locale, translations) for k, v in value.items()}
    if isinstance(value, list):
        return [localize(v, locale, translations) for v in value]
    return value


def validate(name, data, today=None):
    schema = read_json(CONTENT / f'{name}.schema.json')
    Draft7Validator(schema, format_checker=FormatChecker()).validate(data)
    rows = data['publications'] if name == 'publications' else data
    if name != 'people-extra':
        key = 'slug' if name == 'people' else 'id'
        ids = [row[key] for row in rows]
        if len(ids) != len(set(ids)): raise ValueError(f'{name}: duplicate {key}')
    if name == 'journal-club':
        today = today or datetime.now(timezone.utc).date().isoformat()
        for row in rows:
            date.fromisoformat(row['date'])
            if row['status'] == 'past' and (not row.get('academic_year') or row['date'] > today):
                raise ValueError(f"Invalid past session: {row['id']}")
    def prose(obj):
        if isinstance(obj, dict):
            if set(obj) == {'es', 'en'} and any(re.search('[“”‘’]', str(v)) for v in obj.values()):
                raise ValueError(f'{name}: use straight quotes in bilingual prose')
            for v in obj.values(): prose(v)
        elif isinstance(obj, list):
            for v in obj: prose(v)
    prose(data)
    return data


def load_content(root=ROOT):
    root = Path(root)
    content = root / "content"
    result = {}
    for name in ('people', 'people-extra', 'research', 'publications', 'journal-club', 'outreach'):
        result[name] = validate(name, read_json(content / f'{name}.json'))
    result['translations'] = read_json(content / 'translations.en.json')
    for text in result['translations'].values():
        if not isinstance(text, str) or not text or re.search('[“”‘’]', text):
            raise ValueError('Invalid English translation')
    for person in result['people']:
        if person.get('photo'):
            path = (root / person['photo']).resolve()
            if not path.is_relative_to(root) or not path.is_file():
                raise ValueError(f'Missing or invalid photo: {person["photo"]}')
    return result


def variants(person):
    words = fold(person['display_name_normalized']).split()
    return [s for s in dict.fromkeys([*([' '.join(words[-1:]), ' '.join(words[-2:])] if words else []), fold(person['display_name_normalized'])]) if len(s) >= 4]


def matches(person, pub):
    return any(v in fold(author) for v in variants(person) for author in pub['authors'])


def sort_publications(pubs):
    return sorted(pubs, key=lambda p: (p['year'], p.get('arxiv', '')), reverse=True)


if __name__ == '__main__':
    load_content()
    print('Content is valid.')
