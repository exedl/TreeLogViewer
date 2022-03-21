/*
    Test
*/

const {app, BrowserWindow} = require('electron')
const path = require('path')
const ipc = require('electron').ipcMain;
const dialog = require('electron').dialog;
const fs = require('fs');
const console = require('console');

const iconv = require('iconv');

const { EOL } = require('os');
const { Iconv } = require('iconv');

app.console = new console.Console(process.stdout, process.stderr);

let mainWindow = null;

let parsed_files = [];
let file_arr = [];
let files = [];

let last_search_result = [];

function createWindow () {
    mainWindow = new BrowserWindow({
        width: 970,
        height: 610,
        useContentSize: true,
        resizable: false,
        maximizable: false,
        frame: false,
        transparent: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    mainWindow.loadFile('MainWindow.html');
    mainWindow.removeMenu();

    //mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    })
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

ipc.on('close-app', (event, message) => {
    mainWindow.close();
});

ipc.on('open-file', (event, message) => {
    dialog.showOpenDialog({
        properties: ['openFile']
    }).then(result => {
        if (!result.canceled) {
            fs.readFile(result.filePaths[0], '', (err, data) => {
                if (err) {
                    dialog.showMessageBox(mainWindow, {
                        message: 'Error while loading file',
                        type: 'error'
                    });
                    return;
                }

                if (message.encoding == 'utf-8') {
                    data = data.replace(/^.*?│/s, '│');
                } else {
                    try {
                        var iconv = new Iconv(message.encoding, 'utf-8');
                        var buffer = iconv.convert(data);
                        data = buffer.toString('utf8').replace(/^.*?│/s, '│');
                    } catch (e) {
                        dialog.showMessageBox(mainWindow, {
                            message: 'Please check origin file encoding',
                            type: 'error'
                        });
                        return;
                    }
                }

                files = [];

                file_arr = data.split(EOL);
                parsed_files = loadDir();

                mainWindow.webContents.send('parsed-files', parsed_files);
            });
        }
    });
});

ipc.on('save-file', (event, message) => {
    dialog.showSaveDialog({
        properties: ['saveFile'],
        filters: [{
            name: 'Text document',
            extensions: ['txt']
          }]
    }).then(result => {
        if (!result.canceled) {
            var file = [];
            for (var i in last_search_result) {
                file.push(last_search_result[i].path);
            }

            file = file.join(EOL);

            fs.writeFile(result.filePath, file, function (err, data) {
                if (err) {
                    dialog.showMessageBox(mainWindow, {
                        message: 'Error while saving file (path ' + result.filePath + ')',
                        type: 'error'
                    });
                    return;
                }

                dialog.showMessageBox(mainWindow, {
                    message: 'Saved!',
                    type: 'info'
                });
            });
        }
    });
});

ipc.on('get-dir', (event, message) => {
    mainWindow.webContents.send('get-dir', {
        parent_id: message.parent_id,
        dir: loadDir(message.path, message.line),
        path: message.path + '/',
        nesting: message.nesting+1
    });
});

ipc.on('search', (event, message) => {
    last_search_result = search(message);
    mainWindow.webContents.send('search', last_search_result);
});

/*
    Delete all except file name
*/
function clearName(name) {
    return name.replace(new RegExp('^[│├└ ]{1,}([│─]{0,})( *?)((\\.|\\w|\\d).*?$)'), '$3');
}

/*
    Check if name is empty (removing all spaces)
*/
function isEmpty(name) {
    return (name.replaceAll(' ', '') === '');
}

/*
    Load directory (files and folders)
    *) load top dir (path = '', line = 0)
    *) load path (path != '', line >= 0)
*/
function loadDir(path = '', line = 0) {
    if (path === '') {
        //load top dir
        for (var i=0; i<file_arr.length; i++) {
            if (/^│   \w{1,}/.test(file_arr[i])) {
                //is file
                var clear_name = clearName(file_arr[i]);

                files.push(clear_name);
            }
    
            if (/^├─*?(\.|\w|\d)/.test(file_arr[i]) || /^└─*?(\.|\w|\d)/.test(file_arr[i])) {
                //is dir
                var clear_name = clearName(file_arr[i]);
                files[clear_name] = [i];
            }
        }
        
        return files;
    } else {
        //load path on line
        path = path.split('/');
        return getDir('', line, path.length+1);
    }
}

/*
    Get dir content
*/
function getDir(dirname, line = 0, nesting = 1) {
    var files = [];

    for (var i=line+1; i<file_arr.length; i++) {
        var regex = new RegExp('^(│| )[│ ]{' + ((nesting*4)-1) + '}(\\.|\\w|\\d)', '');

        //file
        if (file_arr[i].match(regex) !== null && !(/├─*?(\.|\w|\d)/.test(file_arr[i]) || /└─*?(\.|\w|\d)/.test(file_arr[i]))) {
            var clear_name = clearName(file_arr[i]);
            if (!isEmpty(clear_name))
                files.push(clearName(file_arr[i]));

            continue;
        }

        //folder
        var regex = new RegExp('^(│| )[ │├─└]{' + ((nesting*4)-1) + '}(\\.|\\w|\\d)', '');
        if (file_arr[i].match(regex) !== null) {
            files[clearName(file_arr[i])] = [i];
        }

         //end of folder (found next folder)
        var regex = new RegExp('^(│| )[ │├─└]{' + (((nesting-1)*4)-1) + '}(\\.|\\w|\\d)', '');
        if (file_arr[i].match(regex) !== null) {
            return files;
        }

        //end of folder (empty line)
        if (/^│ *?$/.test(file_arr[i]) || /^ *?$/.test(file_arr[i])) {
            return files;
        }
    }
}

/*
    Search for file or folder

    ***Not case sensitive***
*/
function search(name) {
    if (name.length < 3)
        return [];

    var lines = [];
    var result = [];

    for (var i=0; i<file_arr.length; i++) {
        if (file_arr[i].toLowerCase().indexOf(name.toLowerCase()) > 0) {
            if (/^([│ ]{0,})(\.|\w|\d)/.test(file_arr[i])) {
                lines.push({type: "file", line: i});
            } else {
                lines.push({type: "folder", line: i});
            }
            
        }
    }

    for (var i in lines) {
        result.push({
            type: lines[i].type,
            path: reverseDir(lines[i].line).join('/')
        });
    }

    return result;
}

/*
    Get location to folder or dir
*/
function reverseDir(line) {
    var regex = new RegExp('^([│├└─ ]{0,})(\\.|\\w|\\d)', '');
    var match = file_arr[line].match(regex);

    if (match === null)
        return [];

    var nesting = (match[1].length)-4;

    var next = '^([│├└─ ]{' + nesting + '})(\\.|\\w|\\d)';
    var regex = new RegExp(next, '');

    var result = [];
    result.push(clearName(file_arr[line]));

    for (var i=line-1; i>0; i--) {
        if (file_arr[i].match(regex) !== null) {
            result.unshift(clearName(file_arr[i]));

            if (nesting == 4) {
                return result;
            } else {
                nesting -= 4;
                var next = '^([│├└─ ]{' + nesting + '})(\\.|\\w|\\d)';
                var regex = new RegExp(next, '');
            }
        }
    }

    return result;
}