const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;
const sizeOf = require('image-size');
const { getPath } = require('./shortcuts');

const fileType = {
    DIR: 'dir',
    IMG: 'img',
    VIDEO: 'video',
    PDF: 'pdf',
    MUSIC: 'music',
    OTHER: 'other'
};
const fileExName = {
    IMG: ['.jpg', '.jpeg', '.gif', '.webp', '.png', '.bmp', '.svg'],
    PDF: ['.pdf'],
    VIDEO: ['.mp4', '.flv', '.wmv'],
    MUSIC: ['.mp3', '.wav', '.flac']
}

/**
 * 获取一个文件夹中的所有文件，包括子文件
 * @param {string} dirPath 文件夹地址
 * @return {string[]} 文件地址列表
 */
function dirAll(dirPath) {
    const fileResult = [];
    const dirPathArray = fs.readdirSync(dirPath);
    dirPathArray.forEach(filePath => {
        filePath = path.join(dirPath, filePath);
        const stat = fs.statSync(filePath);
        filePath = stat.isDirectory() ? dirAll(filePath) : [filePath]
        fileResult.push(...filePath);
    });
    return fileResult;
}

function dirSearch(dirPath, toolPath) {
    const dirPathArray = fs.readdirSync(dirPath);
    const searchResult = [];
    dirPathArray.forEach(fileName => {
        filePath = path.join(dirPath, fileName);
        const type = checkFileType(filePath, toolPath);
        searchResult.push({
            fileName,
            filePath: type[1],
            fileType: type[0],
            previewSize: type[2]
        });
    });
    return searchResult;
}

/**
 * 检查文件类型
 * @param {string} filePath 文件地址
 * @param {string} toolPath 视频处理工具地址
 * @returns {string[]}
 */
function checkFileType(filePath, toolPath) {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
        return [fileType.DIR, filePath, { width: 100, height: 100, type: 'png' }];
    } else if (stat.isFile(filePath)) {
        let exName = path.extname(filePath);
        if (!exName) {
            return [fileType.OTHER, filePath, { width: 100, height: 100, type: 'png' }];
        } else {
            exName = exName.toLowerCase();
            if (~fileExName.IMG.indexOf(exName)) {
                return [fileType.IMG, filePath, sizeOf(filePath)];
            }
            if (~fileExName.VIDEO.indexOf(exName)) {
                console.log(toolPath);
                console.log(filePath);
                let size = execSync(`${toolPath.ffprobePath} -v quiet -select_streams v -show_entries stream=width,height "${filePath}"`);
                size = size.toString().split('\n');
                size = { width: parseInt(size[1].replace('width=', '')), height: parseInt(size[2].replace('height=', '')), type: 'jpeg' };
                return [fileType.VIDEO, filePath, size];
            }
            if (~fileExName.PDF.indexOf(exName)) {
                console.log(toolPath);
                const tmpFile = path.join(toolPath.tempPath, new Date().getTime() + '.jpeg');
                // execSync(`${toolPath.gsPath} -sDEVICE=jpeg -dFirstPage=1 -dLastPage=1 -sOutputFile=${tmpFile} ${filePath}`);
                // return [fileType.PDF, filePath, sizeOf(tmpFile)];
                return [fileType.PDF, filePath, { width: 100, height: 100, type: 'svg' }];
            }
            if (~fileExName.MUSIC.indexOf(exName)) {
                return [fileType.MUSIC, filePath, { width: 100, height: 100, type: 'svg' }];
            }
            if (exName === '.lnk') {
                filePath = getPath(filePath);
                return checkFileType(filePath, toolPath);
            }
            return [fileType.OTHER, filePath, { width: 100, height: 100, type: 'svg' }];
        }
    }
    return [fileType.OTHER, filePath, { width: 100, height: 100, type: 'svg' }];
}

module.exports = { dirAll, dirSearch, checkFileType, fileExName, fileType };