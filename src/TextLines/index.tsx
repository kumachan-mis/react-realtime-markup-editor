import * as React from 'react';

import { Props, NodeProps, TaggedLinkPropsMap } from './types';
import {
  TextLinesConstants,
  defaultTextDecoration,
  defaultLinkStyle,
  defaultLinkOverriddenStyleOnHover,
  defaultCodeStyle,
  defaultFormulaStyle,
} from './constants';
import {
  LineGroup,
  LineGroupIndent,
  LineGroupContent,
  Line,
  LineIndent,
  LineContent,
  CharGroup,
  Char,
  AnchorWithHoverStyle,
} from './components';
import { parseText, getHashTagName, getTagName } from './parser';
import { ParsingOptions } from './parser/types';
import { BracketLinkProps, HashTagProps, CodeProps, FormulaProps } from '../Editor/types';
import { KaTeX } from '../KaTeX';

export const TextLines: React.FC<Props> = ({
  text,
  syntax = 'bracket',
  cursorCoordinate,
  textDecoration = defaultTextDecoration,
  bracketLinkProps = {
    anchorProps: () => ({
      style: defaultLinkStyle,
      overriddenStyleOnHover: defaultLinkOverriddenStyleOnHover,
    }),
  } as BracketLinkProps,
  hashTagProps = {
    anchorProps: () => ({
      style: defaultLinkStyle,
      overriddenStyleOnHover: defaultLinkOverriddenStyleOnHover,
    }),
  } as HashTagProps,
  taggedLinkPropsMap = {
    // empty object
  } as TaggedLinkPropsMap,
  codeProps = {
    codeProps: () => ({ style: defaultCodeStyle }),
  } as CodeProps,
  formulaProps = {
    spanProps: () => ({ style: defaultFormulaStyle }),
  } as FormulaProps,
  style,
}) => {
  const options: ParsingOptions = {
    decoration: textDecoration,
    taggedLinkRegexes: Object.entries(taggedLinkPropsMap).map(([tagName, linkProps]) =>
      TextLinesConstants.regexes.common.taggedLink(tagName, linkProps.linkNameRegex)
    ),
    disabledMap: {
      bracketLink: bracketLinkProps.disabled,
      hashTag: hashTagProps.disabled,
      code: codeProps.disabled,
      formula: formulaProps.disabled,
    },
    syntax,
  };
  const nodes = parseText(text, options);

  return (
    <div className={TextLinesConstants.className} style={style}>
      {nodes.map((node, index) => (
        <Node
          key={index}
          node={node}
          textDecoration={textDecoration}
          bracketLinkProps={bracketLinkProps}
          hashTagProps={hashTagProps}
          taggedLinkPropsMap={taggedLinkPropsMap}
          codeProps={codeProps}
          formulaProps={formulaProps}
          curcorLineIndex={cursorCoordinate?.lineIndex}
        />
      ))}
    </div>
  );
};

const Node: React.FC<NodeProps> = ({
  node,
  textDecoration,
  bracketLinkProps,
  hashTagProps,
  taggedLinkPropsMap,
  codeProps,
  formulaProps,
  curcorLineIndex,
}) => {
  switch (node.type) {
    case 'blockCode': {
      const { facingMeta, children, trailingMeta } = node;
      return (
        <>
          <Node
            node={facingMeta}
            textDecoration={textDecoration}
            bracketLinkProps={bracketLinkProps}
            hashTagProps={hashTagProps}
            taggedLinkPropsMap={taggedLinkPropsMap}
            codeProps={codeProps}
            formulaProps={formulaProps}
            curcorLineIndex={curcorLineIndex}
          />
          {children.map((child, index) => (
            <Node
              key={index}
              node={child}
              textDecoration={textDecoration}
              bracketLinkProps={bracketLinkProps}
              hashTagProps={hashTagProps}
              taggedLinkPropsMap={taggedLinkPropsMap}
              codeProps={codeProps}
              formulaProps={formulaProps}
              curcorLineIndex={curcorLineIndex}
            />
          ))}
          {trailingMeta && (
            <Node
              node={trailingMeta}
              textDecoration={textDecoration}
              bracketLinkProps={bracketLinkProps}
              hashTagProps={hashTagProps}
              taggedLinkPropsMap={taggedLinkPropsMap}
              codeProps={codeProps}
              formulaProps={formulaProps}
              curcorLineIndex={curcorLineIndex}
            />
          )}
        </>
      );
    }
    case 'blockCodeMeta':
    case 'blockCodeLine': {
      const { lineIndex, indentDepth } = node;
      const code = node.type == 'blockCodeMeta' ? node.codeMeta : node.codeLine;
      const codeElementProps = codeProps.codeProps?.(code);

      return (
        <Line lineIndex={lineIndex} defaultFontSize={textDecoration.fontSizes.level1}>
          <LineIndent lineIndex={lineIndex} indentDepth={indentDepth} />
          <LineContent
            lineIndex={lineIndex}
            indentDepth={indentDepth}
            contentLength={code.length}
            spanProps={{ style: codeElementProps?.style }}
          >
            <code {...codeElementProps}>
              {[...code].map((char, index) => (
                <Char key={indentDepth + index} lineIndex={lineIndex} charIndex={indentDepth + index}>
                  {char}
                </Char>
              ))}
            </code>
          </LineContent>
        </Line>
      );
    }
    case 'blockFormula': {
      const { facingMeta, children, trailingMeta } = node;
      const [from, to] = node.range;
      const formula = children.map((child) => child.formulaLine).join('\n');
      const cursorOn = curcorLineIndex !== undefined && from <= curcorLineIndex && curcorLineIndex <= to;
      const spanElementProps = formulaProps.spanProps?.(formula);

      return !cursorOn && !/^\s*$/.test(formula) ? (
        <LineGroup
          fromLineIndex={from + 1}
          toLineIndex={trailingMeta ? to - 1 : to}
          divProps={{ onMouseDown: (event) => event.nativeEvent.stopImmediatePropagation() }}
        >
          <LineGroupIndent indentDepth={facingMeta.indentDepth} />
          <LineGroupContent indentDepth={facingMeta.indentDepth} spanProps={{ style: spanElementProps?.style }}>
            <KaTeX options={{ throwOnError: false, displayMode: true }}>{formula}</KaTeX>
          </LineGroupContent>
        </LineGroup>
      ) : (
        <>
          <Node
            node={facingMeta}
            textDecoration={textDecoration}
            bracketLinkProps={bracketLinkProps}
            hashTagProps={hashTagProps}
            taggedLinkPropsMap={taggedLinkPropsMap}
            codeProps={codeProps}
            formulaProps={formulaProps}
            curcorLineIndex={curcorLineIndex}
          />
          {children.map((child, index) => (
            <Node
              key={index}
              node={child}
              textDecoration={textDecoration}
              bracketLinkProps={bracketLinkProps}
              hashTagProps={hashTagProps}
              taggedLinkPropsMap={taggedLinkPropsMap}
              codeProps={codeProps}
              formulaProps={formulaProps}
              curcorLineIndex={curcorLineIndex}
            />
          ))}
          {trailingMeta && (
            <Node
              node={trailingMeta}
              textDecoration={textDecoration}
              bracketLinkProps={bracketLinkProps}
              hashTagProps={hashTagProps}
              taggedLinkPropsMap={taggedLinkPropsMap}
              codeProps={codeProps}
              formulaProps={formulaProps}
              curcorLineIndex={curcorLineIndex}
            />
          )}
        </>
      );
    }
    case 'blockFormulaMeta':
    case 'blockFormulaLine': {
      const { lineIndex, indentDepth } = node;
      const formula = node.type == 'blockFormulaMeta' ? node.formulaMeta : node.formulaLine;
      const spanElementProps = formulaProps.spanProps?.(formula);

      return (
        <Line lineIndex={lineIndex} defaultFontSize={textDecoration.fontSizes.level1}>
          <LineIndent lineIndex={lineIndex} indentDepth={indentDepth} />
          <LineContent
            lineIndex={lineIndex}
            indentDepth={indentDepth}
            contentLength={formula.length}
            spanProps={{ style: spanElementProps?.style }}
          >
            {[...formula].map((char, index) => (
              <Char key={indentDepth + index} lineIndex={lineIndex} charIndex={indentDepth + index}>
                {char}
              </Char>
            ))}
          </LineContent>
        </Line>
      );
    }
    case 'quotation': {
      const { lineIndex, indentDepth, contentLength, meta, children } = node;
      const cursorOn = curcorLineIndex == lineIndex;

      return (
        <Line lineIndex={lineIndex} defaultFontSize={textDecoration.fontSizes.level1}>
          <LineIndent lineIndex={lineIndex} indentDepth={indentDepth} />
          <LineContent
            lineIndex={lineIndex}
            indentDepth={indentDepth}
            contentLength={meta.length + contentLength}
            spanProps={{ style: TextLinesConstants.quotation.content.style }}
          >
            {[...meta].map((char, index) => (
              <Char key={indentDepth + index} lineIndex={lineIndex} charIndex={indentDepth + index}>
                {cursorOn ? char : '\u200b'}
              </Char>
            ))}
            {children.map((child, index) => (
              <Node
                key={index}
                node={child}
                textDecoration={textDecoration}
                bracketLinkProps={bracketLinkProps}
                hashTagProps={hashTagProps}
                taggedLinkPropsMap={taggedLinkPropsMap}
                codeProps={codeProps}
                formulaProps={formulaProps}
                curcorLineIndex={curcorLineIndex}
              />
            ))}
          </LineContent>
        </Line>
      );
    }
    case 'itemization': {
      const { lineIndex, indentDepth, contentLength, children } = node;

      return (
        <Line lineIndex={lineIndex} defaultFontSize={textDecoration.fontSizes.level1}>
          <LineIndent lineIndex={lineIndex} indentDepth={indentDepth + 1}>
            <span className={TextLinesConstants.itemization.bullet.className} />
          </LineIndent>
          <LineContent lineIndex={lineIndex} indentDepth={indentDepth + 1} contentLength={contentLength}>
            {children.map((child, index) => (
              <Node
                key={index}
                node={child}
                textDecoration={textDecoration}
                bracketLinkProps={bracketLinkProps}
                hashTagProps={hashTagProps}
                taggedLinkPropsMap={taggedLinkPropsMap}
                codeProps={codeProps}
                formulaProps={formulaProps}
                curcorLineIndex={curcorLineIndex}
              />
            ))}
          </LineContent>
        </Line>
      );
    }
    case 'normalLine': {
      const { lineIndex, contentLength, children } = node;

      return (
        <Line lineIndex={lineIndex} defaultFontSize={textDecoration.fontSizes.level1}>
          <LineContent lineIndex={lineIndex} indentDepth={0} contentLength={contentLength}>
            {children.map((child, index) => (
              <Node
                key={index}
                node={child}
                textDecoration={textDecoration}
                bracketLinkProps={bracketLinkProps}
                hashTagProps={hashTagProps}
                taggedLinkPropsMap={taggedLinkPropsMap}
                codeProps={codeProps}
                formulaProps={formulaProps}
                curcorLineIndex={curcorLineIndex}
              />
            ))}
          </LineContent>
        </Line>
      );
    }
    case 'inlineCode': {
      const { lineIndex, facingMeta, code, trailingMeta } = node;
      const [from, to] = node.range;
      const cursorOn = curcorLineIndex == lineIndex;
      const codeElementProps = codeProps.codeProps?.(code);

      return (
        <code {...codeElementProps}>
          {[...facingMeta].map((char, index) => (
            <Char key={from + index} lineIndex={lineIndex} charIndex={from + index}>
              {cursorOn ? char : '\u200b'}
            </Char>
          ))}
          {[...code].map((char, index) => (
            <Char
              key={from + facingMeta.length + index}
              lineIndex={lineIndex}
              charIndex={from + facingMeta.length + index}
            >
              {char}
            </Char>
          ))}
          {[...trailingMeta].map((char, index) => (
            <Char
              key={to - trailingMeta.length + index}
              lineIndex={lineIndex}
              charIndex={to - trailingMeta.length + index}
            >
              {cursorOn ? char : '\u200b'}
            </Char>
          ))}
        </code>
      );
    }
    case 'displayFormula':
    case 'inlineFormula': {
      const { lineIndex, facingMeta, formula, trailingMeta } = node;
      const [from, to] = node.range;
      const cursorOn = curcorLineIndex == lineIndex;
      const spanElementProps = formulaProps.spanProps?.(formula);
      const displayMode = node.type == 'displayFormula';

      return !cursorOn ? (
        <CharGroup
          lineIndex={lineIndex}
          fromCharIndex={from + facingMeta.length}
          toCharIndex={to - trailingMeta.length}
          spanProps={{
            onMouseDown: (event) => event.nativeEvent.stopImmediatePropagation(),
            style: spanElementProps?.style,
          }}
        >
          <KaTeX options={{ throwOnError: false, displayMode }}>{formula}</KaTeX>
        </CharGroup>
      ) : (
        <span style={spanElementProps?.style}>
          {[...facingMeta, ...formula, ...trailingMeta].map((char, index) => (
            <Char key={from + index} lineIndex={lineIndex} charIndex={from + index}>
              {char}
            </Char>
          ))}
        </span>
      );
    }
    case 'decoration': {
      const { lineIndex, facingMeta, decoration, trailingMeta, children } = node;
      const [from, to] = node.range;
      const cursorOn = curcorLineIndex == lineIndex;

      return (
        <span style={TextLinesConstants.decoration.style(decoration)}>
          {[...facingMeta].map((char, index) => (
            <Char key={from + index} lineIndex={lineIndex} charIndex={from + index}>
              {cursorOn ? char : '\u200b'}
            </Char>
          ))}
          {children.map((child, index) => (
            <Node
              key={index}
              node={child}
              textDecoration={textDecoration}
              bracketLinkProps={bracketLinkProps}
              hashTagProps={hashTagProps}
              taggedLinkPropsMap={taggedLinkPropsMap}
              codeProps={codeProps}
              formulaProps={formulaProps}
              curcorLineIndex={curcorLineIndex}
            />
          ))}
          {[...trailingMeta].map((char, index) => (
            <Char
              key={to - trailingMeta.length + index}
              lineIndex={lineIndex}
              charIndex={to - trailingMeta.length + index}
            >
              {cursorOn ? char : '\u200b'}
            </Char>
          ))}
        </span>
      );
    }
    case 'taggedLink': {
      const { lineIndex, facingMeta, tag, linkName, trailingMeta } = node;
      const [from, to] = node.range;
      const cursorOn = curcorLineIndex == lineIndex;
      const taggedLinkProps = taggedLinkPropsMap[getTagName(tag)];
      const anchorElementProps = taggedLinkProps.anchorProps?.(linkName);

      return (
        <AnchorWithHoverStyle {...anchorElementProps} cursorOn={cursorOn}>
          {[...facingMeta].map((char, index) => (
            <Char key={from + index} lineIndex={lineIndex} charIndex={from + index}>
              {cursorOn ? char : '\u200b'}
            </Char>
          ))}
          {[...tag].map((char, index) => (
            <Char
              key={from + facingMeta.length + index}
              lineIndex={lineIndex}
              charIndex={from + facingMeta.length + index}
            >
              {cursorOn || !taggedLinkProps.tagHidden ? char : '\u200b'}
            </Char>
          ))}
          {[...linkName].map((char, index) => (
            <Char
              key={from + facingMeta.length + tag.length + index}
              lineIndex={lineIndex}
              charIndex={from + facingMeta.length + tag.length + index}
            >
              {char}
            </Char>
          ))}
          {[...trailingMeta].map((char, index) => (
            <Char
              key={to - trailingMeta.length + index}
              lineIndex={lineIndex}
              charIndex={to - trailingMeta.length + index}
            >
              {cursorOn ? char : '\u200b'}
            </Char>
          ))}
        </AnchorWithHoverStyle>
      );
    }
    case 'bracketLink': {
      const { lineIndex, facingMeta, linkName, trailingMeta } = node;
      const [from, to] = node.range;
      const cursorOn = curcorLineIndex == lineIndex;
      const anchorElementProps = bracketLinkProps.anchorProps?.(linkName);

      return (
        <AnchorWithHoverStyle {...anchorElementProps} cursorOn={cursorOn}>
          {[...facingMeta].map((char, index) => (
            <Char key={from + index} lineIndex={lineIndex} charIndex={from + index}>
              {cursorOn ? char : '\u200b'}
            </Char>
          ))}
          {[...linkName].map((char, index) => (
            <Char
              key={from + facingMeta.length + index}
              lineIndex={lineIndex}
              charIndex={from + facingMeta.length + index}
            >
              {char}
            </Char>
          ))}
          {[...trailingMeta].map((char, index) => (
            <Char
              key={to - trailingMeta.length + index}
              lineIndex={lineIndex}
              charIndex={to - trailingMeta.length + index}
            >
              {cursorOn ? char : '\u200b'}
            </Char>
          ))}
        </AnchorWithHoverStyle>
      );
    }
    case 'hashTag': {
      const { lineIndex, hashTag } = node;
      const [from] = node.range;
      const cursorOn = curcorLineIndex == lineIndex;
      const anchorElementProps = hashTagProps.anchorProps?.(getHashTagName(hashTag));

      return (
        <AnchorWithHoverStyle {...anchorElementProps} cursorOn={cursorOn}>
          {[...hashTag].map((char, index) => (
            <Char key={from + index} lineIndex={lineIndex} charIndex={from + index}>
              {char}
            </Char>
          ))}
        </AnchorWithHoverStyle>
      );
    }
    case 'normal': {
      const { lineIndex, text } = node;
      const [from] = node.range;

      return (
        <span>
          {[...text].map((char, index) => (
            <Char key={from + index} lineIndex={lineIndex} charIndex={from + index}>
              {char}
            </Char>
          ))}
        </span>
      );
    }
  }
};
