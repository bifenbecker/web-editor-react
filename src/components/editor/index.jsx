import React, { useState, useEffect, useRef } from "react";
import { EditorState, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser, Fragment } from "prosemirror-model";
import { schema as baseSchema, marks } from "prosemirror-schema-basic";
import { exampleSetup, buildMenuItems } from "prosemirror-example-setup";
import {
    addColumnAfter,
    addColumnBefore,
    deleteColumn,
    addRowAfter,
    addRowBefore,
    deleteRow,
    mergeCells,
    splitCell,
    toggleHeaderRow,
    toggleHeaderColumn,
    toggleHeaderCell,
    goToNextCell,
    deleteTable,
    tableEditing,
    columnResizing,
    tableNodes,
    fixTables,
} from "prosemirror-tables";
import { MenuItem, Dropdown, DropdownSubmenu } from "prosemirror-menu";
import { keymap } from "prosemirror-keymap";
import { autocomplete } from "prosemirror-autocomplete";
import { addListNodes } from "prosemirror-schema-list";

import "../styles/main.css";
import "../styles/tables.css";

const fontSizeMarkSpec = {
    attrs: { size: { default: 16 } },
    parseDOM: [
        {
            style: "font-size",
            getAttrs: (value) => ({ size: parseInt(value, 10) }),
        },
    ],
    toDOM: (node) => ["span", { style: `font-size: ${node.attrs.size}px` }],
};

const fontFamilyMarkSpec = {
    attrs: { fontFamily: { default: "Arial" } },
    parseDOM: [
        {
            style: "font-family",
            getAttrs: (value) => ({ fontFamily: value }),
        },
    ],
    toDOM: (node) => [
        "span",
        { style: `font-family: ${node.attrs.fontFamily}` },
    ],
};

const tabulationMarkSpec = {
    attrs: { tabSize: { default: 4 } },
    parseDOM: [
        {
            style: "tab-size",
            getAttrs: (value) => ({ tabSize: parseInt(value, 10) }),
        },
    ],
    toDOM: (node) => ["pre", { style: `tab-size: ${node.attrs.tabSize}` }, 0],
};

const indentMarkSpec = {
    attrs: { level: { default: 0 } },
    parseDOM: [
        {
            style: "margin-left",
            getAttrs: (value) => ({ level: parseInt(value, 10) / 40 }),
        },
    ],
    toDOM: (node) => [
        "div",
        { style: `margin-left: ${node.attrs.level * 40}px` },
        0,
    ],
};

const alignmentMarkSpec = {
    attrs: { align: { default: "left" } },
    parseDOM: [
        {
            style: "text-align",
            getAttrs: (value) => ({ align: value }),
        },
    ],
    toDOM: (node) => [
        "div",
        { style: `text-align: ${node.attrs.align}` },
        0,
    ],
};

const lineSpacingMarkSpec = {
    attrs: { spacing: { default: 1 } },
    parseDOM: [
        {
            style: "line-height",
            getAttrs: (value) => ({ spacing: parseFloat(value) }),
        },
    ],
    toDOM: (node) => ["div", { style: `line-height: ${node.attrs.spacing}` }, 0],
};

const paragraphSpacingNodeSpec = {
    attrs: { spaceBefore: { default: 0 }, spaceAfter: { default: 0 } },
    parseDOM: [
        {
            style: "margin-top",
            getAttrs: (value) => ({ spaceBefore: parseFloat(value) }),
        },
        {
            style: "margin-bottom",
            getAttrs: (value) => ({ spaceAfter: parseFloat(value) }),
        },
    ],
    toDOM: (node) => [
        "div",
        {
            style: `margin-top: ${node.attrs.spaceBefore}px; margin-bottom: ${node.attrs.spaceAfter}px`,
        },
        0,
    ],
};

const nonBreakingSpace = "\u00A0";

const listNodes = addListNodes(baseSchema.spec.nodes, "paragraph block*", "block");
const table = tableNodes({
    tableGroup: "block",
    cellContent: "block+",
    cellAttributes: {
        background: {
            default: null,
            getFromDOM(dom) {
                return (dom.style && dom.style.backgroundColor) || null;
            },
            setDOMAttr(value, attrs) {
                if (value) attrs.style = (attrs.style || "") + `background-color: ${value};`;
            },
        },
    },
});

const headingNodes = {
    heading: {
        attrs: { level: { default: 1 } },
        content: "inline*",
        group: "block",
        defining: true,
        parseDOM: [
            { tag: "h1", attrs: { level: 1 } },
            { tag: "h2", attrs: { level: 2 } },
            { tag: "h3", attrs: { level: 3 } },
            { tag: "h4", attrs: { level: 4 } },
            { tag: "h5", attrs: { level: 5 } },
            { tag: "h6", attrs: { level: 6 } },
        ],
        toDOM(node) {
            return ["h" + node.attrs.level, 0];
        },
    },
};

const extendedNodes = baseSchema.spec.nodes
    .addBefore("table", "paragraphSpacing", paragraphSpacingNodeSpec)
    .append(listNodes)
    .append(table)
    .update("heading", headingNodes.heading);

const schema = new Schema({
    nodes: extendedNodes,
    marks: {
        ...baseSchema.spec.marks,
        strong: marks.strong,
        em: marks.em,
        code: marks.code,
        link: marks.link,
        fontSize: fontSizeMarkSpec,
        fontFamily: fontFamilyMarkSpec,
        tabulation: tabulationMarkSpec,
        indent: indentMarkSpec,
        alignment: alignmentMarkSpec,
        lineSpacing: lineSpacingMarkSpec,
        nonBreakingSpace: nonBreakingSpace,
    },
    topNode: "doc",
});

let menu = buildMenuItems(schema).fullMenu;
function item(label, cmd) {
    return new MenuItem({ label, select: cmd, run: cmd });
}

function insertTable() {
    return (state, dispatch) => {
        const offset = state.tr.selection.anchor + 1;
        const transaction = state.tr;
        const cell = state.schema.nodes.table_cell.createAndFill();
        const node = state.schema.nodes.table.create(
            null,
            Fragment.fromArray([
                state.schema.nodes.table_row.create(
                    null,
                    Fragment.fromArray([cell, cell, cell])
                ),
                state.schema.nodes.table_row.create(
                    null,
                    Fragment.fromArray([cell, cell, cell])
                ),
            ])
        );

        if (dispatch) {
            dispatch(
                transaction
                    .replaceSelectionWith(node)
                    .scrollIntoView()
                    .setSelection(TextSelection.near(transaction.doc.resolve(offset)))
            );
        }

        return true;
    };
}

function toggleList(state, listType) {
    const { $from, $to } = state.selection;
    const isList = state.selection.$from.parent.type === listType;

    if (isList) {
        const { tr } = state;
        tr.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
            if (node.type === listType) {
                tr.setNodeMarkup(pos, null, {});
            }
        });
        return tr;
    } else {
        // If the current block is not a list, convert it to a list
        // return state.tr.setBlockType($from.pos, $to.pos, listType);
    }
}

function setBlockType(state, nodeType, attrs) {
    const { $from, $to } = state.selection;
    const tr = state.tr;

    state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
        if (node.isTextblock) {
            tr.setNodeMarkup(pos, nodeType, attrs);
        }
    });

    if (tr.docChanged) {
        return tr;
    }

    return null;
}

function headingType(level) {
    return {
        label: `H${level}`,
        select: (state) => setBlockType(state, schema.nodes.heading, { level: level }),
        run: (state, dispatch) => {
            const transaction = setBlockType(state, schema.nodes.heading, { level: level });
            dispatch(transaction);
        },
    }
}

menu.push([
    new DropdownSubmenu([
        new MenuItem(headingType(1)),
        new MenuItem(headingType(2)),
        new MenuItem(headingType(3)),
        new MenuItem(headingType(4)),
        new MenuItem(headingType(5)),
        new MenuItem(headingType(6)),
    ], {
        label: "Heading",
    }),
    new MenuItem({
        label: "Ordered List",
        select: (state) => toggleList(state, schema.nodes.ordered_list),
        run: (state, dispatch) => {
            const transaction = toggleList(state, schema.nodes.ordered_list);
            dispatch(transaction);
        },
    }),
    new MenuItem({
        label: "Add table",
        title: "Insert table",
        class: "ProseMirror-icon",
        run: insertTable(),
    }),
    new Dropdown(
        [
            item("Insert column before", addColumnBefore),
            item("Insert column after", addColumnAfter),
            item("Delete column", deleteColumn),
            item("Insert row before", addRowBefore),
            item("Insert row after", addRowAfter),
            item("Delete row", deleteRow),
            item("Delete table", deleteTable),
            item("Merge cells", mergeCells),
            item("Split cell", splitCell),
            item("Toggle header column", toggleHeaderColumn),
            item("Toggle header row", toggleHeaderRow),
            item("Toggle header cells", toggleHeaderCell),
        ],
        { label: "Edit table" }
    ),
]);

const doc = DOMParser.fromSchema(schema).parse(document.createElement("div"));

export default function Editor() {
    const editorRef = useRef(null);
    const editorDom = useRef(null);
    const [fontSize, setFontSize] = useState(16);
    const [fontFamily, setFontFamily] = useState("Arial");
    const [tabSize, setTabSize] = useState(4);

    useEffect(() => {
        if (!editorRef.current) {
            const plugins = [
                ...autocomplete(),
                columnResizing(),
                tableEditing(),
                keymap({
                    Tab: goToNextCell(1),
                    "Shift-Tab": goToNextCell(-1),
                }),
            ].concat(exampleSetup({ schema, menuContent: menu }));

            let state = EditorState.create({ doc, plugins });
            let fix = fixTables(state);
            if (fix) state = state.apply(fix.setMeta("addToHistory", false));

            editorRef.current = new EditorView(editorDom.current, {
                state: state,
                dispatchTransaction: (transaction) =>
                    handleTransaction(transaction),
            });
        }
    }, []);

    const handleTransaction = (transaction) => {
        const { state } = editorRef.current.state.applyTransaction(transaction);
        editorRef.current.updateState(state);
        const fontSizeMark = schema.marks.fontSize;
        const fontSize = fontSizeMark ? fontSizeMark.attrs.size : 16;
        setFontSize(fontSize);
        const tabulationMark = schema.marks.tabulation;
        const tabSize = tabulationMark ? tabulationMark.attrs.tabSize : 4;
        setTabSize(tabSize);
    };

    const handleChangeFontSize = (e) => {
        const fontSize = parseInt(e.target.value);
        const { tr } = editorRef.current.state;
        const { selection } = tr;
        if (!selection.empty) {
            tr.addMark(
                selection.from,
                selection.to,
                schema.marks.fontSize.create({ size: fontSize })
            );
            editorRef.current.dispatch(tr);
        }
        setFontSize(fontSize);
    };

    const handleChangeFontFamily = (e) => {
        const fontFamily = e.target.value;
        const { tr } = editorRef.current.state;
        const { selection } = tr;
        if (!selection.empty) {
            tr.addMark(
                selection.from,
                selection.to,
                schema.marks.fontFamily.create({ fontFamily })
            );
            editorRef.current.dispatch(tr);
        }
        setFontFamily(fontFamily);
    };

    const handleTabulation = () => {
        const { tr } = editorRef.current.state;
        const { $from } = tr.selection;

        const tabCharacter = "\t";
        tr.insertText(tabCharacter, $from.pos, $from.pos);
        editorRef.current.dispatch(tr);
    };

    const handleInsertNonBreakingSpace = () => {
        const { tr } = editorRef.current.state;
        const { $from } = tr.selection;

        tr.insertText(nonBreakingSpace, $from.pos, $from.pos);
        editorRef.current.dispatch(tr);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            handleTabulation();
        }
    };

    const handleIndentation = (level) => {
        const { tr } = editorRef.current.state;
        const { selection } = tr;
        if (!selection.empty) {
            const { $from, $to } = selection;
            const markType = schema.marks.indent;

            tr.addMark(
                $from.pos,
                $to.pos,
                markType.create({ level })
            );
            editorRef.current.dispatch(tr);
        }
    };

    const handleAlignment = (alignment) => {
        const { tr } = editorRef.current.state;
        const { $from, $to } = tr.selection;
        const markType = schema.marks.alignment;

        tr.addMark(
            $from.before($from.depth),
            $to.after($to.depth),
            markType.create({ align: alignment })
        );
        editorRef.current.dispatch(tr);
    };

    const handleLineSpacing = (spacing) => {
        const { tr } = editorRef.current.state;
        const { selection } = tr;
        if (!selection.empty) {
            const { $from, $to } = selection;
            const markType = schema.marks.lineSpacing;

            tr.addMark(
                $from.pos,
                $to.pos,
                markType.create({ spacing })
            );
            editorRef.current.dispatch(tr);
        }
    };

    return (
        <div>
            <div>
                <label htmlFor="font-size">Font Size: </label>
                <select
                    id="font-size"
                    value={fontSize}
                    onChange={handleChangeFontSize}
                >
                    <option value="12">12</option>
                    <option value="16">16</option>
                    <option value="20">20</option>
                    <option value="24">24</option>
                </select>
            </div>
            <div>
                <label htmlFor="font-family">Font Family: </label>
                <select
                    id="font-family"
                    value={fontFamily}
                    onChange={handleChangeFontFamily}
                >
                    <option value="Arial">Arial</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                </select>
            </div>
            <div>
                Tabulation (works by a button on the keyboard):{" "}
                <button onClick={handleTabulation}>Tab</button>
            </div>
            <div>
                Insert Non-Breaking Space:{" "}
                <button onClick={handleInsertNonBreakingSpace}>space</button>
            </div>
            <div>
                Indentation:
                <button onClick={() => handleIndentation(1)}>Indent</button>
                <button onClick={() => handleIndentation(0)}>Remove Indent</button>
            </div>
            <div>
                Alignment:
                <button onClick={() => handleAlignment("left")}>Left</button>
                <button onClick={() => handleAlignment("center")}>Center</button>
                <button onClick={() => handleAlignment("right")}>Right</button>
            </div>
            <div>
                Line Spacing:
                <button onClick={() => handleLineSpacing(1)}>Normal</button>
                <button onClick={() => handleLineSpacing(1.5)}>1.5</button>
                <button onClick={() => handleLineSpacing(2)}>Double</button>
            </div>
            <div
                id="editor"
                ref={editorDom}
                onKeyDown={handleKeyDown}
                tabIndex={0}
            />
        </div>
    );
}
