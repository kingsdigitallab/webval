// fetch the WCAG rules from the specification doc.
// save them as a json file.
const fs = require("fs")
const path = require('path')
const uriRules = 'https://www.w3.org/TR/WCAG21'
const pathScripts = __dirname
const pathProjects = path.join(pathScripts, '../projects') 
const pathRules = path.join(pathProjects, 'rules.json')
const HTMLParser = require('node-html-parser')
const fetch = require('node-fetch')
const { exit } = require("process")

function saveData(data, apath) {
    parentPath = path.dirname(apath);
    fs.mkdirSync(parentPath, {recursive: true});

    console.log('  WRITE ' + apath)
    fs.writeFileSync(apath, JSON.stringify(data, null, 1), "utf8")
}

async function fetchDataFromWCAGPage() {
    /*   
    <section class="sc" id="link-purpose-link-only">
        <h4 id="x2-4-9-link-purpose-link-only">
            <span class="secno">Success Criterion 2.4.9 </span>Link Purpose (Link Only)
            <span class="permalink"><a href="#link-purpose-link-only" aria-label="Permalink for 2.4.9 Link Purpose (Link Only)" title="Permalink for 2.4.9 Link Purpose (Link Only)">
            <span>§</span></a></span></h4>

        <div class="doclinks">
            <a href="https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-link-only.html">Understanding Link Purpose (Link Only)</a> 
            <span class="screenreader">|</span> 
            <br>
            <a href="https://www.w3.org/WAI/WCAG21/quickref/#link-purpose-link-only">How to Meet Link Purpose (Link Only)</a>
        </div>
        <p class="conformance-level">(Level AAA)</p>
        
        <p>A <a href="#dfn-mechanism" class="internalDFN" data-link-type="dfn">mechanism</a> is available to allow the purpose of each link to be identified from link text alone,
        except where the purpose of the link would be <a href="#dfn-ambiguous-to-users-in-general" class="internalDFN" data-link-type="dfn">ambiguous to users in general</a>.
        </p>
    </section>

    =>

    '2.4.9' => {
        id: 'link-purpose-link-only',
        code: '2.4.9',
        title: 'Link Purpose (Link Only)',
        level: 'AAA',
        description: 'A mechanism is available to allow the purpose [...]'
    }
    */  

    let ret = {
        'meta': {
            'source': uriRules,
            'generated': new Date().toISOString()
        },
        'principles': {},
        'guidelines': {},
        'rules': {}
    }

    // fetch WCAG spec HTML doc
    res = await fetch(uriRules)
    if (res.status != 200) {
        console.log(res) 
        return ret
    }

    // rules
    const root = HTMLParser.parse(await res.text())
    let sections = root.querySelectorAll('section.sc')
    for (let section of sections) {
        let h4 = section.querySelector('h4')
        let code = h4.id.replace( new RegExp("^x((\\d+)-(\\d+)-(\\d+))-.*$","gm"),"$2.$3.$4")
        // console.log(h4)
        let ps = section.querySelectorAll('p')
        ret['rules'][code] = {
            id: section.id,
            code: code,
            title: h4.childNodes.map(cn => (cn?._rawText || '')).join(''),
            level: section.querySelector('.conformance-level').innerText.replace(
                new RegExp("\\(Level ([^)]+)\\)", 'gm'),
                '$1'
            ),
            description: ps[ps.length - 1].innerText.replace(new RegExp('\\s+', 'gm'), ' ')
        }
    }

    // guidelines
    sections = root.querySelectorAll('section.guideline')
    for (let section of sections) {
        let h3 = section.querySelector('h3')
        let code = h3.id.replace( new RegExp("^x((\\d+)-(\\d+))-.*$","gm"),"$2.$3")
        // console.log(h4)
        let ps = section.querySelectorAll('p')
        ret['guidelines'][code] = {
            id: section.id,
            code: code,
            title: h3.childNodes.map(cn => (cn?._rawText || '')).join(''),
            description: ps[0].innerText.replace(new RegExp('\\s+', 'gm'), ' ')
        }
    }

    // principles
    sections = root.querySelectorAll('section.principle')
    for (let section of sections) {
        let h2 = section.querySelector('h2')
        let code = h2.id.replace( new RegExp("^x((\\d+))-.*$","gm"),"$2")
        // console.log(h4)
        let ps = section.querySelectorAll('p')
        ret['principles'][code] = {
            id: section.id,
            code: code,
            title: h2.childNodes.map(cn => (cn?._rawText || '')).join(''),
            description: ps[0].innerText.replace(new RegExp('\\s+', 'gm'), ' ')
        }
    }
    
    return ret
}

async function fetchAndSaveRules() {
    let data = await fetchDataFromWCAGPage()
    console.log(`Found ${Object.keys(data.rules).length} rules`)

    data['axe-core-to-wcag'] = (await fetchDataFromAxeCore())['rules']

    saveData(data, pathRules)
}

fetchAndSaveRules()

const uriRulesCore = 'https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md'

async function fetchDataFromAxeCore() {
    let ret = {
        'meta': {
            'source': uriRulesCore,
            'generated': new Date().toISOString()
        },
        'rules': {},
    }

    // fetch WCAG spec HTML doc
    res = await fetch(uriRulesCore)
    if (res.status != 200) {
        console.log(res) 
        return ret
    }

    // rules
    const root = HTMLParser.parse(await res.text())
    let rows = root.querySelectorAll('tr')
    for (let row of rows) {
        let tds = row.querySelectorAll('td')
        if (tds.length > 4) {
            let tdCore = tds[0]
            // cat.semantics, wcag2aaa, wcag249
            let tdTags = tds[3].innerText
            code = tdCore.innerText

            wcagCodes = []
            for (let match of tdTags.matchAll(/wcag(\d)(\d)(\d)/g)) {
                codeWcag = `${match[1]}.${match[2]}.${match[3]}`
                wcagCodes.push(codeWcag)
            }
            if (wcagCodes.length) {
                ret.rules[code] = wcagCodes
            }
        }
    }

    return ret
}

