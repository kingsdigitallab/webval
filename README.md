# Webval

A [Web application](https://kingsdigitallab.github.io/webval/docs/) entirely hosted on github that lets you run accessibility evaluation on multiple pages for a collection of sites. The accessibility issues are saved in this repository and can be browsed and manually annotated to facilitate accessibility assessments, reviews, reporting and continuous testing.

[WCAG](https://www.w3.org/WAI/standards-guidelines/wcag/) 2.1 A & AA issues are reported by [Pa11y](https://pa11y.org/) (and detected by [HTML_CodeSniffer](https://github.com/squizlabs/HTML_CodeSniffer) and [axe-core](https://github.com/dequelabs/axe-core) engines). 

**Note that automated detection can only cover a minority of WCAG rules. The rest must be manually detected.**

[Additional information in the wiki](https://github.com/kingsdigitallab/webval/wiki/Webval-documentation)

[Report issues & suggest new features](https://github.com/kingsdigitallab/webval/issues)

## Features

* The same instance can manage **multiple sites** and **multiple pages** per site (see [config file](projects/projects.json))
* **Automatically detects, stores and reports** some of WCAG A & AA issues with details about location & problem
* Ability to manually **annotate** the issues (assigning a role, complexity, resolution status and a comment)
* **Manually** add and manage other issues not detected automatically 
* **Re-run automated tests** on the same pages & update issues without losing annotations
* Issues are **grouped by rules** for quick, high-level annotation
* **Filter** issues by level and resolution status
* **Summary** showing the number of issues per page and level
* Simple **visual regression tests** 
* Rule **tagging** system to help you categorise issues

## Architecture

* Web app and all data are stored on github and run off github servers
* Detection using [Pa11y](https://pa11y.org/) with html_codesniffer & Axe-Core engines
* Vue.js interface with default [Bulma](https://bulma.io/) styles
* Regression test using Pa11y & [Blink-diff](https://github.com/yahoo/blink-diff)

## TODO

* M further testing & debugging, interface improvements
* S allow multiple manual issues for same rule per page (by accepting selector)
* S documentation (how to add new project, etc.)
* C assist with report & assessment generation

[See the full list of github tickets](https://github.com/kingsdigitallab/webval/issues)

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


