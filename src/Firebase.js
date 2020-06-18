import * as firebase from 'firebase';

const config = {
    apiKey: "AIzaSyBoi-ELB9l0Rzt4XD8BfC6weiMOPrz6sHg",
    authDomain: "text-keyword-matcher.firebaseapp.com",
    databaseURL: "https://text-keyword-matcher.firebaseio.com",
    projectId: "text-keyword-matcher",
    storageBucket: "text-keyword-matcher.appspot.com",
    messagingSenderId: "176858422529",
    appId: "1:176858422529:web:42f5c7731a0b3abbebcf00",
    measurementId: "G-LC90K0DX1E"
};
firebase.initializeApp(config);

export default firebase;
