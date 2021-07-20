# react-realtime-markup-editor

A text document editor which is syntactically formattable in real time  
Inspired by [Scrapbox](https://scrapbox.io/product)

## TL;DR

### Installation

```sh
npm install katex
npm install react-realtime-markup-editor
```

or

```sh
yarn add katex
yarn add react-realtime-markup-editor
```

### Simplest Usage

```tsx
import { Editor } from 'react-realtime-markup-editor';
import 'katex/dist/katex.min.css';

const App: React.FC = () => {
  const [text, setText] = React.useState('');
  return <Editor text={text} onChangeText={setText} />;
};
```

## Demo

[demo](https://kumachan-mis.github.io/react-realtime-markup-editor) on github pages

## Formatting Syntax

### Itemizations

#### bracket-based syntax

| style         | syntax  |
| ------------- | ------- |
| <li>item</li> | `␣item` |

#### markdown-like syntax

| style         | syntax  |
| ------------- | ------- |
| <li>item</li> | `-item` |
| <li>item</li> | `*item` |

**Note**  
Multiple spaces will provide nested itemizations.

### Text Decorations

#### bracket-based syntax

| style            | syntax          |
| ---------------- | --------------- |
| <b>bold</b>      | `[* bold]`      |
| <h3>larger</h3>  | `[** larger]`   |
| <h2>largest</h2> | `[*** largest]` |
| <i>italic</i>    | `[/ italic]`    |
| <u>underline</u> | `[_ underline]` |

**Note**  
Combinations of `*`, `/` and `_` are available.  
Here are some examples:

| style                          | syntax                                             |
| ------------------------------ | -------------------------------------------------- |
| <b><i>bold italic</i></b>      | `[*/ bold italic]` or `[/* bold italic]`           |
| <b><u>bold underline</u></b>   | `[*_ bold underline]` or `[_* bold underline]`     |
| <i><u>italic underline</u></i> | `[/_ italic underline]` or `[_/ italic underline]` |

#### markdown-like syntax

| style            | syntax      |
| ---------------- | ----------- |
| <b>bold</b>      | `*bold*`    |
| <h3>larger</h3>  | `## larger` |
| <h2>largest</h2> | `# largest` |
| <i>italic</i>    | `_italic_`  |

**Note**  
Combinations of `*` and `_` are NOT available yet...

### Links

| style                   | syntax               |
| ----------------------- | -------------------- |
| <a>blacket link</a>     | `[blacket link]`     |
| <a>tag: tagged link</a> | `[tag: tagged link]` |
| <a>#hash-tag</a>        | `#hash-tag`          |

**Note**
A space(`␣`) in a hashtag name will get converted to an underscore(`_`).

### Code Strings

#### inline code string

- style  
  `inline code string`
- syntax  
  `` `inline code string` ``

#### block code string

- style
  ```
  block code string
  ```
- syntax
  ````
  ```
  block code string
  ```
  ````

### Math Formulas

### inline math formula

- style  
  ![inline-mode](figures/inline-mode.png)
- syntax  
  `$\int_a^b f(x) \mathrm{d}x$`

### display math formula

- style  
  ![display-mode](figures/display-mode.png)
- syntax  
  `$$\int_a^b f(x) \mathrm{d}x$$`

### block math formula

- style  
  ![block-mode](figures/block-mode.png)
- syntax
  ```
  $$
  A =
  \left(
  \begin{matrix}
    a_{11} & a_{12} & \cdots & a_{1n} \\
    a_{21} & a_{22} & \cdots & a_{2n} \\
    \vdots & \vdots & \ddots & \vdots \\
    a_{m1} & a_{m2} & \cdots & a_{mn} \\
  \end{matrix}
  \right)
  $$
  ```

### Quatations

- style
  > quotation
- syntax  
  `>quotation`

**Note**

1. Tagged links are useful when you want to make some link groups  
   Here are some examples:

- Can make `[github: @user_name/repository_name]` go to

```html
<a href="https://github.com/user_name/repository_name"> @user_name/repository_name </a>
```

- Can make `[npm: package_name]` go to

```html
<a href="https://www.npmjs.com/package/package_name"> package_name </a>
```

2. Can show input suggestions of links  
   For example, you can provide users with webpage list which may be refered from the document

## Public API

| name                 | type                                     | requried/optional | default                                   | description                                                                                                         |
| -------------------- | ---------------------------------------- | ----------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `text`               | `string`                                 | requried          | -                                         | syntactic text in `Editor`<br>you will use this like<br>`text={this.state.text}`                                    |
| `onChangeText`       | `(text: string) => void`                 | requried          | -                                         | callback function on `text` changed<br>you will use this like<br>`onChangeText={(text) => this.setState({ text })}` |
| `decoration`         | `Decoration`                             | optional          | see [Decoration](#Decoration)             | settings of decorations<br>details: [Decoration](#Decoration)                                                       |
| `bracketLinkProps`   | `BracketLinkProps`                       | optional          | see [BracketLinkProps](#BracketLinkProps) | settings of bracket links<br>details: [BracketLinkProps](#BracketLinkProps)                                         |
| `hashTagProps`       | `HashTagProps`                           | optional          | see [HashTagProps](#HashTagProps)         | settings of hash tags<br>details: [BracketLinkProps](#HashTagProps)                                                 |
| `taggedLinkPropsMap` | `{ [tagName: string]: TaggedLinkProps }` | optional          | see [TaggedLinkProps](#TaggedLinkProps)   | key-value object which maps a tag name to settings of tagged links<br>details: [TaggedLinkProps](#TaggedLinkProps)  |
| `codeProps`          | `CodeProps`                              | optional          | see [CodeProps](#CodeProps)               | settings of code strings<br>details: [CodeProps](#CodeProps)                                                        |
| `formulaProps`       | `FormulaProps`                           | optional          | see [FormulaProps](#FormulaProps)         | settings of math formulas<br>details: [FormulaProps](#FormulaProps)                                                 |
| `readonly`           | `boolean`                                | optional          | `undefined` (falsy)                       | if `true`, make `text` uneditable                                                                                   |
| `style`              | `CSSProperties`                          | optional          | `undefined`                               | style of `Editor`                                                                                                   |

### Decoration

settings of decorations

```ts
interface Decoration {
  text?: TextDecoration;
  suggestionList?: SuggestionListDecoration;
}
```

#### Decoration.text: TextDecoration

settings of text decorations (optional)

```ts
interface TextDecoration {
  fontSizes: {
    level1: number;
    level2: number;
    level3: number;
  };
}
```

**Attributes**

- fontSizes
  - level1: font size \[px\] of normal-sized text
  - level2: font size \[px\] of larger-sized text  
    c.f. `[** larger]`
  - level3: font size \[px\] of largest-sized text  
    c.f. `[*** largest]`

**Default**

```ts
const defaultTextDecoration: TextDecoration = {
  fontSizes: {
    level1: 16,
    level2: 20,
    level3: 24,
  },
};
```

you can import `defaultTextDecoration` by adding

```ts
import { defaultTextDecoration } from 'react-realtime-markup-editor';
```

#### Decoration.suggestionList: SuggestionListDecoration

settings of link suggestion list (optional)

```ts
interface SuggestionListDecoration {
  width: number;
  maxHeight: number;
  fontSize: number;
}
```

**Attributes**

- width: width \[px\] of suggestion list
- maxHeight: maximum height \[px\] of suggestion list  
  If many suggestions are provided, the list will be scrollable
- fontSize: font size \[px\] of suggestions

**Default**

```ts
const defaultSuggestionListDecoration: SuggestionListDecoration = {
  width: 250,
  maxHeight: 100,
  fontSize: 14,
};
```

you can import `defaultSuggestionListDecoration` by adding

```ts
import { defaultSuggestionListDecoration } from 'react-realtime-markup-editor';
```

### BracketLinkProps

settings of bracket links

```ts
interface BracketLinkProps {
  anchorProps?: (linkName: string) => React.ComponentProps<'a'> & { overriddenStyleOnHover?: React.CSSProperties };
  suggestions?: string[];
  initialSuggestionIndex?: number;
  disabled?: boolean;
}
```

**Attributes**

- anchorProps: given `linkName`, this function returns props of `<a>` tag and overridden style on hover  
  default: `(linkName: string) => ({ style: defaultLinkStyle, overriddenStyleOnHover: defaultLinkOverriddenStyleOnHover })`
- suggestions: input suggestions of bracket links  
  default: `[]`
- initialSuggestionIndex: index of focusd suggestion when showing the suggestion list  
  default: `0`
- disabled: if `true`, syntax of bracket links is ignored  
  default: `undefined` (falsy)

**Default**

```ts
const defaultLinkStyle: React.CSSProperties = {
  color: '#5E8AF7',
  cursor: 'text',
};

const defaultLinkOverriddenStyleOnHover: React.CSSProperties = {
  color: '#425A9D',
  cursor: 'pointer',
};
```

you can import `defaultLinkStyle` or `defaultLinkOverriddenStyleOnHover` by adding

```ts
import { defaultLinkStyle } from 'react-realtime-markup-editor';
```

or

```ts
import { defaultLinkOverriddenStyleOnHover } from 'react-realtime-markup-editor';
```

### HashTagProps

settings of hash tags

```ts
interface HashTagProps {
  anchorProps?: (hashTagName: string) => React.ComponentProps<'a'> & { overriddenStyleOnHover?: React.CSSProperties };
  suggestions?: string[];
  initialSuggestionIndex?: number;
  disabled?: boolean;
}
```

same as `BracketLinkProps`

### TaggedLinkProps

settings of tagged links

```ts
interface TaggedLinkProps {
  linkNameRegex?: RegExp;
  anchorProps?: (linkName: string) => React.ComponentProps<'a'> & { overriddenStyleOnHover?: React.CSSProperties };
  suggestions?: string[];
  initialSuggestionIndex?: number;
  tagHidden?: boolean;
}
```

same as `BracketLinkProps` except `linkNameRegex` and `tagHidden`  
`disabled` property doesn't exist since you don't define a tag if you don't need it

**Attributes**

- linkNameRegex: regular expression of link names. This **MUST** be a subset of `defaultLinkNameRegex = /[^[\]]+/`  
  If `tagged link` does not match the pattern, `[tag: tagged link]` will be a BRACKET LINK whose name is `tag: tagged link`  
  default: `defaultLinkNameRegex`
- tagHidden: if `true`, `[tag: tagged link]` goes to `<a>tagged link</a>` instead of `<a>tag: tagged link</a>`

**Default**

```ts
const defaultLinkNameRegex = /[^[\]]+/;
```

you can import `defaultLinkNameRegex` by adding

```ts
import { defaultLinkNameRegex } from 'react-realtime-markup-editor';
```

### CodeProps

settings of code strings

```ts
interface CodeProps {
  codeProps?: (code: string) => React.ComponentProps<'code'>;
  disabled?: boolean;
}
```

**Attributes**

- codeProps: given `code`, this function returns props of `<code>` tag  
  default: `(code: string) => ({ style: defaultCodeStyle })`
- disabled: if `true`, syntax of code strings is ignored  
  default: `undefined` (falsy)

**Default**

```ts
const defaultCodeStyle: React.CSSProperties = {
  fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
  backgroundColor: 'rgba(27, 31, 35, 0.05)',
};
```

you can import `defaultCodeStyle` by adding

```ts
import { defaultCodeStyle } from 'react-realtime-markup-editor';
```

### FormulaProps

settings of math formulas

```ts
interface FormulaProps {
  spanProps?: (formula: string) => React.ComponentProps<'span'>;
  disabled?: boolean;
}
```

**Attributes**

- spanProps: given `formula`, this function returns props of `<formula>` tag  
  default: `(formula: string) => ({ style: defaultFormulaStyle })`
- disabled: if `true`, syntax of math formulas is ignored  
  default: `undefined` (falsy)

**Default**

```ts
const defaultFormulaStyle: React.CSSProperties = {
  fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
  backgroundColor: 'rgba(27, 31, 35, 0.05)',
};
```

you can import `defaultFormulaStyle` by adding

```ts
import { defaultFormulaStyle } from 'react-realtime-markup-editor';
```
