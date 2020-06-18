import React, { Component } from 'react';
import './Keyword.css';
import firebase from './Firebase';

class KeywordComponent extends Component {
  render() {
    let keywords = [];
    Object.entries(this.props.keywords).forEach(([keyword, isSelected]) => {
      const onClick = function () {
        this.props.setKeywordSelected(keyword, !isSelected);
      };
      const element = (
        <span key={keyword} onClick={onClick.bind(this)} className={isSelected ? "selected" : "not-selected"}>
          {keyword}
        </span>
      );
      keywords.push(element);
    });

    return (
      <div>
        {keywords}
      </div>
    );
  }
}

export default KeywordComponent;
