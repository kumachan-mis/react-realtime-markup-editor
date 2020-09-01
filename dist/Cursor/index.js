import * as React from "react";
import { CursorConstants } from "./constants";
import { cursorPropsToState, handleOnEditorScroll, cursorIn } from "./utils";
import { TextLinesConstants } from "../TextLines/constants";
export class Cursor extends React.Component {
    constructor(props) {
        super(props);
        this.state = { position: [0, 0], textAreaValue: "", cursorSize: 0 };
        this.root = null;
        this.textArea = null;
        this.handleOnEditorScroll = () => {
            /* do nothing */
        };
    }
    componentDidMount() {
        this.root = document.getElementById(TextLinesConstants.id);
    }
    componentDidUpdate(prevProps) {
        if (prevProps == this.props)
            return;
        const state = cursorPropsToState(this.props, this.state);
        if (state != this.state)
            this.setState(state);
        if (this.props.coordinate)
            this.textArea?.focus();
        if (this.root) {
            this.root.removeEventListener("scroll", this.handleOnEditorScroll);
            this.handleOnEditorScroll = () => {
                const state = handleOnEditorScroll(this.props, this.state);
                if (state != this.state)
                    this.setState(state);
            };
            this.root.addEventListener("scroll", this.handleOnEditorScroll);
        }
    }
    render() {
        const [top, left] = this.state.position;
        const { cursorSize } = this.state;
        const hidden = this.state.position === undefined || !cursorIn([top, left], cursorSize);
        const textLength = this.state.textAreaValue.length;
        return (React.createElement(React.Fragment, null,
            React.createElement("div", { style: CursorConstants.rootDiv.style(top, left, cursorSize, hidden) },
                React.createElement("svg", { width: CursorConstants.svg.width, height: cursorSize },
                    React.createElement("rect", { x: CursorConstants.rect.x, y: CursorConstants.rect.y, width: CursorConstants.rect.width, height: CursorConstants.rect.height }))),
            React.createElement("textarea", { value: this.state.textAreaValue, wrap: CursorConstants.textArea.wrap, spellCheck: CursorConstants.textArea.spellCheck, autoCapitalize: CursorConstants.textArea.autoCapitalize, onChange: (event) => this.setState({ textAreaValue: event.target.value }), onCompositionStart: () => this.props.onTextCompositionStart(), onCompositionEnd: () => {
                    this.props.onTextCompositionEnd(this.state.textAreaValue);
                    this.setState({ textAreaValue: "" });
                }, style: CursorConstants.textArea.style(top, left, cursorSize, textLength), ref: (textArea) => (this.textArea = textArea) })));
    }
}
