import React, { Component } from 'react';
import logo from './logo.svg';
import { Controlled as CodeMirror } from 'react-codemirror2';
import nanoid from 'nanoid';
import axios from 'axios';
import './App.css';

require('codemirror/mode/xml/xml');
require('codemirror/mode/htmlmixed/htmlmixed');
require('codemirror/mode/javascript/javascript');

const defaultTemplate = (
`<!DOCTYPE html>
<html>
  <head>
    <style></style>
  </head>
  <body>
    Hello World!

    <script>{{ script }}</script>
  </body>
</html>
`);

const defaultScript = (`
console.log('Hello world!');
`);

const defaultStyle = (`
body, html {
  margin: 0;
  padding: 0;
}

* {
  box-sizing: border-box;
}
`);


class App extends Component {
  state = {
    projectId: nanoid(),
    template: defaultTemplate,
    script: defaultScript,
    style: defaultStyle,
    stylePanelOpen: true,
    templatePanelOpen: true,
    scriptPanelOpen: true,
    outputPanelOpen: true,
    compiledTemplate: '',
    saving: false,
    dirty: false,
  };

  handleRunClick = () => this.compile();

  handleInputChange = key => (editor, data, value) => {
    this.setState({[key]: value, dirty: true});
  };

  handleSaveClick = () => {
    this.save();
  };

  async save() {
    try {
      const { projectId, template, script, style } = this.state;
      this.setState({saving: true, dirty: false});
      const response = await axios.post(`/api/projects/${projectId}`, {
        template, script, style
      });
    } catch(error) {
      console.log('Saving failed', error);
    }
    this.setState({saving: false});
  }

  handleScriptChange = this.handleInputChange('script');
  handleStyleChange = this.handleInputChange('style');
  handleTemplateChange = this.handleInputChange('template');
  handleProjectIdChange = event => {
    const projectId = event.target.value;
    this.setState({dirty: true, projectId});
    window.history.pushState(null, "", `/${projectId}`);
  }

  handlePanelToggle = key => () => this.setState({[key]: !this.state[key]});
  handleStylePanelToggle = this.handlePanelToggle('stylePanelOpen');
  handleScriptPanelToggle = this.handlePanelToggle('scriptPanelOpen');
  handleTemplatePanelToggle = this.handlePanelToggle('templatePanelOpen');
  handleOutputPanelToggle = this.handlePanelToggle('outputPanelOpen');

  compile() {
    const { script, style, template } = this.state;
    const compiledTemplate = template.replace(/\{\{\s*(\S+)\s*}\}/g, (match, key) => {
      return this.state[key] || '';
    });
    this.setState({compiledTemplate});
  }

  async componentDidMount() {
    const { pathname } = window.location;
    const projectNameMatch = pathname.match(/\/(.+)\/?/);

    if(projectNameMatch) {
      try {
        const projectId = projectNameMatch[1];
        this.setState({projectId});
        const response = await axios.get(`/api/projects/${projectId}`);
        const { script, template, style } = response.data;
        this.setState({
          projectId, script, template, style,
        })
        this.compile();
      } catch(error) {
        console.log('Failed to load project', error);
      }
    } else {
      this.compile();
    }

    onSave(() => this.save());
  }

  render() {
    const {
      projectId,
      script,
      style,
      template,
      compiledTemplate,
      stylePanelOpen,
      templatePanelOpen,
      scriptPanelOpen,
      outputPanelOpen,
      saving,
      dirty,
    } = this.state;

    return (
      <div className="app">
        <div className="header">
          <div className="header-left">
            <input className="project-id-input" value={projectId} onChange={this.handleProjectIdChange}/>
            <button className="save-button" onClick={this.handleSaveClick} disabled={!dirty}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
          <div className="header-center"></div>
          <div className="header-right">
            <ToggleButton active={stylePanelOpen} onClick={this.handleStylePanelToggle}>Style</ToggleButton>
            <ToggleButton active={scriptPanelOpen} onClick={this.handleScriptPanelToggle}>Script</ToggleButton>
            <ToggleButton active={templatePanelOpen} onClick={this.handleTemplatePanelToggle}>Template</ToggleButton>
            <ToggleButton active={outputPanelOpen} onClick={this.handleOutputPanelToggle}>Output</ToggleButton>
            <button onClick={this.handleRunClick}>Run</button>
          </div>
        </div>
        <div className="content">
          <InputPanel
            className="style-panel"
            open={stylePanelOpen}
            mode="css"
            value={style}
            onChange={this.handleStyleChange}
          />
          <InputPanel
            className="script-panel"
            open={scriptPanelOpen}
            mode="javascript"
            value={script}
            onChange={this.handleScriptChange}
          />
          <InputPanel
            className="template-panel"
            open={templatePanelOpen}
            mode="htmlmixed"
            value={template}
            onChange={this.handleTemplateChange}
          />
          <Panel className="output-panel" value={style} open={outputPanelOpen}>
            <iframe key={compiledTemplate} srcDoc={compiledTemplate || ''}/>
          </Panel>
        </div>
      </div>
    );
  }
}

function Panel(props) {
  return (
    <div className={`panel ${props.className || ''} ${props.open ? 'open' : 'closed'}`}>
      {props.children}
    </div>
  );
}

function InputPanel(props) {
  const { value, onChange, header, ...rest } = props;

  return (
    <Panel {...rest}>
      {header && <div className="header">{header}</div>}
      <CodeMirror
        value={value}
        onBeforeChange={onChange}
        options={{
          mode: props.mode,
          theme: 'material',
          lineNumbers: true
        }}
      />
    </Panel>
  );
}

function ToggleButton(props) {
  return (<button {...props} className={`${props.className || ''} ${props.active ? 'active' : 'inactive'}`}/>);
}

function trimLines(str) {
  return str.split(/\n/g).map(str => str.trim()).join('\n');
}

function onSave(fn) {
  let ctrDown = false;

  window.addEventListener('keyup', event => {
    if(event.keyCode == 91) ctrDown = false;
  });
  
  window.addEventListener('keydown', event => {
    if(event.keyCode == 91) ctrDown = true;
    if(event.keyCode == 83 && ctrDown) {
      event.preventDefault();
      fn();
      return false;
    }
  });
}

export default App;
