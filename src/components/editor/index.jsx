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
    fixTables
} from "prosemirror-tables";
import { MenuItem, Dropdown } from "prosemirror-menu";
import { keymap } from "prosemirror-keymap";
import autocomplete from "prosemirror-autocomplete";


import "../styles/main.css"
import "../styles/tables.css"


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

const nonBreakingSpace = "\u00A0";

const schema = new Schema({
    nodes: baseSchema.spec.nodes.append(
        tableNodes({
            tableGroup: "block",
            cellContent: "block+",
            cellAttributes: {
                background: {
                    default: null,
                    getFromDOM(dom) {
                        return (dom.style && dom.style.backgroundColor) || null;
                    },
                    setDOMAttr(value, attrs) {
                        if (value)
                            attrs.style = (attrs.style || "") + `background-color: ${value};`;
                    }
                }
            }
        })
    ),
    marks: {
        ...baseSchema.spec.marks,
        strong: marks.strong,
        em: marks.em,
        code: marks.code,
        link: marks.link,
        fontSize: fontSizeMarkSpec,
        fontFamily: fontFamilyMarkSpec,
        tabulation: tabulationMarkSpec,
        nonBreakingSpace: nonBreakingSpace,
    },
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
                )
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

menu.push([
    new MenuItem({
        label: "Add table",
        title: "Insert table",
        class: "ProseMirror-icon",
        run: insertTable()
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
            item("Toggle header cells", toggleHeaderCell)
        ],
        { label: "Edit table" }
    )
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
                    "Shift-Tab": goToNextCell(-1)
                })
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
            <div id="editor" ref={editorDom} onKeyDown={handleKeyDown} tabIndex={0} />
        </div>
    );
}
