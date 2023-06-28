import { bindActionCreators } from "@reduxjs/toolkit";

import { useAppDispatch } from "common/hooks";

import { [FTName]Actions } from "features/[FTName]/store";

const actions = {
  ...[FTName]Actions,
};

const use<FTName | capitalize>Actions = () => {
  const dispatch = useAppDispatch();
  return bindActionCreators(actions, dispatch);
};

export default use<FTName | capitalize>Actions;
