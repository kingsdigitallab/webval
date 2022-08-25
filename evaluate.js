const tmpConfigPath = "/tmp/pa11y-ci.json"
const projectsPath = "./projects.json"

const projects = require(projectsPath);
const pa11yCiConfig = require('./pa11y-ci.json');
const fs = require("fs");
const { execSync } = require('child_process');
const pa11y = require('pa11y');

function saveData(data, path) {
  fs.writeFileSync(path, JSON.stringify(data, null, 1), "utf8")
}

function setIssueRuleFromIssueCode(issue) {
  // code: 'WCAG2AA.Principle4.Guideline4_1.4_1_2.H91.Select.Name'
  // part:  0       1          2            3     4   5      6
  
  let parts = issue.code.split('.')

  let taxonomy = parts[3].split('_')

  issue.rule = {
    standard: parts[0].substring(0, 5),
    level: parts[0].substring(5),
    principle: taxonomy[0],
    guideline: taxonomy[1],
    rule: taxonomy[2],
    code: parts[4],
    target: parts.filter((e,i) => i > 4).join('.'),
  }
}

projects
  .filter(project => (project?.a11y?.status == 'scheduled'))
  .forEach((project) => {
    let baseUri = project.sites.liv
    console.log(`Project ${project.name} ${baseUri}`)

    // TODO: create path to output if absent
    // TODO: add axe rules

    let res = {
      "issues": []
    }

    if (1) {
      project.a11y.urls.forEach(async (webpath) => {
        console.log(`  PA11Y ${webpath}`)
        let results = null
        try {
          results = await pa11y(baseUri + webpath, pa11yCiConfig.defaults)
        } catch(err) {
          console.log(err.message)
        }

        // console.log(results)
        // project.a11y.status = 'done'
        project.a11y.evaluated = new Date().toISOString()
        project.a11y.status = 'done'
        saveData(projects, projectsPath)
        
        for (let issue of results.issues) {
          issue.host = baseUri
          issue.webpath = webpath
          setIssueRuleFromIssueCode(issue)
          res.issues.push(issue)
        } 
        resultsPath = `./projects/${project.slug}/a11y-issues.json`
        console.log('  WRITE ' + resultsPath)
        saveData(res, resultsPath)
      })
    }

  })
