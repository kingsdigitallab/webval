const path = require('path')
const pathScripts = __dirname
const pathProjects = path.join(pathScripts, '../projects') 

const projectsJsonPath = path.join(pathProjects, 'projects.json')
const toEvaluate = require(path.join(pathProjects, 'evaluate.json'))

const projects = require(projectsJsonPath);
const pa11yCiConfig = require(path.join(pathProjects, 'pa11y-ci.json'))
const fs = require("fs");
const { execSync } = require('child_process');
const pa11y = require('pa11y');


function saveData(data, apath) {
  parentPath = path.dirname(apath);
  fs.mkdirSync(parentPath, {recursive: true});

  console.log('  WRITE ' + apath)
  fs.writeFileSync(apath, JSON.stringify(data, null, 1), "utf8")
}

function test(project) {
  let ret = false
  console.log(project.slug)

  const projects2 = require(projectsJsonPath);
  for (let p of projects2) {
    if (p.slug == project.slug) {
      if (p?.a11y?.evaluationEnd) {
        ret = p?.a11y?.evaluationEnd
      }
      break
    }
  }

  console.log(`test: ${ret}`)

  return ret
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
  .filter(project => (project?.slug == toEvaluate.slug))
  .forEach(async (project) => {
    // console.log(project.a11y)
    let baseUri = project.sites.liv
    console.log(`Project ${project.name} ${baseUri}`)

    // TODO: create path to output if absent
    // TODO: add axe rules

    let res = {
      "issues": []
    }

    if (1) {
      for (let webpath of project.a11y.urls) {
        console.log(`  PA11Y ${webpath}`)
        let results = null
        try {
          results = await pa11y(baseUri + webpath, pa11yCiConfig.defaults)
          // results = {issues: []}
        } catch(err) {
          console.log(err.message)
        }
        
        for (let issue of results.issues) {
          issue.host = baseUri
          issue.webpath = webpath
          setIssueRuleFromIssueCode(issue)
          res.issues.push(issue)
        } 
      }

      project.a11y.evaluationEnd = new Date().toISOString()
      delete project.a11y.status
      delete project.a11y.evaluated

      // console.log(projectsJsonPath)
      saveData(projects, projectsJsonPath)

      // test(project)

      let resultsPath = path.join(pathProjects, project.slug, 'a11y-issues.json')
      saveData(res, resultsPath)
    }

  })
