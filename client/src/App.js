//importing requirements
import React, { Component } from "react";
import { Controlled as CodeMirror } from "react-codemirror2";
import Pusher from "pusher-js";
import pushid from "pushid";
import axios from "axios";

//used codemirror library
import "./App.css";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";
import "codemirror/mode/htmlmixed/htmlmixed";
import "codemirror/mode/css/css";
import "codemirror/mode/javascript/javascript";


//all the application logic and views in this App Component

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      id: "",
      html: "",
      css: "",
      js: "",

    };

    //creating a pusher instance to allow collaboration, multiple instances can be opened and they can edit and add together
    this.pusher = new Pusher("d90d11b1a8b505ec91f5", {
      cluster: "ap2",
      forceTLS: true
    });

    this.channel = this.pusher.subscribe("editor");
  }


  //listen for any update, when updated run and render the code on live view
  componentDidUpdate() {
    this.runCode();
  }

  //after mounting component initialise id of the component with a unique id generated by pushid for each user.
  //if id of the data in use by all users is equal to the source then dont update, else update the states with data.
  componentDidMount() {
    this.setState({
      id: pushid()
    });
    this.channel.bind("text-update", data => {
      const { id } = this.state;
      if (data.id === id) return;

      this.setState({
        html: data.html,
        css: data.css,
        js: data.js
      });
    });
  }

  //keep posting the data on the server and sync it, used axios call to post data, all users are sync with the servers data
  syncUpdates = () => {
    const data = { ...this.state };

    axios
      .post("http://localhost:5000/update-editor", data)
      .catch(console.error);
  };

  //for rendering code, storing html, css,js from the state, and embedding into a parent html code to render onlive view
  runCode = () => {
    const { html, css, js } = this.state;

    const iframe = this.refs.iframe;
    const document = iframe.contentDocument;
    const documentContents = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>Document</title>
        <style>
          ${css}
        </style>
      </head>
      <body>
        ${html}

        <script type="text/javascript">
          ${js}
        </script>
      </body>
      </html>
    `;


    document.open();
    document.write(documentContents);
    document.close();
  };


  //function used to toggle and maximize the html,css or js according to click, from file explorer
  loadEditor(dat) {
    console.log(dat);
    var classString = `${dat}` + "-" + "code";

    if (classString === "html-code") {
      document.getElementsByClassName("html-code")[0].style.height = "94.8vh";
      document.getElementsByClassName("css-code")[0].style.height = "0vh";
      document.getElementsByClassName("js-code")[0].style.height = "0vh";

    }

    if (classString === "css-code") {
      document.getElementsByClassName("html-code")[0].style.height = "0vh";
      document.getElementsByClassName("css-code")[0].style.height = "94.8vh";
      document.getElementsByClassName("js-code")[0].style.height = "0vh";
    }

    if (classString === "js-code") {
      document.getElementsByClassName("html-code")[0].style.height = "0vh";
      document.getElementsByClassName("css-code")[0].style.height = "0vh";
      document.getElementsByClassName("js-code")[0].style.height = "94.8vh";

    }
  }


  //function downloads the actual parent code as a file locally
  downloadCode() {

    const documentContents = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>Document</title>
        <style>
          ${this.state.css}
        </style>
      </head>
      <body>
        ${this.state.html}
        <script type="text/javascript">
          ${this.state.js}
        </script>
      </body>
      </html>
    `;

    var element = document.createElement('a');
    element.setAttribute('href', "data:text/plain;charset=UTF-8," + encodeURIComponent(documentContents));
    element.setAttribute('download', "codeSoumyadeeptaDas.txt");
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click(); // simulate click
    document.body.removeChild(element);

  }

  //render
  render() {
    const { html, js, css } = this.state;
    const codeMirrorOptions = {
      theme: "material",
      lineNumbers: true,
      scrollbarStyle: null,
      lineWrapping: true
    };

    return (
      
      <div className="App">

        <div>
          <section className="headersection">
            <div><h2>Live Code Editor with collaboration features</h2>
              <h4>by: Soumyadeepta Das (18BCE1350)</h4>
            </div>
          </section>
        </div>


        <div>
          <section className="fileexplorersection">
            <div className="section-heading">File Explorer</div>
            <div className="file-explorer">
              <br></br>
              <p>Click on a file to maximize on code editor</p>
              <ul className="filelist">
                <li onClick={() => this.loadEditor("html")} id="html" value="html">index.html</li>
                <li onClick={() => this.loadEditor("css")} id="css" value="css">index.css</li>
                <li onClick={() => this.loadEditor("js")} id="js" value="js">index.js</li>
              </ul>

              <button id="downloadButton" onClick={() => this.downloadCode()}>Download Code</button>
            </div>
          </section>


          <section className="codeeditorsection">
            <div className="section-heading">Code Editor</div>

            <div className="code-editor html-code">
              <div className="editor-header">HTML (index.html)</div>
              <CodeMirror
                value={html}
                options={{
                  mode: "htmlmixed",
                  ...codeMirrorOptions
                }}
                onBeforeChange={(editor, data, html) => {
                  this.setState({ html }, () => this.syncUpdates());
                }}
              />
            </div>

            <div className="code-editor css-code">
              <div className="editor-header">CSS (index.css)</div>
              <CodeMirror
                value={css}
                options={{
                  mode: "css",
                  ...codeMirrorOptions
                }}
                onBeforeChange={(editor, data, css) => {
                  this.setState({ css }, () => this.syncUpdates());
                }}
              />
            </div>

            <div className="code-editor js-code">
              <div className="editor-header">JavaScript (index.js)</div>
              <CodeMirror
                value={js}
                options={{
                  mode: "javascript",
                  ...codeMirrorOptions
                }}
                onBeforeChange={(editor, data, js) => {
                  this.setState({ js }, () => this.syncUpdates());
                }}
              />
            </div>

          </section>


          <section className="liveviewsection">
            <div className="section-heading">Live View (Rendered view)</div>
            <iframe title="result" className="iframe" ref="iframe" />
          </section>


        </div>
      </div>
    );
  }
}

export default App;
