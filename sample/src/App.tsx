import * as React from 'react';

import { Editor, defaultLinkStyle, defaultLinkOverriddenStyleOnHover } from '../../src';

// prettier-ignore
const defaultBracketText =
`[*** React Realtime Markup Editor]
A text document editor which is syntactically formattable in real time
[/ bracket-based syntax]

[** Itemizations]
 You can use itemizations
 by just typing a space
 like this
  You can also use nested itemizations
  by just typing multiple spaces
  like this

[** Shortcut commands]
 select all
 cut
 copy
 paste
 undo
 redo
 move up
 move down
 move left
 move right
 move to word top
 move to word bottom
 move to line top
 move to line bottom
 move to text top
 move to text bottom

[** Text decorations]
 [* bold]
 [/ italic]
 [_ underline]

You can combine these text decorations
 [*/ bold italic]
 [*_ bold underline]
and so on

[** Links]
 bracket-link
  [react-realtime-markup-editor]
 hash-tag-link
  #react-realtime-markup-editor
 tagged-link
  [github: @kumachan-mis/react-realtime-markup-editor]
  [npm: react-realtime-markup-editor]

[** Code strings]
 inline mode
  \`import { Editor } from 'react-realtime-markup-editor'\`
 block mode
  \`\`\`
  import { Editor } from 'react-realtime-markup-editor';
  const App: React.FC = () => {
    const [text, setText] = React.useState('');
    return <Editor text={text} onChangeText={setText} />;
  };
  // note: code block is not a bulleted item
  \`\`\`

[** Math formulas]
 inline mode
  $f(x)$
 display mode
  $$\\int_a^b f(x) \\mathrm{d}x$$
 block mode
  $$
  A =
  \\left(
  \\begin{matrix}
    a_{11} & a_{12} & \\cdots & a_{1n} \\\\
    a_{21} & a_{22} & \\cdots & a_{2n} \\\\
    \\vdots & \\vdots & \\ddots & \\vdots \\\\
    a_{m1} & a_{m2} & \\cdots & a_{mn} \\\\
  \\end{matrix}
  \\right)
  $$

[** Quatations]
>Genius is one percent inspiration and ninety-nine percent perspiration
>by Thomas Edison`;

// prettier-ignore
const defaultMarkdownText =
`# React Realtime Markup Editor
A text document editor which is syntactically formattable in real time
_markdown-like syntax_

## Itemizations
-You can use itemizations
-by just typing a \`-\` or \`*\`
-like this
 -You can also use nested itemizations
 -by just typing spaces
 -like this

## Shortcut commands
-select all
-cut
-copy
-paste
-undo
-redo
-move up
-move down
-move left
-move right
-move to word top
-move to word bottom
-move to line top
-move to line bottom
-move to text top
-move to text bottom

## Text decorations
-*bold*
-_italic_

combination of text decorations is not supported yet

## Links
-bracket-link
 -[react-realtime-markup-editor]
-hash-tag-link
 -#react-realtime-markup-editor
-tagged-link
 -[github: @kumachan-mis/react-realtime-markup-editor]
 -[npm: react-realtime-markup-editor]

## Code strings
-inline mode
 -\`import { Editor } from 'react-realtime-markup-editor'\`
-block mode
  \`\`\`
  import { Editor } from 'react-realtime-markup-editor';
  const App: React.FC = () => {
    const [text, setText] = React.useState('');
    return <Editor text={text} onChangeText={setText} />;
  };
  // note: code block is not a bulleted item
  \`\`\`

## Math formulas
-inline mode
 -$f(x)$
-display mode
 -$$\\int_a^b f(x) \\mathrm{d}x$$
-block mode
  $$
  A =
  \\left(
  \\begin{matrix}
    a_{11} & a_{12} & \\cdots & a_{1n} \\\\
    a_{21} & a_{22} & \\cdots & a_{2n} \\\\
    \\vdots & \\vdots & \\ddots & \\vdots \\\\
    a_{m1} & a_{m2} & \\cdots & a_{mn} \\\\
  \\end{matrix}
  \\right)
  $$

## Quatations
>Genius is one percent inspiration and ninety-nine percent perspiration
>by Thomas Edison`;

const style: React.CSSProperties = {
  width: 'calc(48vw - 60px)',
  height: 'calc(96vh - 60px)',
  margin: '20px',
  border: 'solid 1px',
  padding: '10px',
  display: 'inline-block',
};

export const App: React.FC = () => {
  const [bracketText, setBracketText] = React.useState(defaultBracketText);
  const [markdownText, setMarkdownText] = React.useState(defaultMarkdownText);

  return (
    <>
      {(
        [
          [bracketText, setBracketText, 'bracket'],
          [markdownText, setMarkdownText, 'markdown'],
        ] as [string, React.Dispatch<React.SetStateAction<string>>, 'bracket' | 'markdown'][]
      ).map(([text, setText, syntax]) => (
        <Editor
          key={syntax}
          text={text}
          onChangeText={setText}
          syntax={syntax}
          bracketLinkProps={{
            anchorProps: (linkName) => ({
              href: `https://www.npmjs.com/package/${linkName}`,
              style: defaultLinkStyle,
              overriddenStyleOnHover: defaultLinkOverriddenStyleOnHover,
            }),
          }}
          hashTagProps={{
            anchorProps: (hashTagName) => ({
              href: `https://www.npmjs.com/package/${hashTagName}`,
              style: defaultLinkStyle,
              overriddenStyleOnHover: defaultLinkOverriddenStyleOnHover,
            }),
            suggestions: ['react-realtime-markup-editor'],
          }}
          taggedLinkPropsMap={{
            github: {
              linkNameRegex: /@[^[\]]+\/[^[\]]+/,
              anchorProps: (linkName) => ({
                href: `https://github.com/${linkName.substring(1)}`,
                style: { ...defaultLinkStyle, color: '#595f6E', borderBottom: 'solid 1px' },
                overriddenStyleOnHover: {
                  ...defaultLinkOverriddenStyleOnHover,
                  color: '#08090B',
                  fontWeight: 500,
                },
              }),
              suggestions: ['@kumachan-mis/react-realtime-markup-editor'],
            },
            npm: {
              anchorProps: (linkName) => ({
                href: `https://www.npmjs.com/package/${linkName}`,
                style: { ...defaultLinkStyle, color: '#F75E8A', borderBottom: 'solid 1px' },
                overriddenStyleOnHover: {
                  ...defaultLinkOverriddenStyleOnHover,
                  color: '#E14978',
                  fontWeight: 500,
                },
              }),
              suggestions: ['react-realtime-markup-editor'],
            },
          }}
          style={style}
        />
      ))}
    </>
  );
};
