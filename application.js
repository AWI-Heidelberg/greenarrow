(function (window) {

    // Changable values
    var DURATION_IN_SECONDS = 12;
    var GRID_ROWS = 5;
    var GRID_COLUMNS = GRID_ROWS;

    var POSITIVE_PROBABILITY_LEFT = 0.45;
    var POSITIVE_PROBABILITY_RIGHT = 0.60;

    // Constants
    var BUTTON_NEXT = "Weiter";
    var BUTTON_START = "Start";
    var BUTTON_STOP = "Stop";

    var OPTION_ID_A = "#" + OPTION_ID_PREFIX + OPTION_VALUE_A;
    var OPTION_ID_B = "#" + OPTION_ID_PREFIX + OPTION_VALUE_B;

    var OPTION_ID_PREFIX = 'option_';
    var OPTION_VALUE_A = 'A';
    var OPTION_VALUE_B = 'B';

    var STATE_CHOICE = 2;
    var STATE_RUNNING = 1;
    var STATE_STOPPED = 0;
    var TICK_INTERVAL = 500;

    var ARROW_UP = 'up.svg';
    var ARROW_DOWN = 'down.svg';
    var ARROW_PADDING = 4;

    var arrows = {};
    var UP = +1;
    var DOWN = -1;
    arrows[1] = ARROW_UP;
    arrows[-1] = ARROW_DOWN;

    // Application
    var interval = null;
    var state = STATE_STOPPED;
    var logger = new Logger();

    var keyboard = new Keyboard();
    var ui = new UI();

    function Logger () {

        var EVENT_CHOICE = 'choice';
        var EVENT_CLICK = 'click';
        var EVENT_DEPLETED = 'depleted';
        var EVENT_INIT = 'init';
        var EVENT_SELECT = 'select';
        var EVENT_TICK = 'tick';

        var events = [];

        function log (type, data) {
            var event_ = {}
            event_['type']= type;
            event_['timestamp'] = new Date().toISOString();
            if(data) {
                for(var key in data) {
                    event_[key] = data[key];
                }
            }
            events.push(event_)
        }

        this.clear = function () {
            events = [];
        };

        this.init = function () {
            log(EVENT_INIT);
        };

        this.tick = function (left, right) {
            log(EVENT_TICK, {'left': left, 'right': right});
        };

        this.depleted = function () {
            // this event is raised when there is no more space
            // on the grid but the trial is not over yet.
            log(EVENT_DEPLETED);
        };

        this.click = function () {
            log(EVENT_CLICK);
        };

        this.print = function (text) {
            console.log(text);
        };

        this.events = function () {
            return events;
        };

        this.select = function (value) {
            log(EVENT_SELECT, {'value': value})
        }

        this.choice = function (choice) {
            log(EVENT_CLICK, {'choice': choice})
        }

        this.toList = function () {
            for(var key in events) {
                console.log(JSON.stringify(events[key]));
            }
        }
    }

    function randomDirection (PROPABILITY) {
        if(Math.random() > PROPABILITY) {
            return 1;
        } else {
            return -1;
        }
    }

    function randomPosition () {
        // Using Math.round() will give you a non-uniform distribution!
        return [
            Math.floor(Math.random() * GRID_COLUMNS),
            Math.floor(Math.random() * GRID_ROWS)
        ];
    }

    var ticks = 0;
    var frames = 0;
    function tick (ui) {
        // Limit frame rate
        logger.print(ticks);
        logger.print(frames);

        if (frames >= DURATION_IN_SECONDS) {
            stopTimer(ui);
            state = STATE_CHOICE;
            return;
        }

        ticks += 1;
        if (ticks % 2 == 0) {
            // Framerate Choke
            frames += 1;
            return;
        }
        ui.update(randomDirection, randomPosition);
    }

    function startTimer (ui) {
        ui.start();
        clearInterval(interval);
        interval = setInterval(tick, TICK_INTERVAL, ui);
    }

    function stopTimer (ui) {
        frames = 0;
        ticks = 0;
        clearInterval(interval);
        ui.stop();
    }

    function handleNext (ui) {
        if (state == STATE_STOPPED) {
            state = STATE_RUNNING;
            startTimer(ui);
        } else if (state == STATE_RUNNING) {
            state = STATE_CHOICE;
            stopTimer(ui);
        } else if (state == STATE_CHOICE) {
            state = STATE_STOPPED;
            ui.reset();
        }
    }

    function Grid(element) {
        var self = this;
        this.element = element;
        var positions = {};

        this.clear = function () {
            while (self.element.hasChildNodes()) {
                self.element.removeChild(element.lastChild);
            }
            self.positions = {};
        };

        function mapToCellPixel (position) {
            var cell_width =  Math.floor(self.element.offsetWidth / GRID_COLUMNS);

            var cell_height = Math.floor(self.element.offsetHeight / GRID_ROWS);

            var col = position[0];
            var row = position[1];

            var width = cell_width - ARROW_PADDING;
            var height = cell_height - ARROW_PADDING;

            // Get to the center of cell
            var center_x = (col * cell_width) + (cell_width / 2);
            var center_y = (row * cell_height) + (cell_height / 2);

            // Calculate offset for image hook (topleft corner)
            var pivot_x = Math.round((center_x - (width / 2)));
            var pivot_y = Math.round((center_y - (height / 2)));
            return [pivot_x, pivot_y, width, height];
        }

        function createCheckbox (container, labelText, value) {
            var checkbox = document.createElement('input');
            checkbox.type = "radio";
            checkbox.name = "choice";
            checkbox.value = value;
            var _id = OPTION_ID_PREFIX + value;
            checkbox.id = _id;

            var label = document.createElement('label')
            label.htmlFor = _id;
            var text = document.createTextNode(labelText);
            label.appendChild(text);

            container.appendChild(checkbox);
            container.appendChild(label);
            return checkbox;
        }

        this.displayChoice = function (label, value, select) {
            var checkbox = createCheckbox(self.element, label, value);
            checkbox.addEventListener('change', function (event_, fn) {
                var selectedValue = event_.target.value;
                logger.print(selectedValue);
                select(selectedValue);
            });
        }

        function spaceLeft () {
            var a = Object.keys(positions).length;
            var b = (GRID_COLUMNS * GRID_ROWS);
            return  a < b;
        }

        function generateUniquePosition (generatePosition) {
            if(!spaceLeft()) {
                logger.depleted();
                logger.print('depleted');
                return null;
            }
            // RNG generatePosition returns [rand, rand],
            // and is defined from the outside to be replacable
            var position = generatePosition();
            while(positions[position] && spaceLeft()) {
                position = generatePosition();
            }
            positions[position] = true;
            return position;
        }

        this.update = function (generateValue, generatePosition) {

            var direction = generateValue();

            var position = generateUniquePosition(generatePosition);
            if(position == null) {
                return;
            }

            var point = mapToCellPixel(position);
            var image = new Image();
            image.src = arrows[direction];

            image.style.position = 'absolute';
            image.style.left = (self.element.offsetLeft + point[0]) + "px";
            image.style.top = (self.element.offsetTop + point[1]) + "px";1
            image.style.width = point[2] + "px";
            image.style.height = point[3] + "px";

            self.element.appendChild(image);
            return [direction, position];
        };
    }

    function $$ (marker) {
        // Select multiple elements
        if(marker.indexOf('.') === 0) {
            marker = marker.substring(1)
            return document.getElementsByClassName(marker);
        }
        return document.getElementsByTagName(marker);
    }

    function $ (marker) {
        if(marker.indexOf('#') === 0) {
            marker = marker.substring(1)
            return document.getElementById(marker);
        }
        // Select Single Element
        return $$(marker)[0];
    }

    function UI () {
        var self = this;
        this.handle = function () {};

        var progressBar = $('progress');
        var button = $('button');
        var instruction = $('.instruction');

        var elements = $$('.grid');
        var grid_left = new Grid(elements[0]);
        var grid_right = new Grid(elements[1]);

        function progress (value) {progressBar
            progressBar.value += value;
        };

        this.start = function () {
            resetProgressBar();
            switchToStopButton();
            clearGrids();
        };

        this.stop = function () {
            resetProgressBar();
            switchToStartButton();
            clearGrids();
            showChoice();
        };

        this.reset = function () {
            activateSpacebar();
            clearGrids();
            hideInstruction();
            switchToStartButton();
        };

        this.update = function (randomDirection, randomPosition) {
            progress(1);

            var left = grid_left.update(
                function () {
                    return randomDirection(POSITIVE_PROBABILITY_LEFT);
                },
                randomPosition
            );

            var right = grid_right.update(
                function () {
                    return randomDirection(POSITIVE_PROBABILITY_RIGHT);
                },
                randomPosition
            );
            logger.tick(left, right);
        };

        function resetProgressBar () {
            progressBar.max = DURATION_IN_SECONDS;
            progressBar.value = 0;
        }

        function activateSpacebar () {
            keyboard.register({'space': self.handle});
        };

        function activateChoiceKeys () {
            console.log('Choice keys registerd')
            keyboard.register({
                'F': selectLeft,
                'J': selectRight,
            });
        }

        function selectLeft () {
            $(OPTION_ID_A).checked = true;
        }

        function selectRight () {
            $(OPTION_ID_B).checked = true;
        }

        this.onClick = function (handle) {
            self.handle = handle;
            activateSpacebar();
            button.addEventListener('click', handle)
        };

        function switchToStartButton () {
            button.disabled = false;
            button.innerText = BUTTON_START;
        }

        function switchToStopButton () {
            button.disabled = false;
            button.innerText = BUTTON_STOP;
        }

        function switchToNextButton () {
            button.disabled = true;
            button.innerText = BUTTON_NEXT;
        }

        function clearGrids () {
            grid_left.clear();
            grid_right.clear();
        }

        function showInstruction () {
            instruction.style.display = 'block';
        }

        function hideInstruction () {
            instruction.style.display = 'none';
        }

        function showChoice () {
            showInstruction();
            switchToNextButton();
            activateChoiceKeys();
            grid_left.displayChoice('Option A', OPTION_VALUE_A, select);
            grid_right.displayChoice('Option B', OPTION_VALUE_B, select);
        };

        function select (value) {
            button.disabled = false;
            logger.select(value);
        }

        // Initialize
        (function preloadImages () {
            new Image().src = ARROW_UP;
            new Image().src = ARROW_DOWN;
            logger.print('Arrows preloaded');
        })();

        this.reset();
        logger.init();
    }

    ui.onClick(function () {
        handleNext(ui);
        logger.click()
    });

    window.application = {
        'logger': logger,
        'ui': ui
    };
})(window);