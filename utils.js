function base64Encode(str) {
    if (typeof window !== 'undefined') {
        return btoa(str)
    } else {
        return Buffer.from(str).toString('base64')
    }
}

export async function readGithubJsonFile(filePath) {
    // we don't use octokit here 
    // as we want this call to work without a github PAT
    let ret = null
    let getUrl = `https://api.github.com/repos/kingsdigitallab/webval/contents/${filePath}`

    let res = await fetch(getUrl)
    if (res && res.status == 200) {
        res = await res.json()
        ret = {
            data: JSON.parse(atob(res.content)),
            sha: res.sha
        }
        console.log(ret)
    }

    return ret
}

export async function updateGithubJsonFile(filePath, data, octokit) {
    let options = {
        owner: 'kingsdigitallab',
        repo: 'webval',
        // path: `projects/${this.selection.project}/a11y-issues.json`,
        path: filePath,
        message: `Commented ${filePath}`,
        content: base64Encode(JSON.stringify(data))
    }
    
    // TODO: sha should be obtained when we read the file the first time in the UI
    // and then passed here. Otherwise conflict detection won't work.
    // get the file sha
    let sha = ''
    let getUrl = `https://api.github.com/repos/kingsdigitallab/webval/contents/${filePath}`

    let res = null
    res = await fetch(getUrl)
    if (res && res.status == 200) {
        res = await res.json()
        sha = res.sha
    }

    if (sha) {
        options.sha = sha
    }
    if (1) {
        res = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', options)
    }
    console.log(res)
}



// module.exports = {
//     updateGithubJsonFile: updateGithubJsonFile
// }
