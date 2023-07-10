import applyDevTools from 'prosemirror-dev-tools';
import {EditorState} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import React from 'react';
import ReactDOM from 'react-dom';

import * as PerProseMirror from './components/editor/PerProseMirror';
import {HR} from './components/editor/EditorCommands';
import convertFromDOMElement from '../src/components/editor/convertFromDOMElement';
import RichTextEditor from '../src/components/ui/RichTextEditor';
import DemoAppHTMLTemplate from './DemoAppHTMLTemplate';
import DemoAppRuntime from './DemoAppRuntime';
import './demo-app.css';

const defaultEditorState = (function() {
  const templateNode = document.createElement('div');
  ReactDOM.render(<DemoAppHTMLTemplate />, templateNode);
  return convertFromDOMElement(templateNode);
})();

class App extends React.PureComponent<any, any, any> {
  _runtime = new DemoAppRuntime();

  constructor(props: any, context: any) {
    super(props, context);
    this.state = {
      editorState: defaultEditorState,
    };
  }

  render(): React.Element<any> {
    const {editorState} = this.state;
    const readOnly = /read/gi.test(window.location.search);
    return (
        <RichTextEditor
            autoFocus={true}
            editorState={editorState}
            embedded={false}
            height="100%"
            onChange={this._onChange}
            onReady={this._onReady}
            placeholder={readOnly ? '' : 'Type Something...'}
            readOnly={readOnly}
            runtime={this._runtime}
            width="100%"
        />
    );
  }

  _onChange = (editorState: EditorState): void => {
    this.setState({editorState});
  };

  _onReady = (editorView: EditorView): void => {
    window.debugProseMirror = () => {
      applyDevTools(editorView);
    };
    PerProseMirror.registerCommand('hr', HR);
    window.PerProseMirror = PerProseMirror;
  };
}

export default App;
