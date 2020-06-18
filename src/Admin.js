import React from 'react';
import './Admin.css';
import firebase from './Firebase';
import * as JSZip from 'jszip';
import * as FileSaver from 'file-saver';

class Admin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      questionary: {},
      isResLoading: false,
      isKeywordsLoading: false
    };

    this.handleResFileChosen = (file) => {
      this.setState({
        isResLoading: true
      });

      JSZip.loadAsync(file).then((zip) => {
        const promises = [];
        zip.forEach((key, zipEntry) => {
          if (key.match(/(\/|^)\./g)) {
            return;
          }

          const p = zipEntry.async("text").then((text) => {
            return {
              key: key.replace(/\./g, '_'),
              value: text
            };
          });
          promises.push(p);
        });
        Promise.all(promises).then((list) => {
          const object = {};
          list.forEach(function (item) {
            object[item.key] = item.value;
          });

          const database = firebase.database();
          database.ref('resources').set(object).then(() => {
            this.setState({
              isResLoading: false
            });
          });
        })
      });
    };

    this.handleKeywordsFileChosen = async (file) => {
      this.setState({
        isKeywordsLoading: true
      });

      let object = {};

      let txt = await file.text();
      txt = txt.split('\n');
      txt.forEach((line, index) => {
        if (line) {
          object[index] = line;
        }
      });

      const database = firebase.database();
      database.ref('experts-validating-keywords/keywords').set(object).then(() => {
        this.setState({
          isKeywordsLoading: false
        });
      });
    };

    this.deleteUserSubmits = () => {
      const database = firebase.database();
      database.ref('experts-validating-keywords/results').set({});
    };

    this.downloadUserSubmits = () => {
      const database = firebase.database();
      database.ref('experts-validating-keywords/results').once('value').then((snapshot) => {
        let json = JSON.stringify(snapshot.val(), null, 2);
        var blob = new Blob([json], { type: "text/plain;charset=utf-8" });
        FileSaver.saveAs(blob, "submits.json");
      });
    };

    this.qaDelete = (key) => {
      let newQuestionary = { ...this.state.questionary };
      delete newQuestionary[key];
      this.setState({
        questionary: newQuestionary
      });
    };
    this.qaDeleteAll = () => {
      this.setState({
        questionary: {}
      });
    };
    this.qaAdd = () => {
      let newQuestionary = { ...this.state.questionary };
      let key = this.randomString(10); 
      newQuestionary[key] = "";
      this.setState({
        questionary: newQuestionary
      });
    };
    this.qaSave = () => {
      let object = {};
      Object.entries(this.state.questionary).forEach(([_, value], index) => {
        if (value) {
          object[index] = value;
        }
      });

      const database = firebase.database();
      database.ref('experts-validating-keywords/questionary').set(object);
    };
  }

  randomString(len, an) {
    an = an && an.toLowerCase();
    var str = "",
      i = 0,
      min = an === "a" ? 10 : 0,
      max = an === "n" ? 10 : 62;
    for (; i++ < len;) {
      var r = Math.random() * (max - min) + min << 0;
      str += String.fromCharCode(r += r > 9 ? r < 36 ? 55 : 61 : 48);
    }
    return str;
  }

  componentDidMount() {
    const database = firebase.database();
    database
      .ref('experts-validating-keywords/questionary')
      .on('value', (snapshot) => {
        const v = snapshot.val();
        if (v) {
          this.mergeQuestionary(v);
        }
      });
  }

  render() {
    let resLoader;
    if (this.state.isResLoading) {
      resLoader = <div>Loading...</div>;
    } else {
      resLoader = <div></div>;
    }

    let keywordsLoader;
    if (this.state.isKeywordsLoading) {
      keywordsLoader = <div>Loading...</div>;
    } else {
      keywordsLoader = <div></div>;
    }

    let questions = [];
    Object.entries(this.state.questionary).forEach(([question, answer]) => {
      const onChange = function (event) {
        this.setQuestionaryAnswer(question, event.target.value);
      };
      const onClick = function () {
        this.qaDelete(question);
      };
      const element = (
        <div className={"elem"} key={question}>
          <input type="text" value={answer} onChange={onChange.bind(this)} required />
          <span onClick={onClick.bind(this)}>delete</span>
        </div>
      );
      questions.push(element);
    });

    return (
      <div>
        <div className="header">
          <div className="btn" onClick={this.deleteUserSubmits}>delete user submits</div>
          <div className="btn" onClick={this.downloadUserSubmits}>download user submits</div>
        </div>
        <div className="divider"></div>
        <div>
          <h3>Resources:</h3>
          <div>Pick a .zip file to upload:</div>
          <input type='file'
            id='file'
            className='input-file'
            accept='.zip'
            onChange={e => this.handleResFileChosen(e.target.files[0])}
          />
          <div>it will replace previously uploaded text resources but <i>will not</i> delete existing user submits.</div>
          {resLoader}
        </div>
        <div className="divider"></div>
        <div>
          <h3>Keywords:</h3>
          <div>Pick a .txt file to upload:</div>
          <input type='file'
            id='file'
            className='input-file'
            accept='.txt'
            onChange={e => this.handleKeywordsFileChosen(e.target.files[0])}
          />
          <div>it will replace previously uploaded keywords. Keywords should be separated by a line break.</div>
          {keywordsLoader}
        </div>
        <div className="divider"></div>
        <div>
          <h3>Survey:</h3>
          <div>
            {questions}
          </div>
        </div>
        <div className="header">
          <div className="btn red" onClick={this.qaDeleteAll}>delete all</div>
          <div className="btn green" onClick={this.qaAdd}>add</div>
          <div className="btn" onClick={this.qaSave}>save</div>
        </div>
      </div>
    );
  }

  mergeQuestionary(data) {
    // Copy the answers from an old filled 
    // questionary.
    let oldQuestionary = this.state.questionary;
    let newQuestionary = {};
    Object.values(data).forEach((question) => {
      newQuestionary[question] = oldQuestionary[question] || question;
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

export default Admin;
