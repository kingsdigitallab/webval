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
  fs.mkdirSync(parentPath, {recursive: true})

  console.log('  WRITE ' + apath)
  fs.writeFileSync(apath, JSON.stringify(data, null, 1), "utf8")
}

function test(project) {
  let ret = false
  console.log(project.slug)

  const projects2 = require(projectsJsonPath)
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

  console.log(issue)
  
  let parts = issue.code.split('.')
  // console.log(issue.code)

  let taxonomy = parts[3].split('_')

  issue.rule = {
    standard: parts[0].substring(0, 5),
    // unreliable, Pa11y always output AA!
    // level: parts[0].substring(5),
    principle: taxonomy[0],
    guideline: taxonomy[1],
    rule: taxonomy[2],
    code: parts[4],
    target: parts.filter((e,i) => i > 4).join('.'),
  }
}

function getKeyFromIssue(issue, includeWebPath=false) {
  let ret = `${issue.code}|${issue.context}|${issue.selector}`
  if (includeWebPath) {
    ret = `${issue.webpath}|` + ret
  }
  ret = hashCode(ret)
  return ret
}

/**
 * Returns a hash code from a string
 * @param  {String} str The string to hash.
 * @return {Number}    A 32bit integer
 * @see http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 * @see https://stackoverflow.com/a/8831937
 */
 function hashCode(str) {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
      let chr = str.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

projects
  .filter(project => (project?.slug == toEvaluate.slug))
  .forEach(async (project) => {
    project.a11y.evaluationStarted = new Date().toISOString()

    let resultsPath = path.join(pathProjects, project.slug, 'a11y-issues.json')

    // console.log(project.a11y)
    let baseUri = project.sites.liv
    console.log(`Project ${project.name} ${baseUri}`)

    // TODO: create path to output if absent
    // TODO: add axe rules
    
    let res = {
      "meta": {},
      "issues": {},
      "annotations": {}
    }
    if (fs.existsSync(resultsPath)) {
      res = require(resultsPath)
    }

    let issues = res.issues

    let issueKeys = {}

    if (1) {
      for (let webpath of project.a11y.urls) {
        console.log(`  PA11Y ${webpath}`)
        let results = null
        try {
          results = await pa11y(baseUri + webpath, pa11yCiConfig.defaults)
        } catch(err) {
          console.log(err.message)
        }
        
        for (let issue of results.issues) {
          issue.host = baseUri
          issue.webpath = webpath
          
          // ignore duplicate issues during this evaluation
          let issueKey = getKeyFromIssue(issue)
          if (issueKeys[issueKey]) continue

          // merge with previous issue (to preserve annotations)
          let issueKeyAbsolute = getKeyFromIssue(issue, true)
          issues[issueKeyAbsolute] = issue

          // update issue 
          setIssueRuleFromIssueCode(issue)
          console.log(issue)
          issue.detected = project.a11y.evaluationStarted
          issue.hash = issueKeyAbsolute
          if (!res.annotations[issueKeyAbsolute]) {
            res.annotations[issueKeyAbsolute] = {}
          }
          res.annotations[issueKeyAbsolute].resolution = 'Todo'

          issueKeys[issueKey] = 1
        } 
      }

      project.a11y.evaluationEnded = new Date().toISOString()

      // remove legacy fields
      delete project.a11y.status
      delete project.a11y.evaluated
      delete project.a11y.evaluationEnd
      delete project.a11y.evaluationStart

      if (!res?.meta) {
        res.meta = {}
      }
      if (!res?.annotations) {
        res.annotations = {}
      }

      res.meta.version = '0.1.0'
      res.meta.evaluationStarted = project.a11y.evaluationStarted
      res.meta.evaluationEnded = project.a11y.evaluationEnded

      if (1) {
        // console.log(projectsJsonPath)
        saveData(projects, projectsJsonPath)

        // test(project)
        saveData(res, resultsPath)
      }
    }

  })
