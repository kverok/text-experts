import React, { Component } from 'react';
import './Questionary.css';
import firebase from './Firebase';

class QuestionaryComponent extends Component {
  render() {
    let questions = [];
    Object.entries(this.props.questionary).forEach(([question, answer]) => {
      const onChange = function (event) {
        this.props.setQuestionaryAnswer(question, event.target.value);
      };
      const element = (
        <label key={question}>
          {question}
          <input type="text" value={answer} onChange={onChange.bind(this)} required />
        </label>
      );
      questions.push(element);
    });

    return (
      <form>
          {questions}
      </form>
    );
  }
}

export default QuestionaryComponent;
