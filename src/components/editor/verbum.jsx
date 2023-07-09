import React, { useEffect } from "react";
import {
  EditorComposer,
  Editor,
  ToolbarPlugin,
  AlignDropdown,
  BackgroundColorPicker,
  BoldButton,
  CodeFormatButton,
  FloatingLinkEditor,
  FontFamilyDropdown,
  FontSizeDropdown,
  InsertDropdown,
  InsertLinkButton,
  ItalicButton,
  TextColorPicker,
  TextFormatDropdown,
  UnderlineButton,
  Divider,
} from "verbum";
import { Axio } from "api/axio";

const NoteViewer = () => {
  useEffect(() => {
    const connectToAxio = async () => {
      await Axio.init({
        server: "http://dev1.axiosoft.ru",
        username: "RsDev01",
        password: "Rs1Dev@01_Red!",
        domain: "AXIOSOFT",
        isDebug: true,
      });
    };
    const exampleCall = async () => {
      const data = await Axio.clientCall("GetStatus", []);
      console.log(data);
    };
    connectToAxio();
    exampleCall();
  }, []);

  return (
    <EditorComposer>
      <Editor hashtagsEnabled={true}>
        <ToolbarPlugin defaultFontSize="20px">
          <FontFamilyDropdown />
          <FontSizeDropdown />
          <Divider />
          <BoldButton />
          <ItalicButton />
          <UnderlineButton />
          <CodeFormatButton />
          <InsertLinkButton />
          <TextColorPicker />
          <BackgroundColorPicker />
          <TextFormatDropdown />
          <Divider />
          <InsertDropdown enablePoll={true} />
          <Divider />
          <AlignDropdown />
        </ToolbarPlugin>
      </Editor>
    </EditorComposer>
  );
};

export default NoteViewer;
