const http = require('http');
const git = require('nodegit');
const path = require('path');
const fs = require('fs');
const ncp = require('ncp').ncp;
const chalk = require('chalk');
const config = require('./config');

function clearDir(root) {
    try {
        let files = fs.readdirSync(root);
        files.forEach(file => {
            const currPath = path.join(root, `./${file}`);
            if (fs.statSync(currPath).isDirectory()) {
                clearDir(currPath);
                fs.rmdirSync(currPath);
            } else {
                fs.unlinkSync(currPath);
            }
        })
    } catch (err) {
        console.log(chalk.bgRed(chalk.white(err)));
    }
}



http.createServer((req, res) => {
    // 如果是post请求，获取postdata
    if (req.method === 'POST') {
        let postData = '';
        req.on('data', chunk => {
            postData += chunk;
        });
        req.on('end', () => {
            const data = JSON.parse(postData);
            const cloneURL = data.repository.clone_url;
            if (cloneURL === config.remoteGitURL) {
                const tmpPath = path.resolve(__dirname, config.tmpResPath);
                if (fs.existsSync(tmpPath)) {
                    clearDir(tmpPath);
                } else {
                    fs.mkdir(tmpPath, err => {
                        console.log(chalk.bgRed(chalk.white(err)));
                    });
                }
                git.Clone(cloneURL, tmpPath).then((res) => {
                    chalk.bgGreen(chalk.white('Updated: ' + data.repository.updated_at));
                    ncp(tmpPath, config.targetPath, err => {
                        if (err) {
                            console.log(chalk.bgRed(chalk.white(err)));
                        }
                    })

                }).catch((err) => {
                    chalk.bgRed(chalk.white(err));
                })
            }

            res.end();
        })
    }
}).listen(config.serverPort);