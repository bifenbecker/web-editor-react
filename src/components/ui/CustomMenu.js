import React from 'react';

import '../styles/czi-custom-menu.css';
import '../styles/czi-custom-scrollbar.css';

class CustomMenu extends React.Component<any, any, any> {
  render(): React.Element<any> {
    const {children} = this.props;
    return (
      <div className="czi-custom-menu czi-custom-scrollbar">{children}</div>
    );
  }
}

export default CustomMenu;
