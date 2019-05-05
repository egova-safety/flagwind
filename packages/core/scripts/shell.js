var shell = require('shelljs');

module.exports = {
    required: function () {
        var exit = false;
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] && !shell.which(arguments[i])) {
                shell.echo('Sorry, this script requires ' + arguments[i]);
                exit = true;
            }
        }
        if (exit) {
            shell.exit();
        }
    },
    exec: function (cmd, errorMsg) {
        console.log('[ Shell ]', cmd);
        var result = shell.exec(cmd);
        if (result.code !== 0) {
            if (errorMsg) {
                console.log('Error: ', errorMsg);
            }
            shell.exit();
        }
        return result;
    },
    cd: function (cmd) {
        console.log('[ Shell ]', 'cd' + cmd);
        if (shell.cd(cmd).code !== 0) {
            shell.exit();
        }
    }
}
