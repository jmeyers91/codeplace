const { readdir, readFile, writeFile } = require('then-fs');
const path = require('path');
const makeDir = require('make-dir');
const Express = require('express');
const app = Express();

const projectsDir = path.join(__dirname, 'projects');
const projectDir = projectId => path.join(projectsDir, projectId);
const projectFile = (projectId, fileName) => path.join(projectsDir, projectId, fileName);

app.use(Express.static(path.join(__dirname, 'build')));
app.use(require('body-parser').json());

app.get('/api/projects', async (req, res) => {
  res.json({
    projects: await readdir(projectsDir)
  });
});

app.get('/api/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const [
      template,
      style,
      script,
    ] = await Promise.all([
      readFile(projectFile(projectId, 'template.html'), 'utf8'),
      readFile(projectFile(projectId, 'style.css'), 'utf8'),
      readFile(projectFile(projectId, 'script.js'), 'utf8'),
    ]);
    res.json({
      template,
      style,
      script,
    });
  } catch(error) {
    console.log(error);
    res.status(500).json({error});
  }
});

app.post('/api/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { template, style, script } = req.body;
    await makeDir(projectDir(projectId));
    await Promise.all([
      writeFile(projectFile(projectId, 'template.html'), template || ''),
      writeFile(projectFile(projectId, 'style.css'), style || ''),
      writeFile(projectFile(projectId, 'script.js'), script || ''),
    ]);
    res.end();
  } catch(error) {
    console.log(error);
    res.status(500).json({error});
  }
});

module.exports = port => new Promise((resolve, reject) => {
  app.listen(port, error => {
    if(error) reject(error);
    else resolve();
  });
});