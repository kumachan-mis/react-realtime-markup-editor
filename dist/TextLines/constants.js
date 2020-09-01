export const TextLinesConstants = {
    className: `React-Realtime-Markup-Editor-textlinesdiv`,
    line: {
        className: (lineIndex) => `React-Realtime-Markup-Editor-linediv-L${lineIndex}`,
        classNameRegex: /^React-Realtime-Markup-Editor-linediv-L(?<lineIndex>\d+)$/,
        indent: {
            dot: {
                style: {
                    top: "0.5em",
                    right: "0.75em",
                    position: "absolute",
                    display: "block",
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    backgroundColor: "#000000",
                },
            },
            pad: {
                style: {
                    display: "inline-block",
                    width: "1.5em",
                    overflow: "hidden",
                },
            },
            style: (indentDepth) => ({
                width: `${1.5 * indentDepth}em`,
                left: "0px",
                top: "0px",
                position: "absolute",
            }),
        },
        content: {
            section: {
                style: (fontSize, bold, italic, underline) => ({
                    lineHeight: fontSize !== undefined ? `${fontSize}px` : "inherit",
                    fontSize: fontSize !== undefined ? `${fontSize}px` : "inherit",
                    fontWeight: bold ? "bold" : "normal",
                    fontStyle: italic ? "italic" : "normal",
                    textDecoration: underline ? "underline" : "none",
                }),
            },
            style: (indentDepth) => ({
                marginLeft: `${1.5 * indentDepth}em`,
                display: "block",
            }),
        },
        style: (defaultFontSize) => ({
            lineHeight: `${defaultFontSize}px`,
            fontSize: `${defaultFontSize}px`,
            minHeight: `${defaultFontSize}px`,
            display: "block",
            position: "relative",
        }),
    },
    char: {
        className: (lineIndex, charIndex) => `React-Realtime-Markup-Editor-charspan-L${lineIndex}C${charIndex}`,
        classNameRegex: /^React-Realtime-Markup-Editor-charspan-L(?<lineIndex>\d+)C(?<charIndex>\d+)$/,
    },
    syntaxRegex: {
        indent: /^(?<indent>[ ]*)(?<content>([^ ].*)?)$/,
        bracket: /\[(?<option>([*/_]+\s)?)(?<body>[^\]]*[^\s\]][^\]]*)\]/g,
    },
    style: {
        whiteSpace: "pre-wrap",
        wordWrap: "break-word",
        height: "100%",
        overflowY: "scroll",
    },
};
