import React from 'react';
import './App.css';
import QuestionaryComponent from './Questionary';
import KeywordComponent from './Keyword';
import firebase from './Firebase';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      resources: {
        id: '',
        text: '',
        data: {}
      },
      questionary: {},
      keywords: {},
      isSurvey: true,
      isValid: false,
      isLoading: true
    };
  }

  componentDidMount() {
    const database = firebase.database();
    database
      .ref('resources')
      .on('value', (snapshot) => {
        const v = snapshot.val();
        this.setState({
          resources: {
            id: this.state.resources.id,
            text: this.state.resources.text,
            data: v || {}
          },
        });

        // Update currently displayed text, 
        // if none.
        if (!this.state.resources.id) this.updateContentFromRandomResource();
      });
    database
      .ref('experts-validating-keywords/questionary')
      .on('value', (snapshot) => {
        const v = snapshot.val();
        if (v) {
          this.mergeQuestionary(v);
        }
      });
    database
      .ref('experts-validating-keywords/keywords')
      .on('value', (snapshot) => {
        const v = snapshot.val();
        if (v) {
          this.mergeKeywords(v);
        }
      });
  }

  onSaveSurvey() {
    this.setState({ isSurvey: false })
  }

  onEditSurvey() {
    this.setState({ isSurvey: true })
  }

  onSubmitClick() {
    if (this.state.isValid) {
      const keywords = {};
      Object.entries(this.state.keywords).forEach(([key, value], index) => {
        if (value) keywords[index] = key;
      });
      const survey = {};
      Object.entries(this.state.questionary).forEach(([key, value], index) => {
        survey[index] = {
          q: key,
          a: value
        };
      });
      const object = {
        survey: survey,
        keywords: keywords,
        id: this.state.resources.id
      };

      const database = firebase.database();
      const path = 'experts-validating-keywords/results';
      database.ref(path).push().set(object).then(() => {
        this.updateContentFromRandomResource();
        this.resetKeywords();

        window.scrollTo(0, 0);
        alert("Thanks!");
      });
    }
  }

  render() {
    const hasSurvey = !!Object.values(this.state.questionary).length;
    const element = this.state.isLoading
      ? (
        <div className="lds-dual-ring"></div>
      )
      : this.state.isSurvey
        // render survey
        ? (
          <div className="survey">
            <h4>
              {hasSurvey ? "Fill out the survey before continuing:" : "There's no survey, sorry for that"}
            </h4>
            <QuestionaryComponent questionary={this.state.questionary} setQuestionaryAnswer={this.setQuestionaryAnswer.bind(this)} />
            <div className="footer">
              {hasSurvey && <div className="btn" onClick={this.onSaveSurvey.bind(this)} disabled={!this.state.isValid}>save</div>}
            </div>
          </div>
        )
        // render text & keywords
        : (
          <div className="container">
            <div>
              {this.state.resources.text}
            </div>
            <div>
              <u onClick={this.onEditSurvey.bind(this)}>edit survey answers</u>
              <h4>
                Select the keywords that match the text:
              </h4>
              <KeywordComponent keywords={this.state.keywords} setKeywordSelected={this.setKeywordSelected.bind(this)} />
              <div className="footer">
                <div className="btn" onClick={this.onSubmitClick.bind(this)}>
                  submit
          </div>
              </div>
            </div>
          </div>
        );
    return (
      element
    );
  }

  setState(state) {
    state = { ...this.state, ...state };
    // Validate the state before 
    // setting it.
    let isValid = !!Object.values(state.questionary).length;
    Object.values(state.questionary).forEach((answer) => {
      if (answer.replace(/\s/g, "").length < 2) {
        isValid = false;
      }
    });

    let isSurvey = state.isSurvey || !isValid;
    let hasLoaded = state.resources.data && state.questionary && state.keywords;
    super.setState({ ...state, isSurvey: isSurvey, isValid: isValid, isLoading: !hasLoaded });
  }

  updateContentFromRandomResource() {
    let text = '';
    let id = '';
    if (this.state.resources.data) {
      const entries = Object.entries(this.state.resources.data);
      const index = entries.length * Math.random() | 0
      text = entries[index][1];
      id = entries[index][0];
    }

    this.setState({
      resources: {
        id: id,
        text: text,
        data: this.state.resources.data
      }
    });
  }

  // KEYWORDS

  mergeKeywords(data) {
    // Copy the keywords' state from an old 
    // state.
    let oldKeywords = this.state.keywords;
    let newKeywords = {};
    Object.values(data).forEach((keyword) => {
      newKeywords[keyword] = oldKeywords[keyword] || false;
    });

    this.setState({
      keywords: newKeywords
    });
  }

  resetKeywords() {
    let newKeywords = {};
    Object.keys(this.state.keywords).forEach((keyword) => {
      newKeywords[keyword] = false;
    });

    this.setState({
      keywords: newKeywords
    });
  }

  setKeywordSelected(keyword, isSelected) {
    if (this.state.keywords[keyword] === undefined) {
      return;
    }

    let newKeywords = { ...this.state.keywords };
    newKeywords[keyword] = isSelected;
    this.setState({
      keywords: newKeywords
    });
  }

  // QUESTIONARY

  mergeQuestionary(data) {
    // Copy the answers from an old filled 
    // questionary.
    let oldQuestionary = this.state.questionary;
    let newQuestionary = {};
    Object.values(data).forEach((question) => {
      newQuestionary[question] = oldQuestionary[question] || "";
    });

    this.setState({
      questionary: newQuestionary
    });
  }

  setQuestionaryAnswer(question, answer) {
    if (this.state.questionary[question] === undefined || answer === undefined) {
      // Incorrect question, skipping it. 
      return;
    }

    let newQuestionary = { ...this.state.questionary };
    newQuestionary[question] = answer;

    this.setState({
      questionary: newQuestionary
    });
  }
}

export default App;
