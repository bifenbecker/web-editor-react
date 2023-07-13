import { useState, useEffect, useRef } from "react";
import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { exampleSetup } from "prosemirror-example-setup";


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

const mySchema = new Schema({
    nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
    marks: {
        ...schema.spec.marks,
        fontSize: fontSizeMarkSpec,
        fontFamily: fontFamilyMarkSpec,
    },
});

const doc = DOMParser.fromSchema(mySchema).parse(document.createElement("div"));


export default function Editor() {
    const editorRef = useRef(null);
    const editorDom = useRef(null);
    const [fontSize, setFontSize] = useState(16);
    const [fontFamily, setFontFamily] = useState("Arial");

    useEffect(() => {
        if (!editorRef.current) {
            const plugins = exampleSetup({ schema: mySchema });
            editorRef.current = new EditorView(editorDom.current, {
                state: EditorState.create({ doc, plugins }),
                dispatchTransaction: (transaction) =>
                    handleTransaction(transaction),
            });
        }
    }, []);

    const handleTransaction = (transaction: Transaction) => {
        const { state, transactions } =
            editorRef.current.state.applyTransaction(transaction);
        editorRef.current.updateState(state);
        const fontSizeMark = mySchema.marks.fontSize;
        const fontSize = fontSizeMark ? fontSizeMark.attrs.size : 16;
        setFontSize(fontSize);
    };

    const handleChangeFontSize = (e) => {
        const fontSize = parseInt(e.target.value);
        const { tr } = editorRef.current.state;
        const { selection } = tr;
        if (!selection.empty) {
            tr.addMark(
                selection.from,
                selection.to,
                mySchema.marks.fontSize.create({ size: fontSize })
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
                mySchema.marks.fontFamily.create({ fontFamily })
            );
            editorRef.current.dispatch(tr);
        }
        setFontFamily(fontFamily);
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
            <div id="editor" ref={editorDom} />
        </div>
    );
}
