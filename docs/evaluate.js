const currentVersion = '0.3.0'
const path = require('path')
const pathScripts = __dirname
const pathProjects = path.join(pathScripts, '../projects') 

const projectsJsonPath = path.join(pathProjects, 'projects.json')
const toEvaluate = require(path.join(pathProjects, 'evaluate.json'))
const rules = require(path.join(pathProjects, 'rules.json'))

const projects = require(projectsJsonPath);
const pa11yCiConfig = require(path.join(pathProjects, 'pa11y-ci.json'))
const fs = require("fs");
const { execSync } = require('child_process');
const pa11y = require('pa11y');
const utils = require('./utils');
const { exit } = require('process')

function saveData(data, apath) {
  parentPath = path.dirname(apath);
  fs.mkdirSync(parentPath, {recursive: true})

  console.log('  WRITE ' + apath)
  fs.writeFileSync(apath, JSON.stringify(data, null, 1), "utf8")
}

function setIssueRuleFromIssueCode(issue) {
  // set issue.rule with WCAG numbers
  // return issue.rule on success
  // return null if issue isn't a recognised WCAG rule

  let ret = null

  // console.log(issue)

  let taxonomy = null

  if (issue.runner == 'axe') {
    let taxonomies = rules['axe-core-to-wcag'][issue.code]
    if (taxonomies) {
      taxonomy = taxonomies[0].split('.')
      ret = {
        standard: 'WCAG2',
        code: '',
        target: '',
      }
    }
  }
  if (issue.runner == 'htmlcs') {
    // code: 'WCAG2AA.Principle4.Guideline4_1.4_1_2.H91.Select.Name'
    // part:  0       1          2            3     4   5      6
    let parts = issue.code.split('.')
    taxonomy = parts[3].split('_')
    ret = {
      standard: parts[0].substring(0, 5),
      // unreliable, Pa11y always output AA!
      // level: parts[0].substring(5),
      code: parts[4],
      target: parts.filter((e,i) => i > 4).join('.'),
    }
  }

  if (taxonomy && ret) {
    ret.principle = taxonomy[0]
    ret.guideline = taxonomy[1]
    ret.rule = taxonomy[2]  
  }

  if (ret) {
    issue.rule = ret
  } else {
    // console.log(`    Could not map issue [${issue.runner}:${issue.code}] to WCAG rule.`)
  }

  return ret
}

function getDetectedIssuesCount(results) {
  let ret = Object.values(results.issues).filter(issue => issue.detected == results.meta.evaluationStarted).length
  return ret 
}

// returns a normalised version string (e.g. '0.1.2' => '0000.0001.0002')
// to facilitate comparisons.
function normaliseVersion(version) {
  let ret = (version.split('.').map((m) => m.padStart(4, '0'))).join('.')
  return ret
}

function changeIssueHash(evaluation, oldKey, newKey, version) {
  let issue = evaluation.issues[oldKey]
  if (oldKey != newKey) {
    // change key of issue
    if (normaliseVersion(version) < normaliseVersion('0.2.0')) {
      issue.hash = newKey
    } else {
      issue.id = newKey
      delete issue.hash
    }
    delete evaluation.issues[oldKey]
    evaluation.issues[newKey] = issue

    // change key of annotation
    let annotation = evaluation.annotations[oldKey]
    if (annotation) {
      evaluation.annotations[newKey] = annotation
      delete evaluation.annotations[oldKey]
    }
  }
}

function upgradeEvaluationData(evaluation) {
  // 1. is the data older than currentVersion?
  let version = evaluation?.meta?.version || '0.0.0'

  if (normaliseVersion(version) < normaliseVersion(currentVersion)) {
    console.log(`Upgrade evaluation data: ${version} -> ${currentVersion}`)

    if (normaliseVersion(version) < normaliseVersion('0.2.0')) {
      console.log('  upgrade issue hashes')
      for (let oldKey of Object.keys(evaluation.issues)) {
        let issue = evaluation.issues[oldKey]
        let newKey = utils.getKeyFromIssue(issue, true)
        changeIssueHash(evaluation, oldKey, newKey, version)
      }
    }
    if (normaliseVersion(version) < normaliseVersion('0.3.0')) {
      console.log('  issue keys=hash=unique number from sequence')
      evaluation.meta.lastIssueId = 0
      for (let oldKey of Object.keys(evaluation.issues)) {
        let newKey = (++evaluation.meta.lastIssueId)
        changeIssueHash(evaluation, oldKey, newKey, version)
      }
    }
  }
}

function evaluate() {
  // read optional command line arguments
  // node evaluate.js PROJECTSLUG DOMAIN
  let projectSlug = toEvaluate.slug
  let projectDomain = ''
  let argScriptIndex = null
  process.argv.forEach(function (val, index, array) {
    if (argScriptIndex === null) {
      if (val.endsWith('.js')) {
        argScriptIndex = index + 1
      }
    } else {
      let indexRel = index - argScriptIndex
      if (indexRel == 0) {
        projectSlug = val
      }
      if (indexRel == 1) {
        projectDomain = val
      }
    }
  });

  projects
    .filter(project => (project?.slug == projectSlug))
    .forEach(async (project) => {
      project.a11y.evaluationStarted = new Date().toISOString()

      let resultsPath = path.join(pathProjects, project.slug, 'a11y-issues.json')

      // create screenshots subdirs
      let screenshotsPath = path.join(pathProjects, project.slug, 'screenshots')
      fs.mkdirSync(screenshotsPath, {recursive: true})
      for (let name of ['last', 'previous', 'accepted']) {
        fs.mkdirSync(path.join(screenshotsPath, name), {recursive: true})
      }
      
      // copy from screenshots/last/*.png to screenshots/previous/
      utils.copyScreenshots(project.slug, 'last', 'previous')

      // console.log(project.a11y)
      let baseUri = projectDomain || project.sites.liv
      console.log(`Project ${project.name} ${baseUri}`)

      // TODO: create path to output if absent
      let res = {
        "meta": {},
        "issues": {},
        "annotations": {}
      }
      if (fs.existsSync(resultsPath)) {
        res = require(resultsPath)
      }

      upgradeEvaluationData(res)
      // console.log(res)

      let issues = res.issues

      let issuesBefore = getDetectedIssuesCount(res)

      let issueKeys = {}

      if (1) {
        for (let webpath of project.a11y.urls) {
          console.log(`  PA11Y ${webpath}`)
          let results = null
          let options = pa11yCiConfig.defaults

          let pathSlug = webpath.replace(/\W+/g, '-')
          options.screenCapture = `${screenshotsPath}/last/${pathSlug}.png`
          try {
            results = await pa11y(baseUri + webpath, options)
          } catch(err) {
            console.log(err.message)
            exit(-1)
          }
          
          for (let issue of results.issues) {
            issue.host = baseUri
            issue.webpath = webpath
            
            // update issue 
            if (setIssueRuleFromIssueCode(issue)) {
              // ignore duplicate issues (code, context, selector) during this evaluation
              let issueKey = utils.getKeyFromIssue(issue)

              if (issueKeys[issueKey]) continue

              if (isIssueUnreliable(issue)) continue;

              // overwrite existing issue
              let issueId = (++res.meta.lastIssueId)

              // let issueKeyAbsolute = utils.getKeyFromIssue(issue, true)
              issues[issueId] = issue

              // console.log(issue)
              issue.detected = project.a11y.evaluationStarted
              issue.id = issueId
              if (!res.annotations[issueId]) {
                res.annotations[issueId] = {
                  resolution: 'Todo'
                }
              }

              issueKeys[issueKey] = 1
            }
          } 
        }

        project.screenshots = await utils.compareScreenshots(project.slug, 'accepted', 'last', 'accepted-last')

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

        res.meta.host = baseUri
        res.meta.version = currentVersion
        res.meta.evaluationStarted = project.a11y.evaluationStarted
        res.meta.evaluationEnded = project.a11y.evaluationEnded

        if (1) {
          // console.log(projectsJsonPath)
          saveData(projects, projectsJsonPath)

          saveData(res, resultsPath)
        }

        let issuesAfter = getDetectedIssuesCount(res)
        console.log(`Detected issues (before) ${issuesBefore} -> ${issuesAfter} (now)`)
      }

    })
}

function isIssueUnreliable(issue) {
  // return true if the issue is just a warning or possibly a false positive
  // see https://github.com/kingsdigitallab/webval/issues/17
  // e.g. Axe contrast warnings are relayed as errors by Pa11y.
  let ret = false;


  let code = `${issue.runner}.${issue.rule.principle}.${issue.rule.guideline}.${issue.rule.rule}`
  // console.log(code)
  // TODO: turn that into an exclusion array and move it to a constant
  if (code == 'axe.1.4.3') {
    ret = true;
    // console.log('UNRELIABLE')
  }

  return ret;
}

// ENTRY POINT

evaluate()
