# Webval

A [Web application](https://kingsdigitallab.github.io/webval/docs/) hosted on gthub that lets you run accessibility evaluation on multiple pages for a collection of sites. The accessibility issues are saved in this repository and can be browsed and manually annotated to facilitate accessibility assessment, review and testing processes.

WCAG 2.1 A & AA issues are detected using Pa11y tool (html_cs engine and soon axe-core). **Note that automated detection only covers part of WCAG rules**.

## Features

* The same instance can manage multiple sites and multiple pages per site (see [config file](projects/projects.json))
* Automatically detects, store and report some of WCAG A & AA issues with details about location & problem
* Ability to manually annotate the issues (assigning a role, complexity, resolution status and a comment)
* Manually add issues not detected automatically 
* Re-run automated tests on the same pages & update issues without
losing annotations
* Filter issues by level and resolution status
* Summary showing the number of issues per page and level
* Simple visual regression tests

## Architecture

* Web app and all data are stored on github and run off github servers
* Detection using Pa11y with html_codesniffer
* Vue.js interface with default Bulma styles
* Regression test using Pa11y & Resemble.js

## TODO

* M further testing & debugging, interface improvements
* M simplify testing of stg/dev & local sites
* M keep some data private (e.g. estimates) or decoupled from web app logic
* M reduce risk of git conflicts, improve collborative work
* S allow multiple manual issues for same rule per page (by accepting selector)
* S more usable visual testing UI
* S documentation (how to add new project, etc.)
* S rule tagging
* C add axe-core engine
* C assist with report & assessment generation

## Testing locally

### One-off setup

1. clone this repository (`git clone git@github.com:kingsdigitallab/webval.git`)
2. change into that cloned folder (`cd webval`)
3. install the necessary packages: `npm i pa11y blink-diff`
4. if (3) fails, you may need to do this first:
   * [install nvm on your machine](https://github.com/nvm-sh/nvm#install--update-script)
   * restart your terminal session
   * install node.js and npm: `nvm i node`

### Evaluating a site running on your machine

(where `culturecase` is the name of the project to test, and `http://localhost:8000` is the root of the site running on your machine)

1. Evaluate your local site: `git pull && node docs/evaluate.js culturecase http://localhost:8000`
2. check the script ends with a message like this: `Detected issues (before) 84 -> 82 (now)` 
3. Push evaluation back to git: `git commit -am "pa11y evaluation" && git push`
4. Check the results and screenshots on the [live Webval app](https://kingsdigitallab.github.io/webval/docs/)


