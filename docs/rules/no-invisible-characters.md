# no-invisible-characters

📝 Disallow invisible characters in strings, keys, and comments.

💼 This rule is enabled in the following [configs](https://github.com/soml-lang/eslint-soml#preset-configs): ✅ `recommended`, ☑️ `unopinionated`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

SOML rejects invisible characters outside strings, because characters you cannot see should not change your config. Inside strings and comments, most of them are allowed. This rule reports them there too, so that a no-break space that looks like a space, or a bidirectional control that reorders the text you see ([Trojan Source](https://trojansource.codes)), cannot hide in a file.

It reports these characters in strings, quoted keys, and comments:

- Bidirectional controls, such as U+202E RIGHT-TO-LEFT OVERRIDE.
- Zero-width characters: U+200B ZERO WIDTH SPACE, U+2060 WORD JOINER, U+2061 to U+2064, the invisible math operators, and U+FEFF.
- The Hangul fillers U+115F, U+1160, U+3164, and U+FFA0, which show as blank.
- Other invisible format characters: U+180E MONGOLIAN VOWEL SEPARATOR and U+206A to U+206F.
- Tag characters, which can hide text, as in ASCII smuggling. In an emoji tag sequence, such as the flag of Scotland, they are allowed.
- U+00AD SOFT HYPHEN.
- C1 control characters, such as U+0085 NEXT LINE. The other control characters are already parse errors.
- Every Unicode whitespace character except space, tab, and line feed, such as U+00A0 NO-BREAK SPACE and U+2028 LINE SEPARATOR.
- A tab in a single-line string or a quoted key, where it looks like spaces, as in a separator that is one tab. In a block string and a comment, a tab is allowed, because it indents.

U+200C ZERO WIDTH NON-JOINER and U+200D ZERO WIDTH JOINER are allowed, because emoji sequences and several scripts need them.

The autofix writes the character as a `\u{…}` escape, or a tab as `\t`, which keeps the value. A `'...'` string becomes a `"..."` string for that, because only `"..."` has escapes. A `'''` block string and a comment cannot hold an escape, so they are only reported, and the message asks to remove the character, or for a block string, to move the text to a `"..."` string.

## Examples

```soml
# ❌ (a no-break space between the words)
name: 'Ada Lovelace'

# ✅
name: "Ada\u{a0}Lovelace"
```

```soml
# ❌ (a zero-width space after `api`)
host: "api​.example.com"

# ✅ When it is there on purpose.
host: "api\u{200b}.example.com"

# ✅ When it is an accident, delete it.
host: "api.example.com"
```
