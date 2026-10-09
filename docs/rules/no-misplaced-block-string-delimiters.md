# no-misplaced-block-string-delimiters

📝 Disallow a block string delimiter at the end of a content line.

💼 This rule is enabled in the following [configs](https://github.com/soml-lang/eslint-soml#preset-configs): ✅ `recommended`, ☑️ `unopinionated`.

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

A block string ends only at a line that starts with its closing delimiter, after its indentation. TOML and Java allow the closing delimiter at the end of the last content line, but in SOML, `Welcome!'''` is content. The block string then goes on to the next line that starts with `'''`, which is often the end of a later block string, and every member between them becomes part of the text. The document can still parse, without an error.

This rule reports a content line that ends with a run of quotes as long as the delimiter, optionally followed by what may follow a closing delimiter: a comma, a closing bracket, or a comment, as in `Welcome!''' # greeting` or `Hi'''}`. It reports only the first such line in a block string, because the lines after it are content only because of it. A run that closes a quote opened earlier on the line, as in `Say '''hi'''`, is not reported. Neither is a run that starts with an escaped quote in a `"""` block, as in `He said \"""`, because it is shorter than the delimiter.

To end a content line with `'''` on purpose, use a longer delimiter, such as `''''`.

## Examples

```soml
# ❌
motd: '''
Welcome!'''
port: 8080
banner: '''
Bye
'''

# ✅
motd: '''
Welcome!
'''
port: 8080
banner: '''
Bye
'''
```

```soml
# ✅
code: ''''
x = '''
''''
```
