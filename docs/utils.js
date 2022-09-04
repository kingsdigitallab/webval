(function(exports){

    function base64Encode(str) {
        if (typeof window !== 'undefined') {
            return btoa(str)
        } else {
            return Buffer.from(str).toString('base64')
        }
    }

    // client-side
    exports.readGithubJsonFile = async function(filePath, octokit) {
        let ret = null
        let res = null
        if (octokit) {
            let getUrl = `https://api.github.com/repos/kingsdigitallab/webval/contents/${filePath}`
            try {
                res = await octokit.request(`GET ${getUrl}`, {
                    headers: {
                        'If-None-Match': ''
                    }                    
                })
                res = res.data
            } catch (err) {
                console.log(err)
            }
        } else {
            if (0) {
                // we don't use octokit here 
                // as we want this call to work without a github PAT
                // https://stackoverflow.com/a/42518434
                // TODO: use Octokit is PAT provided, so we don't exceed rate limits
                let getUrl = `https://api.github.com/repos/kingsdigitallab/webval/contents/${filePath}`

                // let res = await fetch(getUrl, {cache: "no-cache"})
                let res = await fetch(getUrl)
                if (res && res.status == 200) {
                    res = await res.json()
                }
            } else {
                // TODO: simple relative fetch, no sha
                let getUrl = `../${filePath}`
                let res = null
                res = await fetch(getUrl)
                if (res && res.status == 200) {
                    ret = {
                        data: await res.json(),
                        sha: null
                    }
                }
                res = null
            }
        }

        if (res) {
            ret = {
                data: JSON.parse(atob(res.content)),
                sha: res.sha
            }
        }

        return ret
    }

    // client-side
    exports.updateGithubJsonFile = async function(filePath, data, octokit, sha=null) {
        let res = null
        let options = {
            owner: 'kingsdigitallab',
            repo: 'webval',
            // path: `projects/${this.selection.project}/a11y-issues.json`,
            path: filePath,
            message: `Commented ${filePath}`,
            content: base64Encode(JSON.stringify(data, null, 2))
        }
        
        // TODO: sha should be obtained when we read the file the first time in the UI
        // and then passed here. Otherwise conflict detection won't work.
        // get the file sha
        if (!sha) {
            let getUrl = `https://api.github.com/repos/kingsdigitallab/webval/contents/${filePath}`

            res = await fetch(getUrl)
            if (res && res.status == 200) {
                res = await res.json()
                sha = res.sha
            }
        }

        if (sha) {
            console.log(sha)
            options.sha = sha
        }
        if (1) {
            res = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', options)
        }

        let ret = res.data.content.sha
        console.log(ret)

        return ret
    }

    // server-side
    exports.copyScreenshots = function(projectSlug, source, target) {
        const path = require('path')
        const fs = require('fs')
        const pathScripts = __dirname
        const screenshotsPath = path.join(pathScripts, '..', 'projects', projectSlug, 'screenshots') 
        const shotDirs = [
            path.join(screenshotsPath, source),
            path.join(screenshotsPath, target),
        ]
        fs.readdirSync(shotDirs[0]).forEach(filename => {
            fs.copyFileSync(path.join(shotDirs[0], filename), path.join(shotDirs[1], filename))
            // console.log(`${path.join(shotDirs[0], filename)} -> ${path.join(shotDirs[1], filename)}`)
        });    
    }

    // server-side
    exports.compareScreenshots = function(projectSlug, folderA, folderB) {
        const path = require('path')
        const fs = require('fs')
        const pathScripts = __dirname
        const screenshotsPath = path.join(pathScripts, '..', 'projects', projectSlug, 'screenshots') 
        const BlinkDiff = require('blink-diff')

        const diffDirName = `${folderA}-${folderB}`

        const shotDirs = [folderA, folderB, diffDirName].map(p => path.join(screenshotsPath, p))
        fs.mkdirSync(shotDirs[2], {recursive: true})

        fs.readdirSync(shotDirs[0]).forEach(async filename => {
            let paths = shotDirs.map(p => path.join(p, filename))
            if (fs.existsSync(paths[1])) {

                var diff = new BlinkDiff({
                    imageAPath: paths[0], // Use already loaded image for first image
                    imageBPath: paths[1], // Use file-path to select image
            
                    delta: 20, // Make comparison more tolerant
                    
                    outputMaskRed: 255,
                    outputMaskBlue: 0, // Use blue for highlighting differences
                    
                    hideShift: true, // Hide anti-aliasing differences - will still determine but not showing it
            
                    imageOutputPath: paths[2],
                    composition: false,
                });
            
                diff.run(function (error, result) {
                if (error) {
                    throw error;
                } else {
                    // console.log(diff.hasPassed(result.code) ? 'Passed' : 'Failed');
                    // console.log('Found ' + result.differences + ' differences.');
                    // console.log(paths[2])
                }
                });
            }
        });    
    }

})(typeof exports === 'undefined'? this['utils']={}: exports);
