# Lexers and Unicode text

Lexers usually operate on character input, or more precisely on [code points](https://en.wikipedia.org/wiki/Code_point). The most simple form of them is a single letter, written as a string literal, e.g. `'a'`. For input beyond latin letters and numbers this is not enough: you need a different notation.

## Unicode Code Points in Lexer Grammars

To refer to such code points in lexer grammars, use the `\u` string escape plus up to 4 hex digits. For example, to create a lexer rule for a single Cyrillic character by creating a range from `U+0400` to `U+04FF`:

```antlr
CYRILLIC : '\u0400'..'\u04FF' ; // or [\u0400-\u04FF] without quotes
```

Unicode literals larger than U+FFFF must use the extended `\u{12345}` syntax. For example, to create a lexer rule for a selection of smiley faces from the [Emoticons Unicode block](http://www.unicode.org/charts/PDF/U1F600.pdf):

```antlr
EMOTICONS : ('\u{1F600}' | '\u{1F602}' | '\u{1F615}') ; // or [\u{1F600}\u{1F602}\u{1F615}]
```

The most powerful notation is Unicode character classes, which describe all code points with a specific property (like letters or numbers, white spaces or emojis and so on). Here's an example to describe a Unicode identifier:

```antlr
UnicodeIdentifier: [\p{ID_Start}][\p{ID_Continue}]*;
```

The introducer `\p` stands for (Unicode) `property`. There's a variant with a capital P to denote what the tilde does: do-not-match that character class, e.g. `[\P{binary_property=emoji}]` to match everything but emojis.

Unicode character classes are ranges themselves, so they can only be used on their own, not as part of another range and not outside of square brackets, which define character sets.

And there's even more: you can also use Unicode block names, which describe a range of code points that belong to a certain group, like a language script `[\p{block=sundanese}]` (see [Unicode block names in the Unicode Database](https://www.unicode.org/Public/UCD/latest/ucd/Blocks.txt).

Formally a Unicode character class selector is written as `\p{enum-name=enum-value}` where `enum-name` and `enum-value` are not case sensitive and dash and underscores are interchangable. You can take various shortcuts to ease notation, like using abbreviations for either entity or omit the enum name entirely. For example `ID_Start` from above can also written as `ids`, or use `emoji` for the full selector `"binary_property=emoji"`. But be careful with using a short form, as it can be part of multiple property enums. For example the property value `other` can be one of `general_category=other`, `grapheme_cluster_break=other`, `indic_syllabic_category=other`, `sentence_break=other` or `word_break=other`.

The list of possible Unicode properties is long and I recommend reading more about them in the [Unicode database](https://www.unicode.org/Public/UCD/latest/ucd/), but usually you only need classes like identifiers, whitespaces, numbers etc. which not only match latin letters but include all languages in the world.
