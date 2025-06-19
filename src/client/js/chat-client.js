var global = require('./global');

class ChatClient {
    constructor(params) {
        this.canvas = global.canvas;
        this.socket = global.socket;
        this.mobile = global.mobile;
        this.player = global.player;
        var self = this;
        this.commands = {};
        var input = document.getElementById('chatInput');
        input.addEventListener('keypress', this.sendChat.bind(this));
        input.addEventListener('keyup', function(key) {
            input = document.getElementById('chatInput');
            key = key.which || key.keyCode;
            if (key === global.KEY_ESC) {
                input.value = '';
                self.canvas.cv.focus();
            }
        });
        global.chatClient = this;
    }

    // TODO: Break out many of these GameControls into separate classes.

    registerFunctions() {
        var self = this;
        this.registerCommand('ping', '检查网络延迟', function () {
            self.checkLatency();
        });

        this.registerCommand('dark', '切换夜间模式', function () {
            self.toggleDarkMode();
        });

        this.registerCommand('border', '切换边界显示', function () {
            self.toggleBorder();
        });

        this.registerCommand('mass', '切换体积显示', function () {
            self.toggleMass();
        });

        this.registerCommand('continuity', '切换连续移动', function () {
            self.toggleContinuity();
        });

        this.registerCommand('roundfood', '切换圆形能量点', function (args) {
            self.toggleRoundFood(args);
        });

        this.registerCommand('help', '显示命令帮助信息', function () {
            self.printHelp();
        });

        this.registerCommand('login', '管理员登录', function (args) {
            self.socket.emit('pass', args);
        });

        this.registerCommand('kick', '踢出玩家 (仅管理员)', function (args) {
            self.socket.emit('kick', args);
        });
        global.chatClient = this;
    }

    // Chat box implementation for the users.
    addChatLine(name, message, me) {
        if (this.mobile) {
            return;
        }
        var newline = document.createElement('li');

        // Colours the chat input correctly.
        newline.className = (me) ? 'me' : 'friend';
        newline.innerHTML = '<b>' + ((name.length < 1) ? '匿名泡泡' : name) + '</b>: ' + message;

        this.appendMessage(newline);
    }

    // Chat box implementation for the system.
    addSystemLine(message) {
        if (this.mobile) {
            return;
        }
        var newline = document.createElement('li');

        // Colours the chat input correctly.
        newline.className = 'system';
        newline.innerHTML = message;

        // Append messages to the logs.
        this.appendMessage(newline);
    }

    // Places the message DOM node into the chat box.
    appendMessage(node) {
        if (this.mobile) {
            return;
        }
        var chatList = document.getElementById('chatList');
        if (chatList.childNodes.length > 10) {
            chatList.removeChild(chatList.childNodes[0]);
        }
        chatList.appendChild(node);
    }

    // Sends a message or executes a command on the click of enter.
    sendChat(key) {
        var commands = this.commands,
            input = document.getElementById('chatInput');

        key = key.which || key.keyCode;

        if (key === global.KEY_ENTER) {
            var text = input.value.replace(/(<([^>]+)>)/ig,'');
            if (text !== '') {

                // Chat command.
                if (text.indexOf('-') === 0) {
                    var args = text.substring(1).split(' ');
                    if (commands[args[0]]) {
                        commands[args[0]].callback(args.slice(1));
                    } else {
                        this.addSystemLine('未知命令: ' + text + '，输入 -help 查看帮助信息');
                    }

                // Allows for regular messages to be sent to the server.
                } else {
                    this.socket.emit('playerChat', { sender: this.player.name, message: text });
                    this.addChatLine(this.player.name, text, true);
                }

                // Resets input.
                input.value = '';
                this.canvas.cv.focus();
            }
        }
    }

    // Allows for addition of commands.
    registerCommand(name, description, callback) {
        this.commands[name] = {
            description: description,
            callback: callback
        };
    }

    // Allows help to print the list of all the commands and their descriptions.
    printHelp() {
        var commands = this.commands;
        for (var cmd in commands) {
            if (commands.hasOwnProperty(cmd)) {
                this.addSystemLine('-' + cmd + ': ' + commands[cmd].description);
            }
        }
    }

    checkLatency() {
        // Ping.
        global.startPingTime = Date.now();
        this.socket.emit('pingcheck');
    }

    toggleDarkMode() {
        var LIGHT = '#f2fbff',
            DARK = '#181818';
        var LINELIGHT = '#000000',
            LINEDARK = '#ffffff';

        if (global.backgroundColor === LIGHT) {
            global.backgroundColor = DARK;
            global.lineColor = LINEDARK;
            this.addSystemLine('🌙 夜间模式已开启');
        } else {
            global.backgroundColor = LIGHT;
            global.lineColor = LINELIGHT;
            this.addSystemLine('☀️ 夜间模式已关闭');
        }
    }

    toggleBorder() {
        if (!global.borderDraw) {
            global.borderDraw = true;
            this.addSystemLine('🔲 边界显示已开启');
        } else {
            global.borderDraw = false;
            this.addSystemLine('🔲 边界显示已关闭');
        }
    }

    toggleMass() {
        if (global.toggleMassState === 0) {
            global.toggleMassState = 1;
            this.addSystemLine('📊 体积显示已开启');
        } else {
            global.toggleMassState = 0;
            this.addSystemLine('📊 体积显示已关闭');
        }
    }

    toggleContinuity() {
        if (!global.continuity) {
            global.continuity = true;
            this.addSystemLine('🔄 连续移动已开启');
        } else {
            global.continuity = false;
            this.addSystemLine('🔄 连续移动已关闭');
        }
    }

    toggleRoundFood(args) {
        if (args || global.foodSides < 10) {
            global.foodSides = (args && !isNaN(args[0]) && +args[0] >= 3) ? +args[0] : 10;
            this.addSystemLine('🍬 能量点现在是圆形的！');
        } else {
            global.foodSides = 5;
            this.addSystemLine('🍬 能量点不再是圆形的！');
        }
    }
}

module.exports = ChatClient;
