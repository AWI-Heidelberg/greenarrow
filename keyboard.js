(function (window) {

var Keyboard = function() {
    var keyCodes = {};
    var keyNames = {
        // Controls
        "backspace": 8, "tab": 9, "return": 13, "shift": 16, "ctrl": 17, "alt": 18, "capslocks": 20,
        "esc": 27, "space": 32, "left": 37, "up": 38, "right": 39, "down": 40,
        "page-up": 33,  "page-down": 34, "end": 35, "home": 36,
        "insert": 45, "delete": 46,

        // Numbers
        "0": 48, "1": 49, "2": 50, "3": 51, "4": 52,
        "5": 53, "6": 54, "7": 55, "8": 56, "9": 57,

        // Alphabet
        "A": 65, "B": 66, "C": 67, "D": 68, "E": 69, "F": 70,
        "G": 71, "H": 72, "I": 73, "J": 74, "K": 75, "L": 76,
        "M": 77, "N": 78, "O": 79, "P": 80, "Q": 81, "R": 82,
        "S": 83, "T": 84, "U": 85, "V": 86, "W": 87, "X": 88,
        "Y": 89, "Z": 90,

        // FKeys
        "F1": 112,  "F2": 113,  "F3": 114,  "F4": 115,
        "F5": 116,  "F6": 117,  "F7": 118,  "F8": 119,
        "F9": 120, "F10": 121, "F11": 122, "F12": 123,

        // Special
        "windows-left": 91, "windows-right": 92
    };

    (function cacheCodes () {
        for (var name in keyNames) {
            if(!keyNames.hasOwnProperty(name)) {
                continue;
            }
            var code = keyNames[name];
            keyCodes[code] = name;
        }
    })();

    var self = this;
    self.map = {};
    var pause = false;

    self.register = function (keymap) {
        self.map = {};
        installActions(keymap);
        interceptKeypresses();
    }

    function installActions (keymap) {
        function mapActionToKey (key, action) {
            if(!(key in keyNames)) {
                return;
            }
            var code = keyNames[key];
            self.map[code] = action;
        };
        for(var key in keymap) {
            var action = keymap[key];
            mapActionToKey(key, action);
        };
    }

    function interceptKeypresses () {
        document.removeEventListener('keydown', recordAndAct);
        document.addEventListener('keydown', recordAndAct);
    }

    function recordAndAct (event_) {
        if(pause){
            return;
        }

        var key = event_.keyCode;
        recordPress(key);

        var action = self.map[key];
        if(!action) {
            return;
        }
        event_.preventDefault();
        action();
    }

    function recordPress (key) {
        var time = new Date();
        var keyName = findName(key);
        (self.record || function (code,name,time) {})(key, keyName, time);
    };

    function findName (key) {
        return keyCodes[key] || 'UnknownKey';
    }

    self.pause = function () {
        pause = true;
    };

    self.resume = function () {
        pause = false;
    };
};
window.Keyboard = Keyboard;
})(window);