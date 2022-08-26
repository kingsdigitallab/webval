function base64Encode(str) {
    if (typeof window !== 'undefined') {
        return btoa(str)
    } else {
        return Buffer.from(str).toString('base64')
    }
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
