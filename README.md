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
* Simple visual regression test

## Architecture

* Web app and all data are stored on github and run off github servers
* Detection using Pa11y with html_codesniffer
* Vue.js interface with default Bulma styles
* Regression test using Pa11y & Resemble.js

## TODO

* M further testing & debugging, interface improvements
* M issue grouping
* S improve manual annotations
* S ability to manage issues not covered by automated testers
* S documentation (how to add new project, etc.)
* C add axe-core engine
* C assist with report & assessment generation
* S rule tagging
